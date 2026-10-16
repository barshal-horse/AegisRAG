"""FastAPI Router for AegisRAG REST Endpoints.

Provides secure RAG retrieval, Zanzibar graph inspection,
cryptographic audit stream, and side-by-side chaos starvation diagnostics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Dict, Any

from app.domain.models import (
    RAGQueryRequest,
    RAGQueryResult,
    ChaosComparisonResult,
    AuditRecord,
    ZanzibarTuple,
)
from app.services.aegis_proxy import AegisProxyService
from app.rebac.zanzibar import ZanzibarEngine
from app.storage.audit_store import AuditStore
from app.api.dependencies import (
    get_proxy_service,
    get_zanzibar,
    get_audit_store,
)

router = APIRouter(prefix="/api/v1", tags=["AegisRAG Secure Proxy"])


@router.post("/query", response_model=RAGQueryResult, status_code=status.HTTP_200_OK)
async def query_secure_rag(
    request: RAGQueryRequest,
    proxy: AegisProxyService = Depends(get_proxy_service)
) -> RAGQueryResult:
    """Execute authenticated RAG query with push-down ReBAC pre-filtering."""
    try:
        return proxy.execute_query(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Security proxy query execution error: {str(e)}"
        )


@router.post("/chaos/compare", response_model=ChaosComparisonResult, status_code=status.HTTP_200_OK)
async def compare_starvation(
    user_id: str = Query(..., description="Target persona ID (e.g. user_intern, user_pm)"),
    query: str = Query(..., min_length=2, description="Target search query to probe"),
    top_k: int = Query(5, ge=1, le=20, description="Top K nearest neighbors"),
    proxy: AegisProxyService = Depends(get_proxy_service)
) -> ChaosComparisonResult:
    """[FDE-WHY]: Live Red-Team Diagnostic Endpoint.
    Demonstrates Top-K starvation in real time by executing Naive Post-Filtering
    and Aegis Push-Down Pre-Filtering simultaneously on the exact same query.
    """
    try:
        return proxy.run_chaos_comparison(user_id=user_id, query=query, top_k=top_k)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chaos comparison simulation error: {str(e)}"
        )


@router.get("/rebac/tuples", response_model=List[ZanzibarTuple], status_code=status.HTTP_200_OK)
async def get_all_tuples(
    zanzibar: ZanzibarEngine = Depends(get_zanzibar)
) -> List[ZanzibarTuple]:
    """Retrieve all active Google Zanzibar relationship tuples."""
    return zanzibar.get_all_tuples()


@router.get("/rebac/user/{user_id}/vaults", status_code=status.HTTP_200_OK)
async def get_user_vaults(
    user_id: str,
    zanzibar: ZanzibarEngine = Depends(get_zanzibar)
) -> Dict[str, Any]:
    """Inspect all enterprise vaults and chunks reachable by a user in the Zanzibar graph."""
    vaults = list(zanzibar.get_authorized_vaults(user_id))
    chunks = list(zanzibar.get_authorized_chunk_ids(user_id))
    clearance = zanzibar.get_user_clearance(user_id)
    return {
        "user_id": user_id,
        "clearance": clearance,
        "authorized_vault_count": len(vaults),
        "authorized_vaults": vaults,
        "authorized_chunk_count": len(chunks),
        "authorized_chunk_ids": sorted(chunks),
    }


@router.get("/telemetry/audit", response_model=List[AuditRecord], status_code=status.HTTP_200_OK)
async def get_audit_trail(
    limit: int = Query(50, ge=1, le=200),
    audit_store: AuditStore = Depends(get_audit_store)
) -> List[AuditRecord]:
    """Fetch cryptographic SHA-256 chained audit ledger records."""
    return audit_store.get_recent_records(limit=limit)


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def health_live():
    return {"status": "alive", "service": "AegisRAG Zero-Trust Vector Proxy"}


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def health_ready():
    return {"status": "ready", "database": "sqlite_wal", "rebac": "synced"}
