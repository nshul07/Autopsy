"""Version-diff logic (F13).

Compares a scanned APK manifest against historical data for the same package.
Tracks added groups, removed groups, version-code bump, and certificate changes.
"""

from __future__ import annotations

from app.core.signer_history import has_signer_changed
from app.models.schemas import UpdateDiff


def compute_version_diff(
    package_history: dict | None,
    current_version_code: int | None,
    current_cert_sha256: list[str],
    current_groups: frozenset[str],
) -> UpdateDiff:
    if not package_history:
        return UpdateDiff(has_history=False)

    prior_groups = set(package_history.get("groups", []))
    curr_groups = set(current_groups)

    added = sorted(curr_groups - prior_groups)
    removed = sorted(prior_groups - curr_groups)

    prior_vc = package_history.get("version_code")
    version_changed = False
    if current_version_code is not None and prior_vc is not None:
        version_changed = current_version_code != prior_vc

    prior_cert = package_history.get("cert_sha256")
    cert_changed = has_signer_changed(prior_cert, current_cert_sha256)

    return UpdateDiff(
        has_history=True,
        groups_added=added,
        groups_removed=removed,
        version_changed=version_changed,
        cert_changed=cert_changed,
    )
