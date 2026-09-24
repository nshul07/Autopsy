import pytest
from app.core.patterns import matched_patterns
from app.core.rules_loader import get_rules


def test_scam_patterns() -> None:
    rules = get_rules()

    # Banking trojan: overlay + accessibility + sms
    matches = matched_patterns(
        frozenset({"overlay", "accessibility", "sms"}),
        category_id="flashlight",
        has_launcher_activity=True,
        rules=rules,
    )
    ids = {m.id for m in matches}
    assert "banking_trojan" in ids
    assert "otp_stealer" in ids

    # Dropper: install_packages (excluded for app_store)
    matches_dropper = matched_patterns(
        frozenset({"install_packages"}),
        category_id="game",
        has_launcher_activity=True,
        rules=rules,
    )
    assert any(m.id == "dropper" for m in matches_dropper)

    matches_appstore = matched_patterns(
        frozenset({"install_packages"}),
        category_id="app_store",
        has_launcher_activity=True,
        rules=rules,
    )
    assert not any(m.id == "dropper" for m in matches_appstore)

    # Spyware profile: critical if no launcher
    matches_spyware_launcher = matched_patterns(
        frozenset({"microphone", "camera", "location", "boot"}),
        category_id="game",
        has_launcher_activity=True,
        rules=rules,
    )
    spy_launcher = next(m for m in matches_spyware_launcher if m.id == "spyware_profile")
    assert not spy_launcher.critical

    matches_spyware_nolauncher = matched_patterns(
        frozenset({"microphone", "camera", "location", "boot"}),
        category_id="game",
        has_launcher_activity=False,
        rules=rules,
    )
    spy_nolauncher = next(m for m in matches_spyware_nolauncher if m.id == "spyware_profile")
    assert spy_nolauncher.critical
