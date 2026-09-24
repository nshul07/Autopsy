"""Calibration card — reasons this might be wrong (F16).

Derives genuine uncertainty sources and returns them as NoteItems.
Contributes 0 points and never changes the verdict.
"""

from __future__ import annotations

from app.models.schemas import CategoryResult, NoteItem, ParsedApk


def build_calibration_notes(
    apk: ParsedApk,
    category: CategoryResult,
    not_checked_checks: list[str] | None = None,
) -> list[NoteItem]:
    notes: list[NoteItem] = []

    if category.id == "unknown":
        notes.append(NoteItem(reason_key="calibration.unknown_category", params={}))
    elif category.confidence == "low":
        notes.append(NoteItem(reason_key="calibration.low_confidence", params={}))

    if not apk.has_launcher_activity:
        notes.append(NoteItem(reason_key="calibration.no_launcher", params={}))

    if not_checked_checks:
        notes.append(
            NoteItem(
                reason_key="calibration.not_checked_checks",
                params={"checks": ", ".join(not_checked_checks)},
            )
        )

    # General honesty caveat regarding allowlists / static analysis
    notes.append(NoteItem(reason_key="calibration.allowlist_caveat", params={}))

    return notes
