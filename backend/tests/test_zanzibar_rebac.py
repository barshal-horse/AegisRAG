"""Tests for Google Zanzibar ReBAC Engine."""

from app.domain.models import ZanzibarTuple


def test_direct_tuple_authorization(isolated_env):
    zanzibar = isolated_env["zanzibar"]
    # user_intern is member of group:interns which views vault:vault_public
    assert zanzibar.check_access("user_intern", "vault", "vault_public", "viewer") is True
    # user_intern should NOT have access to vault_mna
    assert zanzibar.check_access("user_intern", "vault", "vault_mna", "viewer") is False


def test_transitive_graph_reachability(isolated_env):
    zanzibar = isolated_env["zanzibar"]
    # user_pm -> team:fintech -> project:alpha -> vault:vault_alpha
    assert zanzibar.check_access("user_pm", "vault", "vault_alpha", "viewer") is True
    # user_pm cannot see vault_mna
    assert zanzibar.check_access("user_pm", "vault", "vault_mna", "viewer") is False


def test_csuite_full_clearance(isolated_env):
    zanzibar = isolated_env["zanzibar"]
    # user_csuite can reach all 4 vaults
    vaults = zanzibar.get_authorized_vaults("user_csuite")
    assert "vault_public" in vaults
    assert "vault_alpha" in vaults
    assert "vault_compliance" in vaults
    assert "vault_mna" in vaults


def test_cycle_protection(isolated_env):
    zanzibar = isolated_env["zanzibar"]
    # Inject deliberate cycle: group:A#member@group:B#member and group:B#member@group:A#member
    zanzibar.write_tuple(ZanzibarTuple(
        namespace="group", object_id="cycle_a", relation="member",
        subject_namespace="group", subject_id="cycle_b", subject_relation="member"
    ))
    zanzibar.write_tuple(ZanzibarTuple(
        namespace="group", object_id="cycle_b", relation="member",
        subject_namespace="group", subject_id="cycle_a", subject_relation="member"
    ))
    zanzibar.write_tuple(ZanzibarTuple(
        namespace="group", object_id="cycle_b", relation="member",
        subject_namespace="user", subject_id="test_cyclist"
    ))

    # Should safely terminate and return False without infinite loop
    result = zanzibar.check_access("test_cyclist", "vault", "non_existent_vault", "viewer")
    assert result is False
