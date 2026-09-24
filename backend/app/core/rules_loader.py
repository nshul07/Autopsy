"""Loads every rules JSON once and builds the lookup indices.

All tunables live in ``data/*.json``. This module turns those files into the
flat indices the hot paths use, so no per-request work is needed and no rule is
ever hard-coded in Python.

Every index here is built exactly once, at import. If you find yourself
building a dict inside a request handler, it belongs here instead.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from app.config import DATA_DIR


class RulesError(RuntimeError):
    """Raised when a rules file is missing or malformed. Fail loudly at startup."""


def _read_json(path: Path) -> dict:
    if not path.exists():
        raise RulesError(f"rules file missing: {path.name}")
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except json.JSONDecodeError as exc:
        raise RulesError(f"rules file {path.name} is not valid JSON: {exc}") from exc


@dataclass(frozen=True)
class Band:
    id: str
    min_score: int
    max_score: int
    verdict: str
    recommendation: str
    label_key: str

    def contains(self, score: int) -> bool:
        return self.min_score <= score <= self.max_score


@dataclass(frozen=True)
class CategoryDef:
    id: str
    expected_groups: frozenset[str]
    mismatch_penalty_disabled: bool = False
    confidence: str | None = None


@dataclass(frozen=True)
class Pattern:
    id: str
    requires: frozenset[str]
    requires_any: frozenset[str]
    bonus: int
    critical: bool
    critical_if_no_launcher: bool
    excluded_categories: frozenset[str]
    reason_key: str
    evaluated_by: str | None = None

    def matches_groups(self, present: frozenset[str]) -> bool:
        """True when every required group is present and at least one of the
        any-of groups is too (an empty any-of set is satisfied trivially)."""
        if not self.requires <= present:
            return False
        if self.requires_any and not (self.requires_any & present):
            return False
        return True


@dataclass(frozen=True)
class Brand:
    name: str
    aliases: tuple[str, ...]
    official_domains: frozenset[str]
    official_packages: frozenset[str]
    official_cert_sha256: frozenset[str]


@dataclass(frozen=True)
class Rules:
    bands: tuple[Band, ...]
    many_sensitive_threshold: int
    many_sensitive_points: int
    mismatch_points: int
    impersonation_points: int
    max_score: int

    group_points: dict[str, int]
    group_label_keys: dict[str, str]
    perm_to_group: dict[str, str]
    sensitive_groups: frozenset[str]

    # Component-derived groups are declared on <service>/<receiver>, never as
    # uses-permission. Two independent signals are recognised for each, because
    # real banking trojans frequently use the <meta-data> form alone.
    component_permission_signals: dict[str, str] = field(default_factory=dict)
    component_meta_data_signals: dict[str, str] = field(default_factory=dict)

    categories: dict[str, CategoryDef] = field(default_factory=dict)
    single_word_index: dict[str, str] = field(default_factory=dict)
    multi_word_keywords: tuple[tuple[str, str], ...] = ()
    unknown_category_id: str = "unknown"

    patterns: tuple[Pattern, ...] = ()
    brands: tuple[Brand, ...] = ()
    brand_alias_index: dict[str, str] = field(default_factory=dict)

    link_rules: dict = field(default_factory=dict)


def _build_component_signals(groups: dict) -> tuple[dict[str, str], dict[str, str]]:
    permission_signals: dict[str, str] = {}
    meta_data_signals: dict[str, str] = {}

    for group_id, spec in groups.items():
        if spec.get("source") != "component":
            continue
        for signal in spec.get("component_signals", []):
            permission_signals[signal] = group_id
        for name in spec.get("meta_data_names", []):
            meta_data_signals[name] = group_id

    return permission_signals, meta_data_signals


def _build_category_indices(categories: dict) -> tuple[dict[str, str], tuple[tuple[str, str], ...]]:
    single: dict[str, str] = {}
    multi: list[tuple[str, str]] = []

    for category_id, spec in categories.items():
        for keyword in spec.get("keywords", []):
            normalized = keyword.strip().lower()
            if not normalized:
                continue
            if " " in normalized or "-" in normalized or "." in normalized:
                multi.append((normalized, category_id))
            else:
                single[normalized] = category_id

    # Longest first so a more specific keyword wins over a shorter one that is
    # a prefix of it, and so the outcome never depends on dict order.
    multi.sort(key=lambda item: (-len(item[0]), item[0]))
    return single, tuple(multi)


def _build_patterns(raw_patterns: list) -> tuple[Pattern, ...]:
    patterns = []
    for spec in raw_patterns:
        patterns.append(
            Pattern(
                id=spec["id"],
                requires=frozenset(spec.get("requires", [])),
                requires_any=frozenset(spec.get("requires_any", [])),
                bonus=int(spec.get("bonus", 0)),
                critical=bool(spec.get("critical", False)),
                critical_if_no_launcher=bool(spec.get("critical_if_no_launcher", False)),
                excluded_categories=frozenset(spec.get("excluded_categories", [])),
                reason_key=spec["reason_key"],
                evaluated_by=spec.get("evaluated_by"),
            )
        )
    return tuple(patterns)


def _build_brands(raw_brands: list) -> tuple[tuple[Brand, ...], dict[str, str]]:
    brands = []
    alias_index: dict[str, str] = {}

    for spec in raw_brands:
        brand = Brand(
            name=spec["brand"],
            aliases=tuple(alias.lower() for alias in spec.get("aliases", [])),
            official_domains=frozenset(
                domain.lower() for domain in spec.get("official_domains", [])
            ),
            official_packages=frozenset(
                package.lower() for package in spec.get("official_packages", [])
            ),
            official_cert_sha256=frozenset(
                cert.lower() for cert in spec.get("official_cert_sha256", [])
            ),
        )
        brands.append(brand)
        for alias in brand.aliases:
            alias_index[alias] = brand.name

    return tuple(brands), alias_index


@lru_cache(maxsize=1)
def get_rules() -> Rules:
    """The single rules singleton. Loaded once, shared by every pipeline."""
    rules_raw = _read_json(DATA_DIR / "rules.json")
    categories_raw = _read_json(DATA_DIR / "categories.json")
    patterns_raw = _read_json(DATA_DIR / "patterns.json")
    brands_raw = _read_json(DATA_DIR / "brands.json")
    link_raw = _read_json(DATA_DIR / "link_rules.json")

    groups = rules_raw["groups"]

    perm_to_group: dict[str, str] = {}
    group_points: dict[str, int] = {}
    group_label_keys: dict[str, str] = {}

    for group_id, spec in groups.items():
        group_points[group_id] = int(spec.get("points", 0))
        group_label_keys[group_id] = spec["label_key"]
        for permission in spec.get("permissions", []):
            perm_to_group[permission] = group_id

    permission_signals, meta_data_signals = _build_component_signals(groups)

    categories: dict[str, CategoryDef] = {}
    for category_id, spec in categories_raw["categories"].items():
        categories[category_id] = CategoryDef(
            id=category_id,
            expected_groups=frozenset(spec.get("expected_groups", [])),
            mismatch_penalty_disabled=bool(spec.get("mismatch_penalty_disabled", False)),
            confidence=spec.get("confidence"),
        )

    single_word_index, multi_word_keywords = _build_category_indices(
        categories_raw["categories"]
    )
    brands, brand_alias_index = _build_brands(brands_raw["brands"])

    scoring = rules_raw["rules"]

    return Rules(
        bands=tuple(
            Band(
                id=band["id"],
                min_score=band["min"],
                max_score=band["max"],
                verdict=band["verdict"],
                recommendation=band["recommendation"],
                label_key=band["label_key"],
            )
            for band in rules_raw["bands"]
        ),
        many_sensitive_threshold=int(scoring["many_sensitive_threshold"]),
        many_sensitive_points=int(scoring["many_sensitive_points"]),
        mismatch_points=int(scoring["mismatch_points"]),
        impersonation_points=int(scoring["impersonation_points"]),
        max_score=int(scoring["max_score"]),
        group_points=group_points,
        group_label_keys=group_label_keys,
        perm_to_group=perm_to_group,
        sensitive_groups=frozenset(
            group for group, points in group_points.items() if points > 0
        ),
        component_permission_signals=permission_signals,
        component_meta_data_signals=meta_data_signals,
        categories=categories,
        single_word_index=single_word_index,
        multi_word_keywords=multi_word_keywords,
        unknown_category_id="unknown",
        patterns=_build_patterns(patterns_raw["patterns"]),
        brands=brands,
        brand_alias_index=brand_alias_index,
        link_rules=link_raw,
    )


def validate_rules() -> None:
    """Startup sanity check. Called once by main.py so a broken rules file
    fails at boot rather than on a user's first scan."""
    rules = get_rules()
    if not rules.bands:
        raise RulesError("no scoring bands defined")

    for pattern in rules.patterns:
        for group in pattern.requires | pattern.requires_any:
            if group not in rules.group_points:
                raise RulesError(
                    f"pattern {pattern.id} references unknown group {group!r}"
                )

    for category in rules.categories.values():
        for group in category.expected_groups:
            if group not in rules.group_points:
                raise RulesError(
                    f"category {category.id} expects unknown group {group!r}"
                )

    if rules.unknown_category_id not in rules.categories:
        raise RulesError("the 'unknown' category is missing from categories.json")