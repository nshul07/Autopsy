"""Scoring — the heart of the system (F5, F7, F8).

Pure functions only: no I/O, no network, no clock, no globals beyond the rules
singleton. Data in, data out. That is what makes the six test vectors trivial to
assert and makes a rule change safe.

The engine never sees the APK. It receives an already-extracted group set, so
its cost is independent of file size and the same input always yields the same
score.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.core import patterns as pattern_module
from app.core.category import mismatch_penalty_disabled
from app.core.permissions import permission_items, present_groups
from app.core.rules_loader import Band, Rules, get_rules
from app.models.schemas import (
    BreakdownItem,
    CategoryResult,
    ParsedApk,
    PatternMatch,
    PermissionItem,
)


@dataclass(frozen=True)
class ScoreResult:
    score: int
    band: Band
    verdict: str
    recommendation: str
    critical_override: bool
    breakdown: tuple[BreakdownItem, ...]
    permissions: tuple[PermissionItem, ...]
    patterns: tuple[PatternMatch, ...]
    present_groups: frozenset[str]
    unexpected_groups: frozenset[str]


def band_for(score: int, rules: Rules) -> Band:
    for band in rules.bands:
        if band.contains(score):
            return band
    # Only reachable if the bands in rules.json have a gap; clamp to the top.
    return rules.bands[-1]


def score_apk(
    apk: ParsedApk,
    category: CategoryResult,
    rules: Rules | None = None,
    impersonation_detected: bool = False,
    repackaging_detected: bool = False,
) -> ScoreResult:
    """Score an APK against its declared category.

    Order of operations follows the spec exactly: group points first, then the
    two penalties, then pattern bonuses, then the cap and band, with a critical
    override applied last.
    """
    rules = rules or get_rules()

    expected = rules.categories[category.id].expected_groups
    groups = present_groups(apk.permissions, apk.services, apk.receivers, rules)

    breakdown: list[BreakdownItem] = []
    score = 0

    for group in sorted(groups):
        points = rules.group_points.get(group, 0)
        is_expected = group in expected

        if points == 0 and not is_expected:
            # Zero-point groups (boot) only exist to feed patterns. They are
            # still reported so the reader can see the app declares them.
            breakdown.append(
                BreakdownItem(
                    rule=f"group:{group}",
                    points=0,
                    reason_key="perm.info",
                    status="info",
                    params={"group": group},
                )
            )
            continue

        awarded = 0 if is_expected else points
        score += awarded

        breakdown.append(
            BreakdownItem(
                rule=f"group:{group}",
                points=awarded,
                reason_key="perm.expected" if is_expected else "perm.unexpected",
                status="expected" if is_expected else "unexpected",
                params={"group": group, "category": category.id},
            )
        )

    unexpected = frozenset(group for group in groups if group not in expected)

    if len(unexpected) > rules.many_sensitive_threshold:
        score += rules.many_sensitive_points
        breakdown.append(
            BreakdownItem(
                rule="many_sensitive",
                points=rules.many_sensitive_points,
                reason_key="rule.many_sensitive",
                status="unexpected",
                params={"count": str(len(unexpected))},
            )
        )

    if unexpected and not mismatch_penalty_disabled(category.id, rules):
        score += rules.mismatch_points
        breakdown.append(
            BreakdownItem(
                rule="mismatch",
                points=rules.mismatch_points,
                reason_key="rule.mismatch",
                status="unexpected",
                params={"category": category.id},
            )
        )

    matched = pattern_module.matched_patterns(
        groups, category.id, apk.has_launcher_activity, rules
    )
    for match in matched:
        score += match.bonus
        breakdown.append(
            BreakdownItem(
                rule=f"pattern:{match.id}",
                points=match.bonus,
                reason_key=match.reason_key,
                status="critical" if match.critical else "unexpected",
                params={},
            )
        )

    if impersonation_detected:
        score += rules.impersonation_points
        breakdown.append(
            BreakdownItem(
                rule="impersonation",
                points=rules.impersonation_points,
                reason_key="impersonation.detected",
                status="critical",
                params={},
            )
        )

    score = min(score, rules.max_score)
    band = band_for(score, rules)

    critical = (
        pattern_module.has_critical_pattern(matched)
        or impersonation_detected
        or repackaging_detected
    )

    verdict = band.verdict
    recommendation = band.recommendation
    if critical and verdict != "red":
        verdict = "red"
        recommendation = "do_not_install"

    return ScoreResult(
        score=score,
        band=band,
        verdict=verdict,
        recommendation=recommendation,
        critical_override=critical,
        breakdown=tuple(breakdown),
        permissions=tuple(permission_items(apk.permissions, expected, rules)),
        patterns=tuple(matched),
        present_groups=groups,
        unexpected_groups=unexpected,
    )