"""Syncs the canonical rules JSON from ./data into every consumer copy.

There is one set of rules (AGENTS.md §5) — the Kotlin shared engine, the
Python reference backend and the Android app assets must never drift apart.
They can't share one file at runtime (different packaging), so `data/` at the
repo root is canonical and this tool mirrors it outward. CI/`make freeze-check`
runs --check and fails on drift.

Usage:
    python tools/sync_rules.py            # copy data/ -> backend/app/data/
    python tools/sync_rules.py --check    # exit 1 if any copy differs
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CANONICAL = REPO_ROOT / "data"
BACKEND_COPY = REPO_ROOT / "backend" / "app" / "data"


def _pairs() -> list[tuple[Path, Path]]:
    return [(src, BACKEND_COPY / src.name) for src in sorted(CANONICAL.glob("*.json"))]


def main(check: bool) -> int:
    drift: list[str] = []
    for src, dst in _pairs():
        same = dst.exists() and dst.read_bytes() == src.read_bytes()
        if check:
            if not same:
                drift.append(str(dst.relative_to(REPO_ROOT)))
        else:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dst)
    if check and drift:
        print("rules drift — run `python tools/sync_rules.py`:\n  " + "\n  ".join(drift))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main("--check" in sys.argv))
