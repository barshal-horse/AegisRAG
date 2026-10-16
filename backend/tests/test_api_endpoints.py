"""Tests for FastAPI HTTP Endpoints."""


def test_health_endpoints(client):
    res_live = client.get("/api/v1/health/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "alive"

    res_ready = client.get("/api/v1/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"


def test_query_api_push_down(client):
    payload = {
        "user_id": "user_intern",
        "query": "cloud infrastructure budgeting rules",
        "top_k": 3,
        "filter_mode": "aegis_push_down",
        "mask_pii": True
    }
    res = client.post("/api/v1/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "user_intern"
    assert data["filter_mode"] == "aegis_push_down"
    assert data["chunks_retrieved"] > 0
    assert data["starvation_occurred"] is False


def test_chaos_compare_endpoint(client):
    params = {
        "user_id": "user_intern",
        "query": "executive compensation and stock options targets",
        "top_k": 5
    }
    res = client.post("/api/v1/chaos/compare", params=params)
    assert res.status_code == 200
    data = res.json()
    assert "naive_result" in data
    assert "aegis_result" in data
    assert "mathematical_proof" in data
    assert data["mathematical_proof"]["security_verdict"] == "CRITICAL_TOP_K_STARVATION_CONFIRMED"


def test_user_vaults_endpoint(client):
    res = client.get("/api/v1/rebac/user/user_pm/vaults")
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "user_pm"
    assert "vault_alpha" in data["authorized_vaults"]
    assert "vault_mna" not in data["authorized_vaults"]


def test_audit_telemetry_endpoint(client):
    # Trigger a query first
    client.post("/api/v1/query", json={
        "user_id": "user_auditor",
        "query": "SOC-2 audit log and customer PII",
        "top_k": 2
    })

    res = client.get("/api/v1/telemetry/audit?limit=10")
    assert res.status_code == 200
    records = res.json()
    assert len(records) > 0
    assert records[0]["user_id"] == "user_auditor"
