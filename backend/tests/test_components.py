import pytest
from app.core.permissions import component_group_ids
from app.core.rules_loader import get_rules
from app.models.schemas import ComponentInfo


def test_accessibility_dual_detection() -> None:
    rules = get_rules()

    # Form 1: via permission attribute
    services_perm = [
        ComponentInfo(
            name="com.example.AccService",
            permission="BIND_ACCESSIBILITY_SERVICE",
        )
    ]
    groups_1 = component_group_ids(services_perm, [], rules)
    assert "accessibility" in groups_1

    # Form 2: via meta-data attribute (banking trojan trick)
    services_meta = [
        ComponentInfo(
            name="com.example.SneakyService",
            permission=None,
            meta_data_names=["android.accessibilityservice"],
        )
    ]
    groups_2 = component_group_ids(services_meta, [], rules)
    assert "accessibility" in groups_2


def test_notification_and_device_admin_components() -> None:
    rules = get_rules()

    services = [
        ComponentInfo(
            name="com.example.NotifService",
            permission="BIND_NOTIFICATION_LISTENER_SERVICE",
        )
    ]
    receivers = [
        ComponentInfo(
            name="com.example.AdminReceiver",
            permission="BIND_DEVICE_ADMIN",
        )
    ]

    groups = component_group_ids(services, receivers, rules)
    assert "notification_listener" in groups
    assert "device_admin" in groups
