"""Crowd-hash intelligence store and lookups (F14).

Privacy rule from AGENTS.md:
Counts only. No IPs, no device IDs, no per-user rows.
Honesty guard: if scans < 5, report insufficient_data.
"""

from __future__ import annotations

from datetime import datetime, timezone
import sqlite3
from typing import Optional

from app.intel.db import get_db_connection
from app.models.schemas import CrowdIntel


def record_scan(
    sha256: str,
    label: str | None,
    is_red: bool,
    conn: Optional[sqlite3.Connection] = None,
) -> None:
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        red_val = 1 if is_red else 0

        conn.execute(
            """
            INSERT INTO hash_stats (sha256, label, scans, red_count, first_seen, last_seen)
            VALUES (?, ?, 1, ?, ?, ?)
            ON CONFLICT(sha256) DO UPDATE SET
                scans = scans + 1,
                red_count = red_count + excluded.red_count,
                last_seen = excluded.last_seen;
            """,
            (sha256.lower(), label or "unknown", red_val, now_iso, now_iso),
        )
        conn.commit()
    finally:
        if should_close:
            conn.close()


def get_crowd_intel(
    sha256: str,
    conn: Optional[sqlite3.Connection] = None,
) -> CrowdIntel:
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    try:
        cur = conn.execute(
            "SELECT scans, red_count FROM hash_stats WHERE sha256 = ?",
            (sha256.lower(),),
        )
        row = cur.fetchone()
        if not row:
            return CrowdIntel(scans=0, percent_told_never_install=None, insufficient_data=True)

        scans = row["scans"]
        red_count = row["red_count"]

        if scans < 5:
            return CrowdIntel(scans=scans, percent_told_never_install=None, insufficient_data=True)

        percent = int(round((red_count / scans) * 100))
        return CrowdIntel(scans=scans, percent_told_never_install=percent, insufficient_data=False)
    finally:
        if should_close:
            conn.close()
