"""Message catalogs and formatting.

Reports carry ``reason_key`` plus ``params`` rather than finished prose, so the
frontend can re-render a report in another language without re-running the
analysis. This module resolves those keys to text for the API response.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache

from app.config import DATA_DIR
from app.models.schemas import Lang

SUPPORTED_LANGS: tuple[Lang, ...] = ("en", "hi", "pa")
DEFAULT_LANG: Lang = "en"
PLAYBOOK_PREFIX = "playbook."


@dataclass(frozen=True)
class Catalog:
    lang: Lang
    messages: dict[str, str]
    playbook_strings: dict[str, str]

    def get(self, key: str) -> str | None:
        """Look up a key across both catalogs. Playbook step strings live in a
        separate file, so the prefix routes the lookup."""
        if key.startswith(PLAYBOOK_PREFIX):
            return self.playbook_strings.get(key)
        return self.messages.get(key)

    def text(self, key: str, **params: object) -> str:
        """Format a key, falling back to the English catalog and finally to the
        key itself. Never raises: a missing translation must not break a report.
        Callers that need to detect a genuine miss should use get()."""
        template = self.get(key)
        if template is None and self.lang != DEFAULT_LANG:
            template = get_catalog(DEFAULT_LANG).get(key)
        if template is None:
            return key
        if not params:
            return template
        try:
            return template.format(**params)
        except (KeyError, IndexError):
            # A malformed template is a content bug, not a runtime failure.
            return template


def _load(path_name: str) -> dict:
    with (DATA_DIR / path_name).open(encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache(maxsize=4)
def get_catalog(lang: Lang) -> Catalog:
    resolved: Lang = lang if lang in SUPPORTED_LANGS else DEFAULT_LANG
    messages_raw = _load(f"messages_{resolved}.json")
    playbook_raw = _load(f"playbook_{resolved}.json")

    messages = {
        key: value for key, value in messages_raw.items() if not key.startswith("_")
    }
    playbook_strings = dict(playbook_raw.get("strings", {}))
    return Catalog(lang=resolved, messages=messages, playbook_strings=playbook_strings)


def all_reason_keys(lang: Lang = DEFAULT_LANG) -> set[str]:
    """Every key defined in a catalog, minus the playbook strings (which are
    looked up separately). Used by tools/check_i18n.py and the completeness test."""
    catalog = get_catalog(lang)
    return {key for key in catalog.messages if not key.startswith("_")}