"""Builds localized explanations, summary, recommendation, and disclaimer.

Resolves reason_keys from BreakdownItem, PatternMatch, and other findings into
human-readable strings for the specified language.
"""

from __future__ import annotations

from app.core.i18n import get_catalog
from app.models.schemas import (
    BreakdownItem,
    ImpersonationResult,
    Lang,
    PatternMatch,
    RepackagingResult,
    Verdict,
)


def build_explanations(
    verdict: Verdict,
    category_id: str,
    recommendation_id: str,
    breakdown: list[BreakdownItem],
    patterns: list[PatternMatch],
    impersonation: ImpersonationResult | None,
    repackaging: RepackagingResult | None,
    lang: Lang = "en",
) -> tuple[list[str], str, str, str]:
    """Returns (reasons, summary, recommendation, limitations)."""
    catalog = get_catalog(lang)

    reasons: list[str] = []

    # 1. Repackaging & Impersonation
    if repackaging and repackaging.detected:
        reasons.append(catalog.text(repackaging.detail_key))
    if impersonation:
        reasons.append(catalog.text(impersonation.reason_key))

    # 2. Critical/pattern matches
    for p in patterns:
        reasons.append(catalog.text(p.reason_key))

    # 3. Breakdown items (unexpected permissions & penalties)
    for b in breakdown:
        if b.status == "unexpected":
            perm_label = ""
            if "group" in b.params:
                perm_label = catalog.text(f"perm.{b.params['group']}")
            cat_name = catalog.text(f"category.{category_id}")
            text = catalog.text(
                b.reason_key,
                permission_label=perm_label,
                category=cat_name,
                count=b.params.get("count", ""),
            )
            if text and text not in reasons:
                reasons.append(text)

    # Category name for summary
    cat_display = catalog.text(f"category.{category_id}")
    summary = catalog.text(f"summary.{verdict}", category=cat_display)
    recommendation = catalog.text(f"recommendation.{recommendation_id}")
    limitations = catalog.text("disclaimer")

    return reasons, summary, recommendation, limitations
