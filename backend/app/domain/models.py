"""Domain contracts and Pydantic v2 schemas for AegisRAG.

Zero-Trust Push-Down ReBAC Vector Proxy contracts ensuring fail-closed safety,
Zanzibar tuple relationship structures, and cryptographic audit records.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
import uuid


class ZanzibarTuple(BaseModel):
    """Google Zanzibar-style relationship tuple:
    <namespace>:<object_id>#<relation>@<subject_namespace>:<subject_id>[#<subject_relation>]
    Example: vault:executive_mna#viewer@group:csuite_leadership#member
    """
    namespace: str = Field(..., description="Target object namespace (e.g. vault, doc, project)")
    object_id: str = Field(..., description="Target object identifier")
    relation: str = Field(..., description="Relationship name (e.g. viewer, editor, owner, member)")
    subject_namespace: str = Field(..., description="Subject namespace (e.g. user, group, team)")
    subject_id: str = Field(..., description="Subject identifier (e.g. user_intern, group_fin)")
    subject_relation: Optional[str] = Field(None, description="Optional userset relation (e.g. member)")

    @property
    def key(self) -> str:
        base = f"{self.namespace}:{self.object_id}#{self.relation}@{self.subject_namespace}:{self.subject_id}"
        if self.subject_relation:
            base += f"#{self.subject_relation}"
        return base


class DocumentChunk(BaseModel):
    """Single enterprise document chunk indexed in the vector database."""
    chunk_id: str = Field(..., description="Unique chunk identifier (e.g. CHK-1042)")
    title: str = Field(..., description="Document or section title")
    content: str = Field(..., description="Raw text payload of document chunk")
    vault_id: str = Field(..., description="Access-controlled parent vault ID (e.g. vault_public, vault_alpha, vault_mna)")
    classification: str = Field(
        ...,
        description="Data classification level (PUBLIC, PROJECT_ALPHA, COMPLIANCE_AUDIT, EXECUTIVE_RESTRICTED)"
    )
    department: str = Field("General", description="Owning business unit")
    tags: List[str] = Field(default_factory=list)
    embedding: Optional[List[float]] = Field(None, description="Dense embedding vector")


class RAGQueryRequest(BaseModel):
    """Client RAG query payload sent to the security proxy."""
    user_id: str = Field(..., description="Authenticated user identity (e.g. user_intern, user_csuite)")
    query: str = Field(..., min_length=2, max_length=1000, description="Natural language search prompt")
    top_k: int = Field(5, ge=1, le=50, description="Number of nearest chunks requested")
    filter_mode: str = Field(
        "aegis_push_down",
        description="Filter execution strategy: 'aegis_push_down' (safe) or 'naive_post_filter' (vulnerable)"
    )
    mask_pii: bool = Field(True, description="Enable inbound PII tokenization and outbound rehydration")

    @field_validator("filter_mode")
    @classmethod
    def validate_filter_mode(cls, v: str) -> str:
        if v not in ("aegis_push_down", "naive_post_filter"):
            raise ValueError("filter_mode must be either 'aegis_push_down' or 'naive_post_filter'")
        return v


class RetrievedChunk(BaseModel):
    """Sanitized document chunk returned to the caller."""
    chunk_id: str
    title: str
    content: str
    classification: str
    vault_id: str
    similarity_score: float
    rehydrated: bool = False


class RAGQueryResult(BaseModel):
    """Result of an authenticated secure RAG query execution."""
    query: str
    user_id: str
    user_clearance: str
    filter_mode: str
    chunks_requested: int
    chunks_retrieved: int
    chunks_starved: int = Field(
        0, 
        description="Number of chunks that would have been returned but were dropped in post-filtering"
    )
    starvation_occurred: bool = False
    chunks: List[RetrievedChunk]
    sanitized_prompt: Optional[str] = None
    pii_entities_detected: List[str] = Field(default_factory=list)
    execution_time_ms: float
    audit_event_id: str


class ChaosComparisonResult(BaseModel):
    """Side-by-side diagnostic payload demonstrating Top-K starvation in real time."""
    query: str
    user_id: str
    naive_result: RAGQueryResult
    aegis_result: RAGQueryResult
    mathematical_proof: Dict[str, Any]


class AuditRecord(BaseModel):
    """Immutable audit ledger record stored in SQLite WAL store."""
    sequence_id: Optional[int] = None
    event_id: str
    timestamp: str
    user_id: str
    query_text: str
    query_hash: str
    filter_mode: str
    allowed_chunk_ids: List[str]
    retrieved_chunk_ids: List[str]
    previous_hash: str
    current_hash: str
