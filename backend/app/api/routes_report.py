"""GET /api/v1/report/{id} endpoint implementation."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.store.report_store import REPORT_ID_RE, get_report_store

router = APIRouter(prefix="/report", tags=["Report"])


@router.get("/{report_id}")
async def get_report_endpoint(report_id: str) -> dict[str, Any]:
    if not REPORT_ID_RE.match(report_id):
        raise HTTPException(
            status_code=400,
            detail={"code": "invalid_report_id", "message": "Malformed report ID format."},
        )

    store = get_report_store()
    report = store.get(report_id)
    if report is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "report_not_found", "message": "Report has expired or does not exist."},
        )

    return report
