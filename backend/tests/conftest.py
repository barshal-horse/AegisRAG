"""Pytest Fixtures for AegisRAG Test Suite."""

import pytest
import os
import sys
import tempfile

# Ensure backend root is on Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.rebac.zanzibar import ZanzibarEngine
from app.vector.engine import VectorSearchEngine
from app.security.pii_vault import PIITokenVault
from app.storage.audit_store import AuditStore
from app.services.aegis_proxy import AegisProxyService
from seed.seed_enterprise_graph import seed_enterprise_environment
from app.main import app


@pytest.fixture
def isolated_env():
    """Create isolated engines with deterministic seed data."""
    zanzibar = ZanzibarEngine()
    vector_engine = VectorSearchEngine(dim=128)
    pii_vault = PIITokenVault(hmac_salt="test_salt_123")

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        temp_db_path = tf.name

    audit_store = AuditStore(db_path=temp_db_path)
    seed_enterprise_environment(zanzibar, vector_engine)

    proxy = AegisProxyService(
        zanzibar=zanzibar,
        vector_engine=vector_engine,
        pii_vault=pii_vault,
        audit_store=audit_store
    )

    yield {
        "zanzibar": zanzibar,
        "vector_engine": vector_engine,
        "pii_vault": pii_vault,
        "audit_store": audit_store,
        "proxy": proxy,
    }

    # Cleanup temp db
    try:
        os.remove(temp_db_path)
        for ext in ("-wal", "-shm"):
            if os.path.exists(temp_db_path + ext):
                os.remove(temp_db_path + ext)
    except Exception:
        pass


@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    with TestClient(app) as tc:
        yield tc
