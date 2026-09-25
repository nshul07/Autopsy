#!/usr/bin/env python3
"""One-shot: append the link-handoff UI keys to all three message catalogs.

The handoff flow introduces strings the catalogs never had — the browser
picker, the "held before opening" state, and the escape hatch. They go into
EN/HI/PA together because tools/check_i18n.py enforces parity for reason keys
and the Kotlin I18nCompletenessTest enforces it for every key.

Text insertion rather than a json.dump round-trip: the catalog files are
hand-maintained with a specific key order and 2-space indent, and re-dumping
them would rewrite the whole file into an unreviewable diff.
"""

from __future__ import annotations

import io
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"

KEYS: dict[str, dict[str, str]] = {
    "en": {
        "ui.browser_pick_title": "Choose the browser for clean links",
        "ui.browser_pick_body": (
            "AppAutopsy checks a link before it opens. Pick which browser it "
            "should hand safe links to — the app never opens them itself."
        ),
        "ui.browser_none": "No browser found on this device.",
        "ui.browser_change": "Change browser",
        "ui.handoff_opening": "Nothing suspicious found — opening in your browser.",
        "ui.held_title": "Paused before opening",
        "ui.held_body": (
            "This link was not opened automatically. Read the reasons below, "
            "then decide."
        ),
        "ui.open_anyway": "Open anyway",
        "ui.set_default_browser": "Set AppAutopsy as your browser",
        "ui.role_held": "Set as default",
    },
    "hi": {
        "ui.browser_pick_title": "साफ़ लिंक के लिए ब्राउज़र चुनें",
        "ui.browser_pick_body": (
            "AppAutopsy लिंक खुलने से पहले उसकी जाँच करता है। बताइए सुरक्षित "
            "लिंक किस ब्राउज़र में खोलने हैं — ऐप खुद कोई लिंक नहीं खोलता।"
        ),
        "ui.browser_none": "इस डिवाइस पर कोई ब्राउज़र नहीं मिला।",
        "ui.browser_change": "ब्राउज़र बदलें",
        "ui.handoff_opening": "कुछ संदिग्ध नहीं मिला — आपके ब्राउज़र में खोल रहे हैं।",
        "ui.held_title": "खोलने से पहले रोका गया",
        "ui.held_body": (
            "यह लिंक अपने आप नहीं खोला गया। नीचे दिए कारण पढ़ें, फिर तय करें।"
        ),
        "ui.open_anyway": "फिर भी खोलें",
        "ui.set_default_browser": "AppAutopsy को अपना ब्राउज़र बनाएँ",
        "ui.role_held": "डिफ़ॉल्ट पर सेट है",
    },
    "pa": {
        "ui.browser_pick_title": "ਸਾਫ਼ ਲਿੰਕ ਲਈ ਬ੍ਰਾਊਜ਼ਰ ਚੁਣੋ",
        "ui.browser_pick_body": (
            "AppAutopsy ਲਿੰਕ ਖੁੱਲ੍ਹਣ ਤੋਂ ਪਹਿਲਾਂ ਉਸ ਦੀ ਜਾਂਚ ਕਰਦਾ ਹੈ। ਦੱਸੋ "
            "ਸੁਰੱਖਿਅਤ ਲਿੰਕ ਕਿਹੜੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਖੋਲ੍ਹਣੇ ਹਨ — ਐਪ ਆਪ ਕੋਈ ਲਿੰਕ "
            "ਨਹੀਂ ਖੋਲ੍ਹਦਾ।"
        ),
        "ui.browser_none": "ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਕੋਈ ਬ੍ਰਾਊਜ਼ਰ ਨਹੀਂ ਮਿਲਿਆ।",
        "ui.browser_change": "ਬ੍ਰਾਊਜ਼ਰ ਬਦਲੋ",
        "ui.handoff_opening": "ਕੁਝ ਸ਼ੱਕੀ ਨਹੀਂ ਮਿਲਿਆ — ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਖੋਲ੍ਹ ਰਹੇ ਹਾਂ।",
        "ui.held_title": "ਖੋਲ੍ਹਣ ਤੋਂ ਪਹਿਲਾਂ ਰੋਕਿਆ ਗਿਆ",
        "ui.held_body": (
            "ਇਹ ਲਿੰਕ ਆਪਣੇ ਆਪ ਨਹੀਂ ਖੋਲ੍ਹਿਆ ਗਿਆ। ਹੇਠਾਂ ਦਿੱਤੇ ਕਾਰਨ ਪੜ੍ਹੋ, ਫਿਰ ਫੈਸਲਾ ਕਰੋ।"
        ),
        "ui.open_anyway": "ਫਿਰ ਵੀ ਖੋਲ੍ਹੋ",
        "ui.set_default_browser": "AppAutopsy ਨੂੰ ਆਪਣਾ ਬ੍ਰਾਊਜ਼ਰ ਬਣਾਓ",
        "ui.role_held": "ਡਿਫ਼ਾਲਟ ਉੱਤੇ ਸੈੱਟ ਹੈ",
    },
}


def append_keys(lang: str, pairs: dict[str, str]) -> list[str]:
    path = DATA_DIR / f"messages_{lang}.json"
    raw = io.open(path, encoding="utf-8").read()

    existing = json.loads(raw)
    added, skipped = [], []
    for key, value in pairs.items():
        if key in existing:
            skipped.append(key)
            continue
        added.append(key)

    if not added:
        return skipped

    # Insert before the final closing brace, comma-separating from the last
    # existing entry. Text-level so the file's key order and indent survive.
    close = raw.rstrip().rfind("}")
    head = raw[:close].rstrip()
    lines = ",\n".join(
        "  " + json.dumps(k, ensure_ascii=False) + ": " + json.dumps(pairs[k], ensure_ascii=False)
        for k in added
    )
    io.open(path, "w", encoding="utf-8", newline="\n").write(
        head + ",\n" + lines + "\n}\n"
    )
    return skipped


def main() -> None:
    for lang, pairs in KEYS.items():
        skipped = append_keys(lang, pairs)
        if skipped:
            print(f"{lang}: already present, left alone: {skipped}")
        print(f"{lang}: ok ({len(pairs)} keys)")

    # Prove parity after writing rather than trusting the write.
    sets = {}
    for lang in KEYS:
        data = json.load(io.open(DATA_DIR / f"messages_{lang}.json", encoding="utf-8"))
        sets[lang] = {k for k in data if not k.startswith("_")}
    for other in ("hi", "pa"):
        diff = sets["en"] ^ sets[other]
        if diff:
            print(f"PARITY BROKEN en vs {other}: {sorted(diff)}", file=sys.stderr)
            sys.exit(1)
    print(f"parity ok: {len(sets['en'])} keys x 3 languages")


if __name__ == "__main__":
    main()