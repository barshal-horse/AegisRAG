"""AegisRAG Security Proxy Service.

Orchestrates Zero-Trust RAG request lifecycle:
1. Inbound PII Sanitization
2. Zanzibar ReBAC Permission Resolution
3. Push-Down Vector Search (vs Naive Baseline)
4. Outbound Clearance-Gated Rehydration
5. SHA-256 Audit Trail Logging
"""

from typing import List, Dict, Any, Optional
import time
import uuid
import logging

from app.domain.models import (
    RAGQueryRequest,
    RAGQueryResult,
    RetrievedChunk,
    ChaosComparisonResult,
)
from app.rebac.zanzibar import ZanzibarEngine
from app.vector.engine import VectorSearchEngine
from app.security.pii_vault import PIITokenVault
from app.storage.audit_store import AuditStore

logger = logging.getLogger("aegisrag.proxy")


class AegisProxyService:
    """The Principal Security Proxy coordinating ReBAC, Vector, PII Vault, and Audit engines."""

    def __init__(
        self,
        zanzibar: ZanzibarEngine,
        vector_engine: VectorSearchEngine,
        pii_vault: PIITokenVault,
        audit_store: AuditStore
    ):
        self.zanzibar = zanzibar
        self.vector_engine = vector_engine
        self.pii_vault = pii_vault
        self.audit_store = audit_store

    def execute_query(self, request: RAGQueryRequest) -> RAGQueryResult:
        """Execute a secure RAG retrieval lifecycle."""
        start_time = time.perf_counter()
        event_id = f"EVT-SEC-{uuid.uuid4().hex[:8].upper()}"

        # 1. Inbound PII Tokenization Gate
        if request.mask_pii:
            sanitized_query, pii_entities = self.pii_vault.tokenize_text(request.query)
        else:
            sanitized_query = request.query
            pii_entities = []

        # 2. Zanzibar ReBAC Permission Resolution
        user_clearance = self.zanzibar.get_user_clearance(request.user_id)
        allowed_chunk_ids = self.zanzibar.get_authorized_chunk_ids(request.user_id)

        # 3. Vector Similarity Retrieval
        starvation_occurred = False
        starved_count = 0

        if request.filter_mode == "aegis_push_down":
            # [FDE-WHY]: Push-Down Pre-Filtering visits ONLY authorized chunks.
            # Guarantees zero Top-K starvation.
            raw_chunks = self.vector_engine.search_push_down(
                query=sanitized_query,
                allowed_chunk_ids=allowed_chunk_ids,
                top_k=request.top_k
            )
        else:
            # [FDE-WHY]: Naive Post-Filtering searches globally then deletes unauthorized items.
            # Directly triggers Top-K starvation when confidential docs match query semantics.
            raw_chunks, starved_count = self.vector_engine.search_naive_post_filter(
                query=sanitized_query,
                allowed_chunk_ids=allowed_chunk_ids,
                top_k=request.top_k
            )
            if starved_count > 0:
                starvation_occurred = True

        # 4. Outbound Egress PII Rehydration Gate
        sanitized_chunks: List[RetrievedChunk] = []
        for rc in raw_chunks:
            rehydrated_content, was_rehydrated = self.pii_vault.rehydrate_text(
                rc.content,
                user_clearance=user_clearance
            )
            sanitized_chunks.append(
                RetrievedChunk(
                    chunk_id=rc.chunk_id,
                    title=rc.title,
                    content=rehydrated_content,
                    classification=rc.classification,
                    vault_id=rc.vault_id,
                    similarity_score=rc.similarity_score,
                    rehydrated=was_rehydrated
                )
            )

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        retrieved_ids = [c.chunk_id for c in sanitized_chunks]

        # 5. Append to Cryptographic Audit Ledger
        self.audit_store.append_audit_record(
            event_id=event_id,
            user_id=request.user_id,
            query_text=sanitized_query,
            filter_mode=request.filter_mode,
            allowed_chunk_ids=list(allowed_chunk_ids),
            retrieved_chunk_ids=retrieved_ids
        )

        return RAGQueryResult(
            query=request.query,
            user_id=request.user_id,
            user_clearance=user_clearance,
            filter_mode=request.filter_mode,
            chunks_requested=request.top_k,
            chunks_retrieved=len(sanitized_chunks),
            chunks_starved=starved_count,
            starvation_occurred=starvation_occurred,
            chunks=sanitized_chunks,
            sanitized_prompt=sanitized_query if request.mask_pii else None,
            pii_entities_detected=pii_entities,
            execution_time_ms=duration_ms,
            audit_event_id=event_id
        )

    def run_chaos_comparison(self, user_id: str, query: str, top_k: int = 5) -> ChaosComparisonResult:
        """[FDE-WHY]: Side-by-Side Red-Team Diagnostic Comparison.
        Executes the exact same query against both Naive Post-Filtering and
        Aegis Push-Down Pre-Filtering to demonstrate Top-K starvation in real time.
        """
        # Execute Naive Post-Filter
        req_naive = RAGQueryRequest(
            user_id=user_id,
            query=query,
            top_k=top_k,
            filter_mode="naive_post_filter",
            mask_pii=True
        )
        naive_res = self.execute_query(req_naive)

        # Execute Aegis Push-Down
        req_aegis = RAGQueryRequest(
            user_id=user_id,
            query=query,
            top_k=top_k,
            filter_mode="aegis_push_down",
            mask_pii=True
        )
        aegis_res = self.execute_query(req_aegis)

        # Mathematical Proof Formulation
        total_n = self.vector_engine.total_count
        user_m = len(self.zanzibar.get_authorized_chunk_ids(user_id))
        alpha = user_m / total_n if total_n > 0 else 0.0

        starvation_prob = round((1.0 - (1.0 - alpha) ** top_k) * 100, 2) if alpha < 1.0 else 0.0

        math_proof = {
            "total_corpus_chunks": total_n,
            "user_authorized_chunks": user_m,
            "alpha_access_ratio": round(alpha, 4),
            "top_k_requested": top_k,
            "theoretical_starvation_probability_pct": round(100.0 - starvation_prob, 2),
            "naive_chunks_returned": naive_res.chunks_retrieved,
            "naive_chunks_starved": naive_res.chunks_starved,
            "aegis_chunks_returned": aegis_res.chunks_retrieved,
            "aegis_chunks_starved": 0,
            "security_verdict": (
                "CRITICAL_TOP_K_STARVATION_CONFIRMED"
                if naive_res.chunks_starved > 0
                else "EQUIVALENT_RETRIEVAL"
            )
        }

        return ChaosComparisonResult(
            query=query,
            user_id=user_id,
            naive_result=naive_res,
            aegis_result=aegis_res,
            mathematical_proof=math_proof
        )
