#!/usr/bin/env python3
"""F12 Tool: Extract signing certificate SHA-256 fingerprints from an official APK.

Usage:
    python tools/collect_certs.py path/to/official_app.apk
"""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

try:
    from androguard.core.apk import APK
except ImportError:
    from androguard.core.bytecodes.apk import APK


def extract_certs(apk_path: str) -> list[str]:
    path = Path(apk_path)
    if not path.exists():
        print(f"File not found: {apk_path}", file=sys.stderr)
        sys.exit(1)

    apk = APK(str(path))
    certs: list[bytes] = []

    if hasattr(apk, "get_certificates_der_v3"):
        certs.extend(apk.get_certificates_der_v3() or [])
    if hasattr(apk, "get_certificates_der_v2"):
        certs.extend(apk.get_certificates_der_v2() or [])
    if not certs and hasattr(apk, "get_certificates_der_v1"):
        certs.extend(apk.get_certificates_der_v1() or [])

    sha256_list = []
    for c in certs:
        fp = hashlib.sha256(c).hexdigest().lower()
        if fp not in sha256_list:
            sha256_list.append(fp)

    return sha256_list


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python tools/collect_certs.py <apk_file>", file=sys.stderr)
        sys.exit(1)

    apk_file = sys.argv[1]
    fps = extract_certs(apk_file)
    print(f"Certificate fingerprints for {apk_file}:")
    for fp in fps:
        print(f"  {fp}")


if __name__ == "__main__":
    main()
