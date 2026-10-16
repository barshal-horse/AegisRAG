"""Bi-directional Reversible PII Tokenization Vault.

Sanitizes inbound prompts before vector search / LLM transmission,
and enforces clearance-gated rehydration at the egress boundary.
"""

from typing import Tuple, Dict, List, Optional
import re
import hashlib
import logging

logger = logging.getLogger("aegisrag.pii_vault")


class PIITokenVault:
    """Enterprise Reversible PII Vault."""

    # Pre-compiled high-performance regex patterns
    PATTERNS = {
        "SSN": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        "CREDIT_CARD": re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
        "EMAIL": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
        "PHONE": re.compile(r"\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b"),
    }

    def __init__(self, hmac_salt: str = "aegis_fde_production_salt_2026"):
        self.salt = hmac_salt
        # Token to Plaintext lookup: token -> plaintext
        self._vault_store: Dict[str, str] = {}
        # Plaintext to Token lookup: plaintext -> token
        self._reverse_store: Dict[str, str] = {}

    def _generate_token(self, entity_type: str, plaintext: str) -> str:
        """Deterministically generate opaque token for consistent session re-use."""
        digest = hashlib.sha256(f"{self.salt}:{entity_type}:{plaintext}".encode("utf-8")).hexdigest()[:6].upper()
        return f"<{entity_type}_{digest}>"

    def tokenize_text(self, text: str) -> Tuple[str, List[str]]:
        """[FDE-WHY]: Inbound Ingress Sanitization.
        Scans inbound prompts for sensitive identifiers, records tokens in the vault,
        and returns the sanitized string safe for cloud LLM and vector search transmission.
        """
        sanitized = text
        detected_entities: List[str] = []

        for entity_type, pattern in self.PATTERNS.items():
            matches = pattern.findall(sanitized)
            for match in matches:
                if match not in self._reverse_store:
                    token = self._generate_token(entity_type, match)
                    self._vault_store[token] = match
                    self._reverse_store[match] = token
                else:
                    token = self._reverse_store[match]

                sanitized = sanitized.replace(match, token)
                detected_entities.append(f"{entity_type}:{token}")

        return sanitized, detected_entities

    def rehydrate_text(self, text: str, user_clearance: str) -> Tuple[str, bool]:
        """[FDE-WHY]: Egress Clearance Gate.
        Rehydrates synthetic tokens back to original plaintext only if the caller
        possesses sufficient clearance (Level 3 Audit or Level 4 Executive).
        Otherwise, converts tokens into user-safe generic redaction badges.
        """
        # Only Level 3 (Compliance) and Level 4 (Executive) can rehydrate PII
        can_rehydrate = user_clearance in ("LEVEL_3_COMPLIANCE", "LEVEL_4_EXECUTIVE")

        rehydrated = text
        rehydration_occurred = False

        # Scan for any stored tokens
        for token, plaintext in self._vault_store.items():
            if token in rehydrated:
                if can_rehydrate:
                    rehydrated = rehydrated.replace(token, plaintext)
                    rehydration_occurred = True
                else:
                    # Replace with friendly redacted badge
                    entity_type = token.strip("<>").split("_")[0]
                    rehydrated = rehydrated.replace(token, f"[CONFIDENTIAL_{entity_type}]")

        return rehydrated, rehydration_occurred
