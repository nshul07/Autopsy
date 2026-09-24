"""Package manifest history storage (F13)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
import sqlite3
from typing import Optional

from app.intel.db import get_db_connection


def get_package_record(package: str, conn: Optional[sqlite3.Connection] = None) -> dict | None:
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    try:
        cur = conn.execute(
            "SELECT package, label, version_code, cert_sha256, groups_json, seen_at FROM package_history WHERE package = ?",
            (package.lower(),),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "package": row["package"],
            "label": row["label"],
            "version_code": row["version_code"],
            "cert_sha256": row["cert_sha256"],
            "groups": json.loads(row["groups_json"] or "[]"),
            "seen_at": row["seen_at"],
        }
    finally:
        if should_close:
            conn.close()


def save_package_record(
    package: str,
    label: str | None,
    version_code: int | None,
    cert_sha256: str | None,
    groups: list[str],
    conn: Optional[sqlite3.Connection] = None,
) -> None:
    should_close = False
    if conn is None:
        conn = get_db_connection()
        should_close = True

    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """
            INSERT INTO package_history (package, label, version_code, cert_sha256, groups_json, seen_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(package) DO UPDATE SET
                label = excluded.label,
                version_code = excluded.version_code,
                cert_sha256 = excluded.cert_sha256,
                groups_json = excluded.groups_json,
                seen_at = excluded.seen_at;
            """,
            (
                package.lower(),
                label or "",
                version_code,
                cert_sha256 or "",
                json.dumps(sorted(groups)),
                now_iso,
            ),
        )
        conn.commit()
    finally:
        if should_close:
            conn.close()
