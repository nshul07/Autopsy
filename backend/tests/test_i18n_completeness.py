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
