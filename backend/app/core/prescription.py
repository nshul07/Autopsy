"""Minimum-permission prescription (F19).

Pure function returning the minimal expected permission groups for a category.
Contributes 0 points.
"""

from __future__ import annotations

from app.core.category import expected_groups
from app.core.rules_loader import Rules, get_rules
from app.models.schemas import Prescription


def prescribe_minimum_permissions(
    category_id: str,
    rules: Rules | None = None,
) -> Prescription:
    rules = rules or get_rules()
    expected = expected_groups(category_id, rules)
    sorted_groups = sorted(expected)
    return Prescription(minimal_groups=sorted_groups)
