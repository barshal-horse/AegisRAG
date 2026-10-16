"""Tests proving Top-K Starvation in Naive Post-Filtering vs Aegis Push-Down Pre-Filtering."""

from app.domain.models import RAGQueryRequest


def test_top_k_starvation_in_naive_post_filtering(isolated_env):
    """[FDE-WHY]: Proves mathematical starvation flaw in naive RAG implementations."""
    proxy = isolated_env["proxy"]

    # Intern asks a query heavily matching executive compensation & M&A files
    query = "executive compensation, bonus pool, and stock targets allocation"

    # 1. Run Naive Post-Filter
    req_naive = RAGQueryRequest(
        user_id="user_intern",
        query=query,
        top_k=5,
        filter_mode="naive_post_filter",
        mask_pii=True
    )
    res_naive = proxy.execute_query(req_naive)

    # Naive post-filtering pulls confidential chunks, deletes them in Python, and starves the user
    assert res_naive.chunks_starved > 0
    assert res_naive.starvation_occurred is True
    # The intern receives fewer chunks than requested despite valid public docs existing
    assert res_naive.chunks_retrieved < req_naive.top_k


def test_zero_starvation_in_aegis_push_down(isolated_env):
    """[FDE-WHY]: Proves Push-Down Pre-Filtering guarantees full Top-K retrieval."""
    proxy = isolated_env["proxy"]

    query = "executive compensation, bonus pool, and stock targets allocation"

    # 2. Run Aegis Push-Down Pre-Filter on the EXACT same query
    req_aegis = RAGQueryRequest(
        user_id="user_intern",
        query=query,
        top_k=4,
        filter_mode="aegis_push_down",
        mask_pii=True
    )
    res_aegis = proxy.execute_query(req_aegis)

    # In Aegis push-down, zero chunks are starved
    assert res_aegis.chunks_starved == 0
    assert res_aegis.starvation_occurred is False
    # User gets all 4 authorized public chunks
    assert res_aegis.chunks_retrieved == 4

    # Every single returned chunk belongs strictly to the user's permissible vault (vault_public)
    for chunk in res_aegis.chunks:
        assert chunk.vault_id == "vault_public"
        assert chunk.classification == "PUBLIC"


def test_csuite_retrieves_confidential_vaults(isolated_env):
    """Executive user possesses clearance to retrieve M&A and Alpha documents."""
    proxy = isolated_env["proxy"]

    query = "target acquisition memo and corporate card wire"
    req = RAGQueryRequest(
        user_id="user_csuite",
        query=query,
        top_k=3,
        filter_mode="aegis_push_down",
        mask_pii=True
    )
    res = proxy.execute_query(req)

    assert res.chunks_retrieved == 3
    assert res.chunks_starved == 0
    # Top chunk should be MNA-302
    assert any(c.chunk_id == "MNA-302" for c in res.chunks)
