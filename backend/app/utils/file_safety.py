"""Upload file validation, safe streaming, and zip-bomb guards (F1, 3.1).

Enforces:
- File size cap
- Streaming to temporary file with O(1) memory
- SHA-256 computation in the same streaming pass
- ZIP magic bytes check (PK\x03\x04)
- Verification that AndroidManifest.xml exists
- Zip-bomb protections (entry count, member size, total decompressed size caps)
- Temp file lifecycle management
"""

from __future__ import annotations

import hashlib
import os
import secrets
import tempfile
import zipfile
from collections.abc import AsyncIterator
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from app.config import get_settings

ZIP_MAGIC = b"PK\x03\x04"
CHUNK_SIZE = 64 * 1024


class FileSafetyError(ValueError):
    """Raised for unsafe or invalid upload files."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def validate_zip_members(file_path: Path) -> None:
    """Inspects zip structure without extracting to disk.

    Guards against zip-bombs:
    - Checks entry count <= zip_max_entries
    - Checks individual member size <= zip_max_member_bytes
    - Checks total decompressed size <= zip_max_total_bytes
    - Confirms AndroidManifest.xml is present
    """
    settings = get_settings()

    try:
        with zipfile.ZipFile(file_path, "r") as zf:
            infolist = zf.infolist()
            if len(infolist) > settings.zip_max_entries:
                raise FileSafetyError(
                    "not_an_apk",
                    f"Archive exceeds maximum entries limit ({settings.zip_max_entries})",
                )

            total_decompressed = 0
            has_manifest = False

            for info in infolist:
                if info.file_size > settings.zip_max_member_bytes:
                    raise FileSafetyError(
                        "not_an_apk",
                        f"Zip entry {info.filename} exceeds member size limit",
                    )
                total_decompressed += info.file_size
                if total_decompressed > settings.zip_max_total_bytes:
                    raise FileSafetyError(
                        "not_an_apk",
                        "Archive exceeds total decompressed size limit",
                    )

                if info.filename == "AndroidManifest.xml":
                    has_manifest = True

            if not has_manifest:
                raise FileSafetyError(
                    "not_an_apk",
                    "Archive is missing AndroidManifest.xml",
                )
    except zipfile.BadZipFile as exc:
        raise FileSafetyError("not_an_apk", "Invalid zip file structure") from exc


async def save_upload_stream(
    chunks: AsyncIterator[bytes],
    content_length: int | None = None,
) -> tuple[Path, str]:
    """Streams uploaded chunks into a securely named temp file while hashing SHA-256.

    Validates:
    - Content-Length and accumulated bytes <= max_apk_bytes
    - Magic bytes == PK\x03\x04
    - Archive contains AndroidManifest.xml and respects zip-bomb limits
    """
    settings = get_settings()
    max_bytes = settings.max_apk_bytes

    if content_length is not None and content_length > max_bytes:
        raise FileSafetyError("file_too_large", f"File exceeds {settings.max_apk_mb}MB limit")

    random_name = f"upload_{secrets.token_hex(16)}.apk"
    temp_dir = Path(tempfile.gettempdir())
    target_path = temp_dir / random_name

    hasher = hashlib.sha256()
    total_written = 0
    first_chunk = True

    try:
        with target_path.open("wb") as dst:
            async for chunk in chunks:
                if not chunk:
                    continue
                if first_chunk:
                    first_chunk = False
                    if not chunk.startswith(ZIP_MAGIC):
                        raise FileSafetyError("not_an_apk", "File does not start with ZIP magic bytes")

                total_written += len(chunk)
                if total_written > max_bytes:
                    raise FileSafetyError("file_too_large", f"File exceeds {settings.max_apk_mb}MB limit")

                hasher.update(chunk)
                dst.write(chunk)

        if total_written == 0:
            raise FileSafetyError("not_an_apk", "Uploaded file is empty")

        validate_zip_members(target_path)
        return target_path, hasher.hexdigest()
    except Exception:
        if target_path.exists():
            try:
                target_path.unlink()
            except OSError:
                pass
        raise


@contextmanager
def safe_temp_apk(path: Path) -> Generator[Path, None, None]:
    """Ensures temp file is unlinked on any exit path."""
    try:
        yield path
    finally:
        if path.exists():
            try:
                path.unlink()
            except OSError:
                pass
