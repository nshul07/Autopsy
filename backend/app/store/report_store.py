"""In-memory TTL report store (3.1).

Stores JSON representations of generated reports with TTL eviction.
Validates report IDs against ^[a-f0-9]{12}$ to prevent injection.
Never stores APK bytes or message text.
"""

from __future__ import annotations

import re
import secrets
import time
from typing import Any

from app.config import get_settings

REPORT_ID_RE = re.compile(r"^[a-f0-9]{12}$")


class ReportStore:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, dict[str, Any]]] = {}

    def generate_id(self) -> str:
        return secrets.token_hex(6)

    def _evict_expired(self, now: float) -> None:
        expired = [rid for rid, (exp, _) in self._store.items() if now > exp]
        for rid in expired:
            self._store.pop(rid, None)

    def save(self, report_dict: dict[str, Any], report_id: str | None = None) -> str:
        settings = get_settings()
        now = time.monotonic()
        self._evict_expired(now)

        if len(self._store) >= settings.report_store_max_entries:
            # Evict oldest entry
            oldest_key = min(self._store.keys(), key=lambda k: self._store[k][0])
            self._store.pop(oldest_key, None)

        rid = report_id or self.generate_id()
        if not REPORT_ID_RE.match(rid):
            raise ValueError(f"Invalid report ID format: {rid}")

        expires_at = now + settings.report_ttl_seconds
        self._store[rid] = (expires_at, report_dict)
        return rid

    def get(self, report_id: str) -> dict[str, Any] | None:
        if not report_id or not REPORT_ID_RE.match(report_id):
            return None

        now = time.monotonic()
        entry = self._store.get(report_id)
        if entry is None:
            return None

        expires_at, data = entry
        if now > expires_at:
            self._store.pop(report_id, None)
            return None

        return data


_store_instance = ReportStore()


def get_report_store() -> ReportStore:
    return _store_instance
