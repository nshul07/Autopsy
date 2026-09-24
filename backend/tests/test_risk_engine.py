"""Table-driven test asserting the verified scoring vectors from AGENTS.md."""

import pytest
from app.core.risk_engine import score_apk
from app.core.rules_loader import get_rules
from app.models.schemas import CategoryResult, ComponentInfo, ParsedApk

GROUP_PERM = {
    "sms": "android.permission.READ_SMS",
    "contacts": "android.permission.READ_CONTACTS",
    "call_log": "android.permission.READ_CALL_LOG",
    "microphone": "android.permission.RECORD_AUDIO",
    "camera": "android.permission.CAMERA",
    "location": "android.permission.ACCESS_FINE_LOCATION",
    "overlay": "android.permission.SYSTEM_ALERT_WINDOW",
    "install_packages": "android.permission.REQUEST_INSTALL_PACKAGES",
    "calls": "android.permission.CALL_PHONE",
    "all_files": "android.permission.MANAGE_EXTERNAL_STORAGE",
    "boot": "android.permission.RECEIVE_BOOT_COMPLETED",
}


def make_apk(groups: list[str]) -> ParsedApk:
    perms: list[str] = []
    services: list[ComponentInfo] = []
    receivers: list[ComponentInfo] = []

    for g in groups:
        if g == "accessibility":
            services.append(
                ComponentInfo(
                    name="com.example.AccService",
                    permission="BIND_ACCESSIBILITY_SERVICE",
                )
            )
        elif g == "notification_listener":
            services.append(
                ComponentInfo(
                    name="com.example.NotifService",
                    permission="BIND_NOTIFICATION_LISTENER_SERVICE",
                )
            )
        elif g == "device_admin":
            receivers.append(
                ComponentInfo(
                    name="com.example.AdminReceiver",
                    permission="BIND_DEVICE_ADMIN",
                )
            )
        elif g in GROUP_PERM:
            perms.append(GROUP_PERM[g])

    return ParsedApk(
        label="Test App",
        package="com.example.test",
        permissions=perms,
        services=services,
        receivers=receivers,
        has_launcher_activity=True,
    )


@pytest.mark.parametrize(
    "case,category_id,groups,expected_scores,expected_verdict",
    [
        # Case A: 20+15+8+25 + 20 mismatch = 88; with otp_stealer pattern (+15) = 103 -> capped 100
        ("A", "flashlight", ["sms", "contacts", "location", "accessibility"], [88, 100], "red"),
        ("B", "flashlight", ["camera"], [0], "green"),
        ("C", "navigation", ["location"], [0], "green"),
        ("D", "unknown", ["sms"], [20], "green"),
        ("E", "flashlight", ["sms", "contacts", "location", "microphone", "overlay"], [93], "red"),
        ("F", "flashlight", ["sms", "overlay", "accessibility"], [100], "red"),
    ],
)
def test_verified_test_vectors(
    case: str,
    category_id: str,
    groups: list[str],
    expected_scores: list[int],
    expected_verdict: str,
) -> None:
    rules = get_rules()
    apk = make_apk(groups)
    cat_result = CategoryResult(
        id=category_id,
        confidence="medium" if category_id != "unknown" else "low",
        method="keyword" if category_id != "unknown" else "unknown",
    )

    res = score_apk(apk, cat_result, rules)

    assert res.score in expected_scores, (
        f"Case {case} failed: expected score in {expected_scores}, got {res.score}"
    )
    assert res.verdict == expected_verdict, (
        f"Case {case} failed: expected verdict {expected_verdict}, got {res.verdict}"
    )


def test_permission_groups_score_once() -> None:
    rules = get_rules()
    apk = ParsedApk(
        label="SMS Multi",
        package="com.example.sms",
        permissions=[
            "android.permission.READ_SMS",
            "android.permission.RECEIVE_SMS",
            "android.permission.SEND_SMS",
        ],
        has_launcher_activity=True,
    )
    cat = CategoryResult(id="flashlight", confidence="medium", method="keyword")
    res = score_apk(apk, cat, rules)
    assert res.score == 40
