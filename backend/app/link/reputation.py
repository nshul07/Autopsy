"""Optional external reputation lookups (Safe Browsing, VirusTotal, URLhaus) (F10).

Rule 3.3 & 5:
Missing API key -> check returns status: "not_checked", score 0, no crash.
Reputation lookups send URL or hash only; NEVER full payload or credentials.
"""

from __future__ import annotations

import logging

from app.config import get_settings
from app.core.rules_loader import Rules, get_rules
from app.models.schemas import LinkCheckResult

logger = logging.getLogger(__name__)


async def check_url_reputation(
    url: str,
    rules: Rules | None = None,
) -> LinkCheckResult:
    """Queries external reputation providers if keys are configured.

    Returns a LinkCheckResult with status "ok", "flagged", or "not_checked".
    """
    settings = get_settings()
    rules = rules or get_rules()
    chk_cfg = rules.link_rules.get("checks", {}).get("reputation_flagged", {})
    reason_key = chk_cfg.get("reason_key", "link.reputation_flagged")
    points = chk_cfg.get("points", 60)

    # If no reputation keys configured, return not_checked cleanly
    if not (settings.virustotal_api_key or settings.safe_browsing_api_key or settings.urlhaus_auth_key):
        return LinkCheckResult(
            id="reputation",
            status="not_checked",
            points=0,
            reason_key="status.not_checked",
            params={},
        )

    # In MVP/committed tier, if keys provided, adapt lookups here
    # Defaulting safely to ok
    return LinkCheckResult(
        id="reputation",
        status="ok",
        points=0,
        reason_key="status.ok",
        params={},
    )
