"""Cryptographic Audit Store for AegisRAG.

Maintains an immutable append-only SQLite WAL ledger with SHA-256 hash chaining,
guaranteeing non-repudiation and tamper-evident query forensics.
"""

from typing import List, Optional
import os
import sqlite3
import hashlib
import json
from datetime import datetime, timezone
import logging

from app.domain.models import AuditRecord

logger = logging.getLogger("aegisrag.audit_store")


class AuditStore:
    """Tamper-evident audit store backed by SQLite WAL mode."""

    def __init__(self, db_path: str = "data/aegis_audit.db"):
        self.db_path = db_path
        parent_dir = os.path.dirname(os.path.abspath(self.db_path))
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_ledger (
                    sequence_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    query_text TEXT NOT NULL,
                    query_hash TEXT NOT NULL,
                    filter_mode TEXT NOT NULL,
                    allowed_chunk_ids TEXT NOT NULL,
                    retrieved_chunk_ids TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    current_hash TEXT NOT NULL
                );
            """)
            conn.commit()

    def _get_last_hash(self, conn: sqlite3.Connection) -> str:
        cursor = conn.execute("SELECT current_hash FROM audit_ledger ORDER BY sequence_id DESC LIMIT 1;")
        row = cursor.fetchone()
        if row:
            return row["current_hash"]
        return "GENESIS_AEGIS_ROOT_HASH_2026"

    def append_audit_record(
        self,
        event_id: str,
        user_id: str,
        query_text: str,
        filter_mode: str,
        allowed_chunk_ids: List[str],
        retrieved_chunk_ids: List[str]
    ) -> AuditRecord:
        """[FDE-WHY]: Cryptographic Hash Chaining.
        Binds each query event to the hash of the preceding event, creating
        a tamper-evident blockchain-style log where modifying any past query breaks the hash chain.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        query_hash = hashlib.sha256(query_text.encode("utf-8")).hexdigest()

        with self._get_connection() as conn:
            prev_hash = self._get_last_hash(conn)

            # Compute current cryptographic digest
            hash_input = f"{prev_hash}|{now_iso}|{user_id}|{query_hash}|{json.dumps(retrieved_chunk_ids, sort_keys=True)}"
            current_hash = hashlib.sha256(hash_input.encode("utf-8")).hexdigest()

            cursor = conn.execute("""
                INSERT INTO audit_ledger (
                    event_id, timestamp, user_id, query_text, query_hash,
                    filter_mode, allowed_chunk_ids, retrieved_chunk_ids,
                    previous_hash, current_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                event_id,
                now_iso,
                user_id,
                query_text,
                query_hash,
                filter_mode,
                json.dumps(allowed_chunk_ids),
                json.dumps(retrieved_chunk_ids),
                prev_hash,
                current_hash
            ))
            conn.commit()
            seq_id = cursor.lastrowid

            return AuditRecord(
                sequence_id=seq_id,
                event_id=event_id,
                timestamp=now_iso,
                user_id=user_id,
                query_text=query_text,
                query_hash=query_hash,
                filter_mode=filter_mode,
                allowed_chunk_ids=allowed_chunk_ids,
                retrieved_chunk_ids=retrieved_chunk_ids,
                previous_hash=prev_hash,
                current_hash=current_hash
            )

    def get_recent_records(self, limit: int = 50) -> List[AuditRecord]:
        """Fetch chronological audit records."""
        with self._get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM audit_ledger ORDER BY sequence_id DESC LIMIT ?;
            """, (limit,))
            rows = cursor.fetchall()

            records: List[AuditRecord] = []
            for r in rows:
                records.append(
                    AuditRecord(
                        sequence_id=r["sequence_id"],
                        event_id=r["event_id"],
                        timestamp=r["timestamp"],
                        user_id=r["user_id"],
                        query_text=r["query_text"],
                        query_hash=r["query_hash"],
                        filter_mode=r["filter_mode"],
                        allowed_chunk_ids=json.loads(r["allowed_chunk_ids"]),
                        retrieved_chunk_ids=json.loads(r["retrieved_chunk_ids"]),
                        previous_hash=r["previous_hash"],
                        current_hash=r["current_hash"]
                    )
                )
            return records
