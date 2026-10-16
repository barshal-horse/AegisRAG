"""Tests for Bi-directional Reversible PII Token Vault."""

from app.security.pii_vault import PIITokenVault


def test_inbound_pii_tokenization():
    vault = PIITokenVault(hmac_salt="test_salt_999")
    raw_prompt = "My SSN is 901-44-3321 and my contact email is ceo@company.com with card 4111-2222-3333-4444"

    sanitized, entities = vault.tokenize_text(raw_prompt)

    # Plaintext PII must be completely stripped from prompt
    assert "901-44-3321" not in sanitized
    assert "ceo@company.com" not in sanitized
    assert "4111-2222-3333-4444" not in sanitized

    # Synthetic tokens should be inserted
    assert "<SSN_" in sanitized
    assert "<EMAIL_" in sanitized
    assert "<CREDIT_CARD_" in sanitized
    assert len(entities) == 3


def test_clearance_gated_rehydration():
    vault = PIITokenVault(hmac_salt="test_salt_999")
    raw_text = "Target customer John Doe SSN 901-44-3321 verified."

    sanitized, _ = vault.tokenize_text(raw_text)

    # 1. User with Level 1 (Intern) clearance should NOT rehydrate
    intern_output, was_rehydrated_intern = vault.rehydrate_text(sanitized, user_clearance="LEVEL_1_PUBLIC")
    assert was_rehydrated_intern is False
    assert "901-44-3321" not in intern_output
    assert "[CONFIDENTIAL_SSN]" in intern_output

    # 2. User with Level 4 (Executive) clearance should rehydrate completely
    csuite_output, was_rehydrated_csuite = vault.rehydrate_text(sanitized, user_clearance="LEVEL_4_EXECUTIVE")
    assert was_rehydrated_csuite is True
    assert "901-44-3321" in csuite_output
    assert "[CONFIDENTIAL_SSN]" not in csuite_output
