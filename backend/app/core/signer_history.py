"""Shared cert-change detection helper (F12 signal 3 + F13).

Compares current signing certificate fingerprints against historical fingerprints
for the same package.
"""

from __future__ import annotations


def has_signer_changed(
    prior_cert_sha256: str | None,
    current_certs_sha256: list[str],
) -> bool:
    """Returns True if a prior cert exists and none of the current certs match it."""
    if not prior_cert_sha256 or not current_certs_sha256:
        return False

    prior = prior_cert_sha256.strip().lower()
    current = {c.strip().lower() for c in current_certs_sha256 if c}

    return prior not in current
