"""FastAPI Dependency Injection Providers for AegisRAG.

Manages application singletons: ZanzibarEngine, VectorSearchEngine,
PIITokenVault, AuditStore, and AegisProxyService.
"""

from functools import lru_cache

from app.rebac.zanzibar import ZanzibarEngine
from app.vector.engine import VectorSearchEngine
from app.security.pii_vault import PIITokenVault
from app.storage.audit_store import AuditStore
from app.services.aegis_proxy import AegisProxyService
from seed.seed_enterprise_graph import seed_enterprise_environment

import os
from pathlib import Path

# Module-level singletons
_default_db = os.getenv("AEGIS_DB_PATH")
if not _default_db:
    _candidate = Path(__file__).resolve().parent.parent.parent.parent / "data" / "aegis_audit.db"
    _default_db = str(_candidate)

_zanzibar = ZanzibarEngine()
_vector_engine = VectorSearchEngine(dim=128)
_pii_vault = PIITokenVault()
_audit_store = AuditStore(db_path=_default_db)
_proxy_service = AegisProxyService(
    zanzibar=_zanzibar,
    vector_engine=_vector_engine,
    pii_vault=_pii_vault,
    audit_store=_audit_store
)
_seeded = False


def bootstrap_system():
    """Seed system with enterprise graph and document corpus on startup."""
    global _seeded
    if not _seeded:
        seed_enterprise_environment(_zanzibar, _vector_engine)
        _seeded = True


def get_zanzibar() -> ZanzibarEngine:
    return _zanzibar


def get_vector_engine() -> VectorSearchEngine:
    return _vector_engine


def get_pii_vault() -> PIITokenVault:
    return _pii_vault


def get_audit_store() -> AuditStore:
    return _audit_store


def get_proxy_service() -> AegisProxyService:
    return _proxy_service
