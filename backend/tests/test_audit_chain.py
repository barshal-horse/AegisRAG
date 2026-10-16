"""Tests for Cryptographic SQLite WAL Audit Store."""

import hashlib
import json


def test_audit_hash_chain_integrity(isolated_env):
    audit_store = isolated_env["audit_store"]

    rec1 = audit_store.append_audit_record(
        event_id="EVT-001",
        user_id="user_intern",
        query_text="cloud budget",
        filter_mode="aegis_push_down",
        allowed_chunk_ids=["PUB-001"],
        retrieved_chunk_ids=["PUB-001"]
    )

    rec2 = audit_store.append_audit_record(
        event_id="EVT-002",
        user_id="user_csuite",
        query_text="merger deal room",
        filter_mode="aegis_push_down",
        allowed_chunk_ids=["MNA-301", "MNA-302"],
        retrieved_chunk_ids=["MNA-301"]
    )

    # Verify rec2 chained to rec1's current_hash
    assert rec2.previous_hash == rec1.current_hash

    # Verify rec2 digest computation
    hash_input = f"{rec1.current_hash}|{rec2.timestamp}|{rec2.user_id}|{rec2.query_hash}|{json.dumps(rec2.retrieved_chunk_ids, sort_keys=True)}"
    expected_digest = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()
    assert rec2.current_hash == expected_digest
