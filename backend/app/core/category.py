"""App category detection and confidence.

Priority is strict and confidence is honest: a label match is materially more
trustworthy than a package-name match, and the calibration card depends on that
distinction being real rather than cosmetic.

Complexity: O(T) token lookups plus O(K) multi-word substring checks, where T is
token count and K a small fixed keyword list. No fuzzy matching here — that
lives in the look-alike domain path where it is actually needed.
"""

from __future__ import annotations

import re

from app.core.rules_loader import Rules, get_rules
from app.models.schemas import CategoryResult

_TOKEN_SPLIT = re.compile(r"[^a-z0-9]+")


def _tokenize(value: str) -> frozenset[str]:
    return frozenset(token for token in _TOKEN_SPLIT.split(value.lower()) if token)


def _match(text: str, rules: Rules) -> str | None:
    if not text:
        return None

    normalized = text.lower()
    tokens = _tokenize(normalized)

    for keyword, category_id in rules.multi_word_keywords:
        if keyword in normalized:
            return category_id

    # Single tokens are checked in sorted order so the result does not depend on
    # dict iteration order when several categories match.
    for token in sorted(tokens):
        category_id = rules.single_word_index.get(token)
        if category_id is not None:
            return category_id

    return None


def detect_category(
    label: str | None,
    package: str | None,
    user_choice: str | None,
    rules: Rules | None = None,
) -> CategoryResult:
    """Resolve the category in strict priority order.

    A user selection always wins. Otherwise the label is tried before the
    package name, because package identifiers are noisier than display names.
    """
    rules = rules or get_rules()

    if user_choice:
        if user_choice not in rules.categories:
            raise ValueError(f"unknown category id: {user_choice}")
        return CategoryResult(id=user_choice, confidence="high", method="user")

    label_match = _match(label or "", rules)
    if label_match is not None:
        return CategoryResult(id=label_match, confidence="medium", method="keyword")

    package_match = _match(package or "", rules)
    if package_match is not None:
        return CategoryResult(id=package_match, confidence="low", method="keyword")

    unknown = rules.categories[rules.unknown_category_id]
    confidence = unknown.confidence or "low"
    return CategoryResult(id=unknown.id, confidence=confidence, method="unknown")


def expected_groups(category_id: str, rules: Rules | None = None) -> frozenset[str]:
    rules = rules or get_rules()
    category = rules.categories.get(category_id)
    return category.expected_groups if category else frozenset()


def mismatch_penalty_disabled(category_id: str, rules: Rules | None = None) -> bool:
    """True for the 'unknown' category, where no mismatch penalty applies."""
    rules = rules or get_rules()
    category = rules.categories.get(category_id)
    if category is None:
        return True
    return category.mismatch_penalty_disabled or category.id == rules.unknown_category_id