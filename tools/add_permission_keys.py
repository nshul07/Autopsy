#!/usr/bin/env python3
"""One-shot: append the permissions-card UI keys to all three catalogs.

The automated paths (SMS receiver, mail notification listener, the warning
notification itself) are all gated behind permissions that nothing in the app
currently requests. Without these strings the card that requests them cannot be
localized, and a half-localized permission prompt is worse than none: the user
is asked to grant access in a language they may not read.

Same text-insertion approach as tools/add_handoff_keys.py — see the note there
on why the catalogs are not re-dumped through json.dump.
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
        "ui.perm_title": "Turn on automatic protection",
        "ui.perm_body": (
            "AppAutopsy works without these — you can always paste a link. "
            "Turning them on is what makes it check things for you."
        ),
        "ui.perm_sms": "Allow SMS access",
        "ui.perm_sms_why": "Scans incoming texts for phishing links.",
        "ui.perm_notif": "Allow notifications",
        "ui.perm_notif_why": "Shows the warning when a risky link is held back.",
        "ui.perm_mail": "Allow notification access",
        "ui.perm_mail_why": (
            "Reads the preview line of new mail to spot phishing. It never "
            "opens the mail."
        ),
        "ui.perm_granted": "On",
        "ui.perm_open_settings": "Open system settings",
        "ui.perm_denied_hint": "Denied — you can still enable it in system settings.",
    },
    "hi": {
        "ui.perm_title": "अपने आप जाँच चालू करें",
        "ui.perm_body": (
            "इनके बिना भी AppAutopsy काम करता है — आप हमेशा लिंक पेस्ट कर सकते "
            "हैं। इन्हें चालू करने पर ही यह अपने आप जाँचता है।"
        ),
        "ui.perm_sms": "SMS की अनुमति दें",
        "ui.perm_sms_why": "आने वाले संदेशों में फ़िशिंग लिंक जाँचता है।",
        "ui.perm_notif": "सूचनाओं की अनुमति दें",
        "ui.perm_notif_why": "खतरनाक लिंक रोके जाने पर चेतावनी दिखाता है।",
        "ui.perm_mail": "सूचना पहुँच की अनुमति दें",
        "ui.perm_mail_why": (
            "फ़िशिंग पहचानने के लिए नए मेल की झलक पंक्ति पढ़ता है। मेल कभी "
            "नहीं खोलता।"
        ),
        "ui.perm_granted": "चालू",
        "ui.perm_open_settings": "सिस्टम सेटिंग खोलें",
        "ui.perm_denied_hint": "मना किया गया — सिस्टम सेटिंग में इसे चालू कर सकते हैं।",
    },
    "pa": {
        "ui.perm_title": "ਆਪਣੇ ਆਪ ਜਾਂਚ ਚਾਲੂ ਕਰੋ",
        "ui.perm_body": (
            "ਇਹਨਾਂ ਤੋਂ ਬਿਨਾਂ ਵੀ AppAutopsy ਕੰਮ ਕਰਦਾ ਹੈ — ਤੁਸੀਂ ਹਮੇਸ਼ਾ ਲਿੰਕ ਪੇਸਟ "
            "ਕਰ ਸਕਦੇ ਹੋ। ਇਹਨਾਂ ਨੂੰ ਚਾਲੂ ਕਰਨ ਨਾਲ ਹੀ ਇਹ ਆਪਣੇ ਆਪ ਜਾਂਚਦਾ ਹੈ।"
        ),
        "ui.perm_sms": "SMS ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ",
        "ui.perm_sms_why": "ਆਉਣ ਵਾਲੇ ਸੁਨੇਹਿਆਂ ਵਿੱਚ ਫ਼ਿਸ਼ਿੰਗ ਲਿੰਕ ਜਾਂਚਦਾ ਹੈ।",
        "ui.perm_notif": "ਸੂਚਨਾਵਾਂ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ",
        "ui.perm_notif_why": "ਖ਼ਤਰਨਾਕ ਲਿੰਕ ਰੋਕੇ ਜਾਣ 'ਤੇ ਚੇਤਾਵਨੀ ਦਿਖਾਉਂਦਾ ਹੈ।",
        "ui.perm_mail": "ਸੂਚਨਾ ਪਹੁੰਚ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ",
        "ui.perm_mail_why": (
            "ਫ਼ਿਸ਼ਿੰਗ ਪਛਾਣਨ ਲਈ ਨਵੀਂ ਮੇਲ ਦੀ ਝਲਕ ਲਾਈਨ ਪੜ੍ਹਦਾ ਹੈ। ਮੇਲ ਕਦੇ ਨਹੀਂ "
            "ਖੋਲ੍ਹਦਾ।"
        ),
        "ui.perm_granted": "ਚਾਲੂ",
        "ui.perm_open_settings": "ਸਿਸਟਮ ਸੈਟਿੰਗ ਖੋਲ੍ਹੋ",
        "ui.perm_denied_hint": "ਮਨ੍ਹਾ ਕੀਤਾ — ਸਿਸਟਮ ਸੈਟਿੰਗ ਵਿੱਚ ਇਹ ਚਾਲੂ ਕਰ ਸਕਦੇ ਹੋ।",
    },
}


def append_keys(lang: str, pairs: dict[str, str]) -> list[str]:
    path = DATA_DIR / f"messages_{lang}.json"
    raw = io.open(path, encoding="utf-8").read()

    existing = json.loads(raw)
    added, skipped = [], []
    for key in pairs:
        (skipped if key in existing else added).append(key)

    if not added:
        return skipped

    close = raw.rstrip().rfind("}")
    head = raw[:close].rstrip()
    lines = ",\n".join(
        "  " + json.dumps(k, ensure_ascii=False) + ": " + json.dumps(pairs[k], ensure_ascii=False)
        for k in added
    )
    io.open(path, "w", encoding="utf-8", newline="\n").write(head + ",\n" + lines + "\n}\n")
    return skipped


def main() -> None:
    for lang, pairs in KEYS.items():
        skipped = append_keys(lang, pairs)
        if skipped:
            print(f"{lang}: already present, left alone: {skipped}")
        print(f"{lang}: ok ({len(pairs)} keys)")

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
