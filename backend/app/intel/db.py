"""SQLite database initialization with WAL mode and schema migration (F13, F14)."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from app.config import get_settings


def init_db(db_path: Path | None = None) -> sqlite3.Connection:
    target = db_path or get_settings().intel_db_file
    target.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(target), timeout=10.0)
    conn.row_factory = sqlite3.Row

    # Enable WAL mode
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")

    # Schema migration
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS package_history (
            package      TEXT PRIMARY KEY,
            label        TEXT,
            version_code INTEGER,
            cert_sha256  TEXT,
            groups_json  TEXT,
            seen_at      TEXT
        );

        CREATE TABLE IF NOT EXISTS hash_stats (
            sha256     TEXT PRIMARY KEY,
            label      TEXT,
            scans      INTEGER DEFAULT 1,
            red_count  INTEGER DEFAULT 0,
            first_seen TEXT,
            last_seen  TEXT
        );
        """
    )
    conn.commit()
    return conn


def get_db_connection() -> sqlite3.Connection:
    return init_db()
