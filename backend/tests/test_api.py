import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok", "version": "1.0"}


@pytest.mark.asyncio
async def test_link_check_endpoint() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/link/check",
            json={"url": "http://example.com/app.apk", "lang": "en"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "link"
        assert data["is_direct_apk"] is True
        assert len(data["reasons"]) > 0


@pytest.mark.asyncio
async def test_message_check_endpoint() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/message/check",
            json={"text": "URGENT: Your SBI account is blocked. Share OTP immediately or download APK.", "lang": "en"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "red"
        assert len(data["signals"]) > 0


@pytest.mark.asyncio
async def test_intel_hash_endpoint() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/intel/hash/abcdef0123456789abcdef0123456789")
        assert resp.status_code == 200
        data = resp.json()
        assert "scans" in data
        assert "insufficient_data" in data
