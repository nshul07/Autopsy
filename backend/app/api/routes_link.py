"""POST /api/v1/link/check endpoint implementation (F10)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.link.scorer import check_link
from app.models.schemas import LinkCheckRequest, LinkReport
from app.store.report_store import get_report_store
from app.utils.net_safety import SSRFBlockedError

router = APIRouter(prefix="/link", tags=["Link"])


@router.post("/check", response_model=LinkReport)
async def check_link_endpoint(req: LinkCheckRequest) -> LinkReport:
    store = get_report_store()
    try:
        report = await check_link(req.url, lang=req.lang)
    except SSRFBlockedError:
        raise HTTPException(
            status_code=400,
            detail={"code": "invalid_url", "message": "The provided URL is blocked by security policies."},
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"code": "invalid_url", "message": str(exc)},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={"code": "invalid_url", "message": "Failed to analyze link."},
        )

    store.save(report.model_dump(mode="json"), report_id=report.report_id)
    return report
