"""GET/POST /api/v1/bot/whatsapp webhook implementation (F17)."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query, Request, Response

from app.bot.whatsapp import handle_whatsapp_payload, verify_webhook_signature
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bot", tags=["Bot"])


@router.get("/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
) -> Response:
    settings = get_settings()
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return Response(content=hub_challenge or "", media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp")
async def receive_whatsapp_message(
    request: Request,
    x_hub_signature_256: str | None = Header(None),
) -> dict[str, Any]:
    body_bytes = await request.body()

    # Enforce HMAC validation
    if not verify_webhook_signature(body_bytes, x_hub_signature_256):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    payload = await request.json()
    replies = await handle_whatsapp_payload(payload)

    return {"status": "ok", "replies_count": len(replies)}
