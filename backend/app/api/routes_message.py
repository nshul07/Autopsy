"""POST /api/v1/message/check endpoint implementation (F23)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.message.checker import check_message
from app.models.schemas import MessageCheckRequest

router = APIRouter(prefix="/message", tags=["Message"])


@router.post("/check")
async def check_message_endpoint(req: MessageCheckRequest) -> dict[str, Any]:
    try:
        result = await check_message(req.text, lang=req.lang)
        return result
    except Exception:
        raise HTTPException(
            status_code=400,
            detail={"code": "internal", "message": "Failed to check message."},
        )
