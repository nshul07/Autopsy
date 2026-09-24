#!/usr/bin/env python3
"""Generates backend/app/data/reason_keys.json from rules, patterns, and categories.

Enforces that every reason_key used by the scoring engine and reporting pipeline
is tracked and frozen.
"""

from __future__ import annotations

import json
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REPO_ROOT = TOOLS_DIR.parent
DATA_DIR = REPO_ROOT / "backend" / "app" / "data"


def extract_reason_keys() -> list[str]:
    keys: set[str] = set()

    # 1. From rules.json
    rules_file = DATA_DIR / "rules.json"
    if rules_file.exists():
        with rules_file.open(encoding="utf-8") as f:
            rules_data = json.load(f)
            for band in rules_data.get("bands", []):
                if "label_key" in band:
                    keys.add(band["label_key"])
                if "recommendation" in band:
                    keys.add(f"recommendation.{band['recommendation']}")
            for group_id, group_info in rules_data.get("groups", {}).items():
                if "label_key" in group_info:
                    keys.add(group_info["label_key"])

    # 2. Fixed rule keys
    keys.update({
        "perm.expected",
        "perm.unexpected",
        "perm.info",
        "rule.many_sensitive",
        "rule.mismatch",
        "impersonation.detected",
    })

    # 3. From patterns.json
    patterns_file = DATA_DIR / "patterns.json"
    if patterns_file.exists():
        with patterns_file.open(encoding="utf-8") as f:
            patterns_data = json.load(f)
            for p in patterns_data.get("patterns", []):
                if "reason_key" in p:
                    keys.add(p["reason_key"])

    # 4. From categories.json
    categories_file = DATA_DIR / "categories.json"
    if categories_file.exists():
        with categories_file.open(encoding="utf-8") as f:
            cats = json.load(f).get("categories", {})
            for cat_id in cats:
                keys.add(f"category.{cat_id}")

    # 5. Summaries & verdicts
    keys.update({
        "summary.green",
        "summary.yellow",
        "summary.red",
        "disclaimer",
    })

    # 6. Also include any keys present in messages_en.json so nothing is missed
    messages_en = DATA_DIR / "messages_en.json"
    if messages_en.exists():
        with messages_en.open(encoding="utf-8") as f:
            msg_data = json.load(f)
            for k in msg_data:
                if not k.startswith("_"):
                    keys.add(k)

    sorted_keys = sorted(keys)
    return sorted_keys


def main() -> None:
    keys = extract_reason_keys()
    target_file = DATA_DIR / "reason_keys.json"
    with target_file.open("w", encoding="utf-8") as f:
        json.dump(keys, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Frozen {len(keys)} reason keys to {target_file.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
