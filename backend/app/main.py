"""FastAPI application entrypoint for AppAutopsy."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import (
    routes_apk,
    routes_bot,
    routes_intel,
    routes_link,
    routes_message,
    routes_report,
)
from app.config import get_settings
from app.core.rules_loader import validate_rules
from app.intel.db import init_db
from app.utils.ratelimit import limiter

logger = logging.getLogger("appautopsy")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate rules and initialize database
    validate_rules()
    init_db()
    yield
    # Shutdown logic if any


settings = get_settings()

app = FastAPI(
    title="AppAutopsy API",
    description="Detects mod-APKs, permission mismatches, and repackaging in Hindi, Punjabi, and English.",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global HTTPException formatter -> ErrorEnvelope
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "http_error", "message": str(exc.detail)}},
    )


# Health check
@app.get("/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
async def health_check():
    return {"status": "ok", "version": "1.0"}


# Mount API v1 router
api_v1 = FastAPI()
api_v1.include_router(routes_apk.router)
api_v1.include_router(routes_link.router)
api_v1.include_router(routes_message.router)
api_v1.include_router(routes_report.router)
api_v1.include_router(routes_intel.router)
api_v1.include_router(routes_bot.router)

app.mount("/api/v1", api_v1)
