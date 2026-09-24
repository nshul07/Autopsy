"""Scam-pattern matching.

Operates purely on the already-extracted group set, so it never touches APK
bytes and costs nothing that scales with file size.

Complexity: O(K) frozenset subset tests, K a small fixed constant.
"""

from __future__ import annotations

from app.core.rules_loader import Pattern, Rules, get_rules
from app.models.schemas import PatternMatch


def matched_patterns(
    present_groups: frozenset[str],
    category_id: str,
    has_launcher_activity: bool,
    rules: Rules | None = None,
) -> list[PatternMatch]:
    """Return every pattern whose conditions hold.

    Patterns flagged with ``evaluated_by`` are decided by a different module
    (repackaging, for instance) and are skipped here so there is exactly one
    implementation of each rule.
    """
    rules = rules or get_rules()
    matches: list[PatternMatch] = []

    for pattern in rules.patterns:
        if pattern.evaluated_by:
            continue
        if category_id in pattern.excluded_categories:
            continue
        if not pattern.matches_groups(present_groups):
            continue

        matches.append(_to_match(pattern, has_launcher_activity))

    return matches


def _to_match(pattern: Pattern, has_launcher_activity: bool) -> PatternMatch:
    is_critical = pattern.critical
    if pattern.critical_if_no_launcher and not has_launcher_activity:
        is_critical = True

    return PatternMatch(
        id=pattern.id,
        bonus=pattern.bonus,
        critical=is_critical,
        reason_key=pattern.reason_key,
    )


def pattern_bonus_total(matches: list[PatternMatch]) -> int:
    return sum(match.bonus for match in matches)


def has_critical_pattern(matches: list[PatternMatch]) -> bool:
    return any(match.critical for match in matches)