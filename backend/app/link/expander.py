"""SSRF-guarded manual redirect expander (F10, 3.2).

Follows redirects step-by-step, re-validating the SSRF guard before every hop.
Only reads headers; NEVER reads response bodies.
"""

from __future__ import annotations

import logging
from urllib.parse import urljoin, urlparse

import httpx

from app.core.rules_loader import Rules, get_rules
from app.models.schemas import LinkCheckResult
from app.utils.net_safety import SSRFBlockedError, validate_url_safety

logger = logging.getLogger(__name__)


class ExpandedLinkInfo:
    def __init__(
        self,
        final_url: str,
        redirect_chain: list[str],
        is_direct_apk: bool,
        downgrade_redirect: bool,
    ) -> None:
        self.final_url = final_url
        self.redirect_chain = redirect_chain
        self.is_direct_apk = is_direct_apk
        self.downgrade_redirect = downgrade_redirect


async def expand_link_safely(
    initial_url: str,
    rules: Rules | None = None,
) -> tuple[ExpandedLinkInfo, list[LinkCheckResult]]:
    rules = rules or get_rules()
    cfg = rules.link_rules
    redir_cfg = cfg.get("redirect", {})
    checks_cfg = cfg.get("checks", {})

    max_hops = redir_cfg.get("max_hops", 5)
    timeout = redir_cfg.get("timeout_seconds", 5.0)
    user_agent = redir_cfg.get("user_agent", "AppAutopsy-LinkChecker/1.0")

    apk_extensions = tuple(cfg.get("apk_extensions", [".apk", ".xapk", ".apks"]))
    apk_content_types = set(cfg.get("apk_content_types", ["application/vnd.android.package-archive"]))

    current_url = initial_url
    chain: list[str] = [current_url]
    is_direct_apk = False
    downgrade_redirect = False
    additional_checks: list[LinkCheckResult] = []

    headers = {"User-Agent": user_agent}

    # Manual redirect loop
    for _ in range(max_hops):
        # SSRF validation before every hop
        try:
            validate_url_safety(current_url)
        except SSRFBlockedError as exc:
            logger.warning("SSRF blocked during redirect expansion: %s", exc)
            break

        parsed_curr = urlparse(current_url)
        if parsed_curr.path.lower().endswith(apk_extensions):
            is_direct_apk = True

        try:
            async with httpx.AsyncClient(
                timeout=timeout,
                follow_redirects=False,
                verify=True,
            ) as client:
                # HEAD request first
                try:
                    resp = await client.head(current_url, headers=headers)
                except httpx.HTTPError:
                    # Streamed GET fallback, headers only
                    async with client.stream("GET", current_url, headers=headers) as stream_resp:
                        resp = stream_resp

                # Check content headers for APK
                ct = resp.headers.get("content-type", "").lower().split(";")[0].strip()
                cd = resp.headers.get("content-disposition", "").lower()

                if ct in apk_content_types or ".apk" in cd:
                    is_direct_apk = True

                # Check redirect
                if resp.status_code in (301, 302, 303, 307, 308):
                    location = resp.headers.get("location")
                    if not location:
                        break

                    next_url = urljoin(current_url, location)
                    chain.append(next_url)

                    # Downgrade check (https -> http)
                    if urlparse(current_url).scheme == "https" and urlparse(next_url).scheme == "http":
                        downgrade_redirect = True

                    current_url = next_url
                else:
                    break
        except Exception as exc:
            logger.info("Redirect expansion stopped: %s", exc)
            break

    if downgrade_redirect:
        chk = checks_cfg.get("downgrade_redirect", {})
        additional_checks.append(
            LinkCheckResult(
                id="downgrade_redirect",
                status="flagged",
                points=chk.get("points", 15),
                reason_key=chk.get("reason_key", "link.downgrade_redirect"),
                params={},
            )
        )

    if is_direct_apk:
        chk = checks_cfg.get("direct_apk", {})
        additional_checks.append(
            LinkCheckResult(
                id="direct_apk",
                status="flagged",
                points=chk.get("points", 30),
                reason_key=chk.get("reason_key", "link.direct_apk"),
                params={},
            )
        )

    info = ExpandedLinkInfo(
        final_url=current_url,
        redirect_chain=chain,
        is_direct_apk=is_direct_apk,
        downgrade_redirect=downgrade_redirect,
    )
    return info, additional_checks
