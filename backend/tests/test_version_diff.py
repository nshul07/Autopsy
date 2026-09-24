import pytest
from app.intel.version_diff import compute_version_diff


def test_version_diff_first_scan() -> None:
    diff = compute_version_diff(None, 1, ["cert1"], frozenset({"camera"}))
    assert not diff.has_history


def test_version_diff_updates() -> None:
    history = {
        "package": "com.example.app",
        "version_code": 1,
        "cert_sha256": "cert1",
        "groups": ["camera"],
    }

    # Version 2 added SMS and changed cert
    diff = compute_version_diff(
        history,
        current_version_code=2,
        current_cert_sha256=["cert2"],
        current_groups=frozenset({"camera", "sms"}),
    )

    assert diff.has_history
    assert diff.groups_added == ["sms"]
    assert diff.groups_removed == []
    assert diff.version_changed
    assert diff.cert_changed
