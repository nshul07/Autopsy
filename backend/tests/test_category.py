import pytest
from app.core.category import detect_category
from app.core.rules_loader import get_rules


def test_category_priority() -> None:
    rules = get_rules()

    # User choice wins with high confidence
    res_user = detect_category("Flashlight Pro", "com.example.flashlight", "calculator", rules)
    assert res_user.id == "calculator"
    assert res_user.confidence == "high"
    assert res_user.method == "user"

    # Label match wins over package name with medium confidence
    res_label = detect_category("Super Flashlight", "com.example.calculator", None, rules)
    assert res_label.id == "flashlight"
    assert res_label.confidence == "medium"
    assert res_label.method == "keyword"

    # Package match when label has no keyword
    res_pkg = detect_category("My Utility", "com.android.calculator", None, rules)
    assert res_pkg.id == "calculator"
    assert res_pkg.confidence == "low"
    assert res_pkg.method == "keyword"

    # Unknown category fallback
    res_unknown = detect_category("Random App", "com.xyz.abc", None, rules)
    assert res_unknown.id == "unknown"
    assert res_unknown.confidence == "low"
    assert res_unknown.method == "unknown"
