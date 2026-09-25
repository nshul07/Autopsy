import json
from pathlib import Path
import pytest

from app.config import DATA_DIR
from app.core.i18n import SUPPORTED_LANGS, get_catalog


def test_i18n_completeness() -> None:
    reason_keys_file = DATA_DIR / "reason_keys.json"
    assert reason_keys_file.exists(), "reason_keys.json is missing!"

    with reason_keys_file.open(encoding="utf-8") as f:
        frozen_keys = set(json.load(f))

    for lang in SUPPORTED_LANGS:
        catalog = get_catalog(lang)
        missing = [k for k in frozen_keys if catalog.get(k) is None]
        assert not missing, f"Language '{lang}' is missing keys: {missing}"


# ---- interpolation is a literal substitution, not a format language ---------


def test_param_values_are_never_interpreted() -> None:
    """Report text is attacker-influenced: {decoded} and {brand} come from the
    URL under analysis. Python's str.format parses a format mini-language over
    whatever it is handed, so a hostile param value could reach attribute
    access or a format spec. The replacement is a literal scan-and-substitute,
    and this test is what keeps it that way."""
    from app.core.i18n import get_catalog

    catalog = get_catalog("en")
    for hostile in ("{0.__class__}", "{decoded:*^40}", "{0[0]}", "{}"):
        rendered = catalog.text("link.punycode", decoded=hostile)
        assert hostile in rendered, f"value was interpreted: {hostile!r} -> {rendered!r}"


def test_missing_param_leaves_the_placeholder_visible() -> None:
    """A visibly broken sentence is a content bug someone reports; a silently
    blanked one is a bug nobody notices."""
    from app.core.i18n import get_catalog

    rendered = get_catalog("en").text("link.punycode")
    assert "{decoded}" in rendered


def test_interpolate_substitutes_every_named_param() -> None:
    from app.core.i18n import interpolate

    assert interpolate("{a} and {b}", {"a": "1", "b": 2}) == "1 and 2"
    # Unknown names stay; a stray brace that is not a placeholder is untouched.
    assert interpolate("{a} {missing}", {"a": "x"}) == "x {missing}"
    assert interpolate("100% {not a param}", {"not": "y"}) == "100% {not a param}"
