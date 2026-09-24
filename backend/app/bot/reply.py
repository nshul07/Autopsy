"""Localized reply formatting for WhatsApp bot (F17)."""

from __future__ import annotations

from app.core.i18n import get_catalog
from app.models.schemas import Lang, Verdict


def format_verdict_reply(
    verdict: Verdict,
    score: int,
    reasons: list[str],
    recommendation: str,
    lang: Lang = "en",
) -> str:
    catalog = get_catalog(lang)
    icon = "🔴" if verdict == "red" else ("🟡" if verdict == "yellow" else "🟢")

    lines = [
        f"{icon} *AppAutopsy Verdict: {catalog.text(f'verdict.{verdict}')}*",
        f"*Risk Score:* {score}/100",
        "",
        f"*Recommendation:* {recommendation}",
    ]

    if reasons:
        lines.append("")
        lines.append("*Key Findings:*")
        for r in reasons[:4]:
            lines.append(f"• {r}")

    lines.append("")
    lines.append(f"_{catalog.text('disclaimer')}_")

    return "\n".join(lines)
