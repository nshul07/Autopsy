"""Streaming SHA-256 over an open file object.

Deliberately chunked: a 100 MB APK must cost O(chunk) memory, never O(file).
"""

import hashlib
from typing import BinaryIO

CHUNK_SIZE = 64 * 1024


def sha256_stream(stream: BinaryIO) -> str:
    """Return the hex SHA-256 of ``stream`` without loading it into memory.

    Time O(n) in file size, space O(CHUNK_SIZE). The stream is read to EOF and
    left at the end; callers that need to re-read it should seek first.
    """
    digest = hashlib.sha256()
    while True:
        chunk = stream.read(CHUNK_SIZE)
        if not chunk:
            break
        digest.update(chunk)
    return digest.hexdigest()