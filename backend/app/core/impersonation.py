"""Brand impersonation detection (F12 signal 1 & look-alike brands).

Detects when an app uses a name or package mimicking a known brand but does not
originate from the brand's official package list.
"""

from __future__ import annotations

from app.core.rules_loader import Brand, Rules, get_rules
from app.models.schemas import ImpersonationResult


def detect_impersonation(
    label: str | None,
    package: str | None,
    rules: Rules | None = None,
) -> ImpersonationResult | None:
    """Checks if an app impersonates a known brand.

    If an alias of a brand appears in the label or package name, but the package
    is NOT in the brand's official packages list, impersonation is detected.
    """
    rules = rules or get_rules()
    target_text = f"{label or ''} {package or ''}".lower()
    pkg_clean = (package or "").lower()

    for brand in rules.brands:
        # Check if any brand alias appears in label or package
        matched_alias = False
        for alias in brand.aliases:
            if alias in target_text:
                matched_alias = True
                break

        if matched_alias:
            # If the brand has known official packages
            if brand.official_packages:
                if pkg_clean not in brand.official_packages:
                    return ImpersonationResult(
                        brand=brand.name,
                        reason_key="impersonation.detected",
                    )

    return None
