"""Message scam checker (F23).

Rule-based scam analysis for SMS / WhatsApp messages.
Checks for urgency, account-suspension threats, OTP/PIN requests, prize claims,
and APK mentions. Extracted links run through the link checker.

Privacy Rule (AGENTS.md 3.1 & 7):
Message text is NEVER stored or logged.
"""

from __future__ import annotations

import re
from typing import Any

from app.core.i18n import get_catalog
from app.link.scorer import check_link
from app.models.schemas import Lang, LinkReport

URL_REGEX = re.compile(r"https?://[^\s<>\"']+", re.IGNORECASE)

# Scam indicator patterns (case-insensitive)
URGENCY_PATTERNS = [
    r"\burgent\b", r"\bimmediately\b", r"\bwithin 24\b", r"\bexpire[ds]?\b",
    r"\baction required\b", r"\blast warning\b", r"\btoday only\b",
    r"तुरंत", r"जल्दी", r"बंद हो जाएगा", r"ਅੱਜ ਹੀ"
]
KYC_PATTERNS = [
    r"\bkyc\b", r"\bpan\b", r"\baadhaar\b", r"\baccount block\b",
    r"\bsuspend(ed)?\b", r"\bdeactivate[d]?\b", r"\bunblock\b",
    r"केवाईसी", r"खाता बंद", r"ਖਾਤਾ ਬੰਦ"
]
CREDENTIAL_PATTERNS = [
    r"\botp\b", r"\bpin\b", r"\bcvv\b", r"\bpassword\b",
    r"ओटीपी", r"पिन"
]
PRIZE_PATTERNS = [
    r"\bwon\b", r"\blottery\b", r"\bprize\b", r"\breward points\b",
    r"\bcashback\b", r"\bcongratulations\b", r"\bclaim\b",
    r"इनाम", r"लॉटरी", r"ਜੀਤਿਆ"
]
APK_PATTERNS = [
    r"\.apk\b", r"\binstall app\b", r"\bdownload apk\b", r"ऐप डाउनलोड"
]


def _match_any(patterns: list[str], text: str) -> bool:
    for pat in patterns:
        if re.search(pat, text, re.IGNORECASE):
            return True
    return False


async def check_message(
    text: str,
    lang: Lang = "en",
) -> dict[str, Any]:
    catalog = get_catalog(lang)
    signals: list[str] = []
    score = 0

    has_urgency = _match_any(URGENCY_PATTERNS, text)
    has_kyc = _match_any(KYC_PATTERNS, text)
    has_credentials = _match_any(CREDENTIAL_PATTERNS, text)
    has_prize = _match_any(PRIZE_PATTERNS, text)
    has_apk = _match_any(APK_PATTERNS, text)

    if has_urgency:
        score += 20
        signals.append("Urgency phrases detected")
    if has_kyc:
        score += 25
        signals.append("Threats of account suspension or urgent KYC demands")
    if has_credentials:
        score += 35
        signals.append("Requests for OTP, PIN, or banking credentials")
    if has_prize:
        score += 20
        signals.append("Suspicious prize or lottery claim")
    if has_apk:
        score += 25
        signals.append("Prompts to download an APK application")

    # Extract and check URLs
    found_urls = URL_REGEX.findall(text)
    link_reports: list[LinkReport] = []
    for u in found_urls[:3]:  # Cap at 3 links
        lr = await check_link(u, lang=lang)
        link_reports.append(lr)
        if lr.verdict == "red":
            score += 40
        elif lr.verdict == "yellow":
            score += 20

    score = min(score, 100)
    verdict = "green"
    band = "low"
    if score >= 61 or has_credentials:
        verdict = "red"
        band = "high"
    elif score >= 26:
        verdict = "yellow"
        band = "medium"

    return {
        "score": score,
        "band": band,
        "verdict": verdict,
        "signals": signals,
        "found_urls": found_urls,
        "links": [lr.model_dump() for lr in link_reports],
        "limitations": catalog.text("disclaimer"),
        "lang": lang,
    }
