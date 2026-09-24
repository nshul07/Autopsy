"""GET /api/v1/intel/hash/{sha256} endpoint implementation (F14)."""

from __future__ import annotations

from fastapi import APIRouter

from app.intel.hash_stats import get_crowd_intel
from app.models.schemas import CrowdIntel

router = APIRouter(prefix="/intel", tags=["Intel"])


@router.get("/hash/{sha256}", response_model=CrowdIntel)
async def get_hash_intel(sha256: str) -> CrowdIntel:
    return get_crowd_intel(sha256)
