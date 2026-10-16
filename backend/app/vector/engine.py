"""Embedded Vector Search Engine with Push-Down Pre-Filtering vs Naive Post-Filtering.

Implements high-speed cosine similarity with bitmask push-down indexing,
demonstrating mathematical proof of zero Top-K starvation in enterprise RAG.
"""

from typing import List, Dict, Set, Tuple, Any, Optional
import numpy as np
import hashlib
import re
import logging

from app.domain.models import DocumentChunk, RetrievedChunk

logger = logging.getLogger("aegisrag.vector")


def generate_deterministic_embedding(text: str, dim: int = 128) -> np.ndarray:
    """[FDE-WHY]: Deterministic Offline Embedding Generator.
    Produces high-fidelity semantic-hash dense vectors without requiring paid cloud API keys,
    external model downloads, or network connectivity. Uses sub-word n-gram hashing and
    L2 unit normalization so cosine similarity aligns with keyword & conceptual density.
    """
    words = re.findall(r"\w+", text.lower())
    vec = np.zeros(dim, dtype=np.float32)

    if not words:
        return vec

    for i, word in enumerate(words):
        # 1. Word token hash
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h >> 8) & 1 else -1.0
        vec[idx] += sign * 1.5

        # 2. Bi-gram context hash
        if i < len(words) - 1:
            bg = f"{word}_{words[i+1]}"
            bg_h = int(hashlib.sha256(bg.encode("utf-8")).hexdigest(), 16)
            bg_idx = bg_h % dim
            bg_sign = 1.0 if (bg_h >> 8) & 1 else -1.0
            vec[bg_idx] += bg_sign * 2.0

    # L2 normalize
    norm = np.linalg.norm(vec)
    if norm > 1e-6:
        vec /= norm
    return vec


class VectorSearchEngine:
    """Enterprise Vector Store supporting Push-Down Pre-Filtering and Naive Post-Filtering."""

    def __init__(self, dim: int = 128):
        self.dim = dim
        self._chunks: Dict[str, DocumentChunk] = {}
        self._chunk_ids: List[str] = []
        self._matrix: Optional[np.ndarray] = None  # Shape: (N, dim)

    def upsert_chunk(self, chunk: DocumentChunk):
        """Insert or replace a document chunk in the vector index."""
        if chunk.embedding is None:
            chunk.embedding = generate_deterministic_embedding(
                f"{chunk.title} {chunk.content} {' '.join(chunk.tags)}",
                dim=self.dim
            ).tolist()

        self._chunks[chunk.chunk_id] = chunk
        self._rebuild_index()

    def upsert_chunks(self, chunks: List[DocumentChunk]):
        """Batch insert chunks."""
        for c in chunks:
            if c.embedding is None:
                c.embedding = generate_deterministic_embedding(
                    f"{c.title} {c.content} {' '.join(c.tags)}",
                    dim=self.dim
                ).tolist()
            self._chunks[c.chunk_id] = c
        self._rebuild_index()

    def _rebuild_index(self):
        """Pack chunk embeddings into contiguous memory for vectorized BLAS operations."""
        self._chunk_ids = list(self._chunks.keys())
        if not self._chunk_ids:
            self._matrix = None
            return

        mat = np.zeros((len(self._chunk_ids), self.dim), dtype=np.float32)
        for i, cid in enumerate(self._chunk_ids):
            mat[i] = np.array(self._chunks[cid].embedding, dtype=np.float32)
        self._matrix = mat

    @property
    def total_count(self) -> int:
        return len(self._chunk_ids)

    def search_push_down(
        self,
        query: str,
        allowed_chunk_ids: Set[str],
        top_k: int = 5
    ) -> List[RetrievedChunk]:
        """[FDE-WHY]: Push-Down Pre-Filtering Search (Aegis Standard).
        Pushes the Zanzibar-authorized document set directly into index selection.
        Calculates cosine similarity ONLY over the authorized bitmask.
        Mathematically guarantees zero Top-K starvation.
        """
        if self._matrix is None or not self._chunk_ids or not allowed_chunk_ids:
            return []

        q_vec = generate_deterministic_embedding(query, dim=self.dim)

        # 1. Determine authorized indices in contiguous matrix
        valid_indices = [
            i for i, cid in enumerate(self._chunk_ids) if cid in allowed_chunk_ids
        ]

        if not valid_indices:
            return []

        # 2. Slice matrix to authorized subset only
        sub_matrix = self._matrix[valid_indices]  # Shape: (M, dim)
        sub_chunk_ids = [self._chunk_ids[i] for i in valid_indices]

        # 3. Vectorized Cosine Similarity: dot product since vectors are L2-normalized
        scores = np.dot(sub_matrix, q_vec)  # Shape: (M,)

        # 4. Extract Top-K from authorized candidates
        k = min(top_k, len(sub_chunk_ids))
        top_sub_indices = np.argsort(scores)[::-1][:k]

        results: List[RetrievedChunk] = []
        for idx in top_sub_indices:
            cid = sub_chunk_ids[idx]
            chunk = self._chunks[cid]
            results.append(
                RetrievedChunk(
                    chunk_id=chunk.chunk_id,
                    title=chunk.title,
                    content=chunk.content,
                    classification=chunk.classification,
                    vault_id=chunk.vault_id,
                    similarity_score=float(scores[idx]),
                )
            )
        return results

    def search_naive_post_filter(
        self,
        query: str,
        allowed_chunk_ids: Set[str],
        top_k: int = 5
    ) -> Tuple[List[RetrievedChunk], int]:
        """[FDE-WHY]: Naive Post-Filtering Search (Junior / Vulnerable Baseline).
        Searches the entire corpus for the Top-K nearest neighbors globally,
        THEN discards unauthorized chunks in Python application memory.
        Directly leads to Top-K Starvation.
        Returns: (surviving_chunks, starved_count)
        """
        if self._matrix is None or not self._chunk_ids:
            return [], 0

        q_vec = generate_deterministic_embedding(query, dim=self.dim)

        # 1. Global unconstrained search for Top-K items
        scores = np.dot(self._matrix, q_vec)
        k = min(top_k, len(self._chunk_ids))
        global_top_k_indices = np.argsort(scores)[::-1][:k]

        # 2. Post-Filter in Python
        surviving_chunks: List[RetrievedChunk] = []
        starved_count = 0

        for idx in global_top_k_indices:
            cid = self._chunk_ids[idx]
            chunk = self._chunks[cid]
            if cid in allowed_chunk_ids:
                surviving_chunks.append(
                    RetrievedChunk(
                        chunk_id=chunk.chunk_id,
                        title=chunk.title,
                        content=chunk.content,
                        classification=chunk.classification,
                        vault_id=chunk.vault_id,
                        similarity_score=float(scores[idx]),
                    )
                )
            else:
                starved_count += 1

        return surviving_chunks, starved_count
