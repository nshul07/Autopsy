"""Link check scoring and report builder (F10, F11)."""

from __future__ import annotations

from datetime import datetime, timezone
import secrets

from app.core.i18n import get_catalog
from app.core.risk_engine import band_for
from app.core.rules_loader import Rules, get_rules
from app.link.expander import expand_link_safely
from app.link.heuristics import evaluate_offline_heuristics
from app.link.normalize import normalize_url
from app.link.reputation import check_url_reputation
from app.models.schemas import Lang, LinkCheckResult, LinkReport


async def check_link(
    raw_url: str,
    lang: Lang = "en",
    rules: Rules | None = None,
) -> LinkReport:
    rules = rules or get_rules()
    catalog = get_catalog(lang)

    normalized_url = normalize_url(raw_url)

    # 1. Offline heuristics
    checks: list[LinkCheckResult] = evaluate_offline_heuristics(normalized_url, rules)

    # 2. SSRF-safe redirect expansion
    expanded, expansion_checks = await expand_link_safely(normalized_url, rules)

    # Merge checks, deduplicating by ID
    existing_ids = {c.id for c in checks}
    for c in expansion_checks:
        if c.id not in existing_ids:
            checks.append(c)
            existing_ids.add(c.id)

    # 3. Reputation lookup
    rep_result = await check_url_reputation(expanded.final_url, rules)
    checks.append(rep_result)

    # Calculate score
    raw_score = sum(c.points for c in checks if c.status == "flagged")
    score = min(raw_score, 100)
    band_def = band_for(score, rules)

    critical_triggered = any(
        c.status == "flagged" and c.id == "reputation_flagged" for c in checks
    )

    verdict = band_def.verdict
    if critical_triggered and verdict != "red":
        verdict = "red"

    # Reasons formatting
    reasons: list[str] = []
    for c in checks:
        if c.status == "flagged":
            reasons.append(catalog.text(c.reason_key, **c.params))

    limitations = catalog.text("disclaimer")

    return LinkReport(
        report_id=secrets.token_hex(6),
        created_at=datetime.now(timezone.utc),
        input_url=raw_url,
        final_url=expanded.final_url,
        redirect_chain=expanded.redirect_chain,
        score=score,
        band=band_def.id,
        verdict=verdict,
        critical_check_triggered=critical_triggered,
        is_direct_apk=expanded.is_direct_apk,
        offer_apk_scan=expanded.is_direct_apk,
        checks=checks,
        reasons=reasons,
        limitations=limitations,
        lang=lang,
    )
