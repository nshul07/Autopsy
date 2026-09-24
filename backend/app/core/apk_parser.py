"""Androguard manifest-only APK parser (F2).

Extracts label, package, version, permissions, components, and signing certificate
SHA-256 fingerprints from an APK without analyzing DEX code.

Strict performance rule from AGENTS.md:
Never call get_dex() or dvm on the hot path. Manifest-only extraction is sub-second.
"""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path

try:
    from androguard.core.apk import APK
except ImportError:
    from androguard.core.bytecodes.apk import APK

from app.core.axml import parse_axml_tree
from app.core.components import extract_manifest_components
from app.models.schemas import CertCheck, ParsedApk

logger = logging.getLogger(__name__)


def extract_cert_fingerprints(apk: APK) -> tuple[list[str], CertCheck]:
    """Safely extracts SHA-256 fingerprints of the signing certificates.

    Never raises: on any error returns ([], "not_checked").
    """
    certs_sha256: list[str] = []
    try:
        # Androguard methods for certificates: v3, v2, v1
        der_certs: list[bytes] = []
        if hasattr(apk, "get_certificates_der_v3"):
            der_certs.extend(apk.get_certificates_der_v3() or [])
        if hasattr(apk, "get_certificates_der_v2"):
            der_certs.extend(apk.get_certificates_der_v2() or [])
        if not der_certs and hasattr(apk, "get_certificates_der_v1"):
            der_certs.extend(apk.get_certificates_der_v1() or [])
        if not der_certs and hasattr(apk, "get_certificates"):
            for cert in apk.get_certificates() or []:
                if hasattr(cert, "dump"):
                    der_certs.append(cert.dump())
                elif hasattr(cert, "sha256"):
                    certs_sha256.append(cert.sha256.replace(":", "").lower())

        for der in der_certs:
            if der:
                fingerprint = hashlib.sha256(der).hexdigest().lower()
                if fingerprint not in certs_sha256:
                    certs_sha256.append(fingerprint)

        status: CertCheck = "ok" if certs_sha256 else "not_checked"
        return certs_sha256, status
    except Exception as exc:
        logger.warning("Certificate extraction failed: %s", exc)
        return [], "not_checked"


def parse_apk(file_path: Path, sha256_hash: str) -> ParsedApk:
    """Parse an APK file into a ParsedApk schema.

    Uses androguard on the manifest-only path.
    """
    apk = APK(str(file_path))

    # Manifest extraction
    raw_axml = apk.get_android_manifest_axml()
    root = parse_axml_tree(raw_axml)
    comp = extract_manifest_components(root)

    # App label
    label: str | None = None
    try:
        label = apk.get_app_name()
    except Exception:
        pass
    if not label:
        label = comp.get("package")

    # Certs
    certs, cert_status = extract_cert_fingerprints(apk)

    return ParsedApk(
        label=label,
        package=comp.get("package"),
        version_name=comp.get("version_name"),
        version_code=comp.get("version_code"),
        min_sdk=comp.get("min_sdk"),
        target_sdk=comp.get("target_sdk"),
        sha256=sha256_hash,
        permissions=comp.get("permissions", []),
        services=comp.get("services", []),
        receivers=comp.get("receivers", []),
        activities=comp.get("activities", []),
        has_launcher_activity=comp.get("has_launcher_activity", False),
        signing_cert_sha256=certs,
        cert_check=cert_status,
    )
