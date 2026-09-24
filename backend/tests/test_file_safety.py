import io
import zipfile
from pathlib import Path
import pytest

from app.utils.file_safety import (
    FileSafetyError,
    safe_temp_apk,
    save_upload_stream,
    validate_zip_members,
)


@pytest.mark.asyncio
async def test_non_apk_magic_bytes_rejected() -> None:
    async def bad_stream():
        yield b"This is a plain text file pretending to be an apk"

    with pytest.raises(FileSafetyError) as exc_info:
        await save_upload_stream(bad_stream())
    assert exc_info.value.code == "not_an_apk"


@pytest.mark.asyncio
async def test_oversized_upload_rejected() -> None:
    async def oversized_stream():
        yield b"PK\x03\x04" + b"0" * (100 * 1024)

    # Force low limit for test via content_length
    with pytest.raises(FileSafetyError) as exc_info:
        await save_upload_stream(oversized_stream(), content_length=500 * 1024 * 1024)
    assert exc_info.value.code == "file_too_large"


def test_missing_manifest_rejected(tmp_path: Path) -> None:
    bad_zip = tmp_path / "nomanifest.zip"
    with zipfile.ZipFile(bad_zip, "w") as zf:
        zf.writestr("classes.dex", b"fake dex")

    with pytest.raises(FileSafetyError) as exc:
        validate_zip_members(bad_zip)
    assert exc.value.code == "not_an_apk"


def test_safe_temp_apk_cleanup(tmp_path: Path) -> None:
    sample = tmp_path / "temp.apk"
    sample.write_bytes(b"dummy")
    assert sample.exists()

    with safe_temp_apk(sample):
        assert sample.exists()

    assert not sample.exists()
