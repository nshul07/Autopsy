"""Benchmark the offline link engine against a labelled phishing corpus.

Reads a CSV of (URL, Label) where Label is "bad"/"good", runs the offline
heuristics, and reports recall on the bad rows and the false-positive rate on
the good ones. Offline only: no expansion, no reputation, no network — the same
contract the shipped app runs under.

    python tools/bench_phishing.py <csv> [--sample N] [--show N]

The point is not a single accuracy number. It is to see *which* bad URLs slip
through, because a phishing guard that misses a whole family is the bug worth
fixing.
"""

from __future__ import annotations

import argparse
import csv
import random
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.risk_engine import band_for  # noqa: E402
from app.core.rules_loader import get_rules  # noqa: E402
from app.link.heuristics import evaluate_offline_heuristics, check_brand_lookalike_match  # noqa: E402
from app.link.normalize import normalize_url  # noqa: E402

RULES = get_rules()


def verdict_for(raw_url: str) -> tuple[str, int, list[str]]:
    """Offline verdict, mirroring scorer.check_link minus network checks."""
    checks = evaluate_offline_heuristics(normalize_url(raw_url), RULES)
    score = min(sum(c.points for c in checks if c.status == "flagged"), 100)
    band = band_for(score, RULES)

    flagged_ids = {c.id for c in checks if c.status == "flagged"}
    homoglyph = "punycode" in flagged_ids and "brand_lookalike" in flagged_ids
    strong_brand = any(
        c.id == "brand_lookalike"
        and c.status == "flagged"
        and c.params.get("strong") == "1"
        for c in checks
    )
    critical = homoglyph or strong_brand or any(
        c.status == "flagged"
        and (RULES.link_rules.get("checks", {}).get(c.id, {}) or {}).get("critical")
        for c in checks
    )
    verdict = band.verdict
    if critical and verdict != "red":
        verdict = "red"
    return verdict, score, sorted(flagged_ids)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("csv")
    ap.add_argument("--sample", type=int, default=0, help="rows per label (0 = all)")
    ap.add_argument("--show", type=int, default=25, help="misses to print")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    bad: list[str] = []
    good: list[str] = []
    with open(args.csv, encoding="utf-8", errors="replace") as handle:
        for row in csv.DictReader(handle):
            label = (row.get("Label") or "").strip().lower()
            url = (row.get("URL") or "").strip()
            if not url:
                continue
            if label == "bad":
                bad.append(url)
            elif label == "good":
                good.append(url)

    if args.sample:
        rng = random.Random(args.seed)
        bad = rng.sample(bad, min(args.sample, len(bad)))
        good = rng.sample(good, min(args.sample, len(good)))

    print(f"corpus: {len(bad)} bad, {len(good)} good\n")

    stats = {"bad": Counter(), "good": Counter()}
    misses: list[tuple[str, int, list[str]]] = []
    for url in bad:
        verdict, score, ids = verdict_for(url)
        stats["bad"][verdict] += 1
        if verdict == "green":
            misses.append((url, score, ids))
    for url in good:
        verdict, score, ids = verdict_for(url)
        stats["good"][verdict] += 1

    for name in ("bad", "good"):
        total = sum(stats[name].values()) or 1
        print(f"{name}:")
        for v in ("red", "yellow", "green"):
            n = stats[name][v]
            print(f"  {v:6s} {n:7d}  {100 * n / total:5.1f}%")

    caught = stats["bad"]["red"] + stats["bad"]["yellow"]
    bad_total = sum(stats["bad"].values()) or 1
    false_pos = stats["good"]["red"] + stats["good"]["yellow"]
    good_total = sum(stats["good"].values()) or 1
    print(f"\nrecall (bad flagged):     {100 * caught / bad_total:5.1f}%")
    print(f"false positives (good):   {100 * false_pos / good_total:5.1f}%")

    if args.show and misses:
        rng = random.Random(args.seed)
        print(f"\n--- {min(args.show, len(misses))} missed bad URLs ---")
        for url, score, ids in rng.sample(misses, min(args.show, len(misses))):
            print(f"  [{score:3d}] {','.join(ids) or '-'}  {url[:110]}")


if __name__ == "__main__":
    main()
