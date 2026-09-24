"""Repackaging and signer-mismatch detector (F12) — The Wedge.

Detects when an app uses a genuine brand/package name but has been rebuilt
and re-signed by an unauthorized party.

Three independent signals:
1. Known-brand signer mismatch:
   Package is in official_packages, but cert_sha256 is not in official_cert_sha256
   (only checked when official_cert_sha256 is non-empty).
2. Package-name collision:
   Declared package matches a known brand, but the label does not match the brand alias.
3. Signer changed since last scan:
   Package history has a prior certificate, and current certificate differs.
"""

from __future__ import annotations

from app.core.rules_loader import Rules, get_rules
from app.core.signer_history import has_signer_changed
from app.models.schemas import RepackagingResult


def detect_repackaging(
    label: str | None,
    package: str | None,
    signing_certs: list[str],
    prior_cert_sha256: str | None = None,
    rules: Rules | None = None,
) -> RepackagingResult | None:
    rules = rules or get_rules()
    pkg_clean = (package or "").lower().strip()
    certs_clean = {c.lower().strip() for c in signing_certs if c}
    actual_cert = next(iter(certs_clean)) if certs_clean else None

    # Signal 3: Signer changed since last scan
    if prior_cert_sha256 and has_signer_changed(prior_cert_sha256, signing_certs):
        return RepackagingResult(
            detected=True,
            signal="signer_changed",
            expected_cert_sha256=prior_cert_sha256,
            actual_cert_sha256=actual_cert,
            detail_key="repackaging.signer_mismatch",
        )

    # Signal 1 & 2: Known brand checks
    target_text = f"{label or ''} {package or ''}".lower()

    for brand in rules.brands:
        brand_alias_matches = any(alias in target_text for alias in brand.aliases)
        is_official_package = pkg_clean in brand.official_packages

        # Signal 1: Known-brand signer mismatch
        if is_official_package and brand.official_cert_sha256:
            # We have known official certs for this brand
            matching_cert = bool(certs_clean & brand.official_cert_sha256)
            if not matching_cert:
                expected_first = next(iter(sorted(brand.official_cert_sha256)))
                return RepackagingResult(
                    detected=True,
                    signal="signer_mismatch",
                    expected_cert_sha256=expected_first,
                    actual_cert_sha256=actual_cert,
                    detail_key="repackaging.signer_mismatch",
                )

        # Signal 2: Package-name collision
        if is_official_package and not brand_alias_matches:
            return RepackagingResult(
                detected=True,
                signal="package_collision",
                expected_cert_sha256=None,
                actual_cert_sha256=actual_cert,
                detail_key="repackaging.package_collision",
            )

    return None
