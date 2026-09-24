#!/usr/bin/env python3
"""Validates that all reason_keys and message strings exist across EN, HI, and PA.

Fails (exit code 1) if any key in reason_keys.json or messages_en.json is missing
from messages_hi.json or messages_pa.json, or if playbook strings are missing.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parent
DATA_DIR = REPO_ROOT / "backend" / "app" / "data"

LANGUAGES = ("en", "hi", "pa")


def check_messages() -> list[str]:
    errors: list[str] = []

    reason_keys_file = DATA_DIR / "reason_keys.json"
    if not reason_keys_file.exists():
        return ["reason_keys.json is missing! Run tools/freeze_reason_keys.py first."]

    with reason_keys_file.open(encoding="utf-8") as f:
        reason_keys = set(json.load(f))

    catalogs: dict[str, dict[str, str]] = {}
    for lang in LANGUAGES:
        path = DATA_DIR / f"messages_{lang}.json"
        if not path.exists():
            errors.append(f"Missing messages file: {path.name}")
            continue
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
            catalogs[lang] = {k: v for k, v in data.items() if not k.startswith("_")}

    for lang in LANGUAGES:
        if lang not in catalogs:
            continue
        cat = catalogs[lang]
        missing = sorted(reason_keys - set(cat.keys()))
        if missing:
            errors.append(
                f"Language '{lang}' is missing {len(missing)} reason key(s): "
                + ", ".join(missing[:5])
                + ("..." if len(missing) > 5 else "")
            )

    # Check playbook files
    playbooks: dict[str, dict] = {}
    for lang in LANGUAGES:
        path = DATA_DIR / f"playbook_{lang}.json"
        if not path.exists():
            errors.append(f"Missing playbook file: {path.name}")
            continue
        with path.open(encoding="utf-8") as f:
            playbooks[lang] = json.load(f)

    if "en" in playbooks:
        en_strings = set(playbooks["en"].get("strings", {}).keys())
        for lang in ("hi", "pa"):
            if lang in playbooks:
                lang_strings = set(playbooks[lang].get("strings", {}).keys())
                missing = sorted(en_strings - lang_strings)
                if missing:
                    errors.append(f"Playbook '{lang}' is missing strings: {missing}")

    return errors


def main() -> None:
    errors = check_messages()
    if errors:
        print("i18n check failed:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)
    print("i18n check passed: all keys exist in EN, HI, and PA.")


if __name__ == "__main__":
    main()
