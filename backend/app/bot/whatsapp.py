"""WhatsApp Guardian bot webhook & message processing (F17).

Security Requirement (AGENTS.md 4.17 & 3.1):
Verify X-Hub-Signature-256 HMAC-SHA256 against the app secret before parsing
the body. Reject on mismatch.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Any

from app.bot.reply import format_verdict_reply
from app.config import get_settings
from app.link.scorer import check_link
from app.message.checker import URL_REGEX

logger = logging.getLogger(__name__)


def verify_webhook_signature(payload: bytes, signature_header: str | None) -> bool:
    """Verifies HMAC-SHA256 signature in X-Hub-Signature-256 header."""
    secret = get_settings().whatsapp_app_secret
    if not secret:
        # If no secret configured, fail closed
        return False

    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected_sig = signature_header[7:].strip()
    mac = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256)
    computed_sig = mac.hexdigest()

    return hmac.compare_digest(expected_sig, computed_sig)


async def handle_whatsapp_payload(data: dict[str, Any]) -> list[str]:
    """Parses inbound WhatsApp webhook payload, runs checks, and returns generated replies."""
    replies: list[str] = []

    entries = data.get("entry", [])
    for entry in entries:
        changes = entry.get("changes", [])
        for change in changes:
            value = change.get("value", {})
            messages = value.get("messages", [])
            for msg in messages:
                msg_type = msg.get("type")
                if msg_type == "text":
                    body = msg.get("text", {}).get("body", "")
                    found_urls = URL_REGEX.findall(body)
                    if found_urls:
                        report = await check_link(found_urls[0], lang="en")
                        reply_text = format_verdict_reply(
                            verdict=report.verdict,
                            score=report.score,
                            reasons=report.reasons,
                            recommendation="Do not install or visit" if report.verdict == "red" else "Review carefully",
                            lang="en",
                        )
                        replies.append(reply_text)
                    else:
                        replies.append("Please forward a link or APK to check.")

    return replies
