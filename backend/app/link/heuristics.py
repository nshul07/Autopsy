"""Offline link heuristics (F10).

Evaluates structural URL features against rules without making network requests.
"""

from __future__ import annotations

import ipaddress
import re
from urllib.parse import urlparse

import tldextract
from rapidfuzz.distance import Levenshtein

from app.core.rules_loader import Rules, get_rules
from app.models.schemas import CheckStatus, LinkCheckResult


def _extract_domain_parts(hostname: str) -> tuple[str, str, str]:
    """Returns (subdomain, domain, suffix) using tldextract."""
    ext = tldextract.extract(hostname)
    return ext.subdomain, ext.domain, ext.suffix


def check_brand_lookalike(
    domain: str,
    rules: Rules,
) -> tuple[bool, str | None]:
    """Look-alike domain check with candidate prefiltering (AGENTS.md 10.2).

    Never run unrestricted rapidfuzz: prefilter by length +/- 2 and first character.
    """
    domain_clean = domain.lower().strip()
    if not domain_clean:
        return False, None

    max_dist = rules.link_rules.get("lookalike_max_edit_distance", 2)
    len_tol = rules.link_rules.get("lookalike_length_tolerance", 2)

    for brand in rules.brands:
        for official_domain in brand.official_domains:
            off_ext = tldextract.extract(official_domain)
            off_name = off_ext.domain.lower()

            if domain_clean == off_name:
                # Exact official domain, not a look-alike
                continue

            # Length pre-filter
            if abs(len(domain_clean) - len(off_name)) > len_tol:
                continue

            # First character check (or common typo)
            dist = Levenshtein.distance(domain_clean, off_name)
            if 0 < dist <= max_dist:
                return True, brand.name

    return False, None


def evaluate_offline_heuristics(
    url: str,
    rules: Rules | None = None,
) -> list[LinkCheckResult]:
    rules = rules or get_rules()
    cfg = rules.link_rules
    checks_cfg = cfg.get("checks", {})

    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    subdomain, domain_name, suffix = _extract_domain_parts(hostname)

    results: list[LinkCheckResult] = []

    # 1. No HTTPS
    if parsed.scheme.lower() == "http":
        chk = checks_cfg.get("no_https", {})
        results.append(
            LinkCheckResult(
                id="no_https",
                status="flagged",
                points=chk.get("points", 10),
                reason_key=chk.get("reason_key", "link.no_https"),
                params={},
            )
        )

    # 2. IP Host
    is_ip = False
    try:
        ipaddress.ip_address(hostname)
        is_ip = True
    except ValueError:
        pass
    if is_ip:
        chk = checks_cfg.get("ip_host", {})
        results.append(
            LinkCheckResult(
                id="ip_host",
                status="flagged",
                points=chk.get("points", 25),
                reason_key=chk.get("reason_key", "link.ip_host"),
                params={},
            )
        )

    # 3. Punycode
    if "xn--" in hostname:
        chk = checks_cfg.get("punycode", {})
        results.append(
            LinkCheckResult(
                id="punycode",
                status="flagged",
                points=chk.get("points", 20),
                reason_key=chk.get("reason_key", "link.punycode"),
                params={},
            )
        )

    # 4. At symbol (@)
    if "@" in url:
        chk = checks_cfg.get("at_symbol", {})
        results.append(
            LinkCheckResult(
                id="at_symbol",
                status="flagged",
                points=chk.get("points", 15),
                reason_key=chk.get("reason_key", "link.at_symbol"),
                params={},
            )
        )

    # 5. Suspicious TLD
    suspicious_tlds = set(cfg.get("suspicious_tlds", []))
    if suffix.lower() in suspicious_tlds:
        chk = checks_cfg.get("suspicious_tld", {})
        results.append(
            LinkCheckResult(
                id="suspicious_tld",
                status="flagged",
                points=chk.get("points", 10),
                reason_key=chk.get("reason_key", "link.suspicious_tld"),
                params={"tld": suffix},
            )
        )

    # 6. Deep subdomains
    if subdomain:
        sub_count = len([p for p in subdomain.split(".") if p])
        if sub_count >= 3:
            chk = checks_cfg.get("deep_subdomains", {})
            results.append(
                LinkCheckResult(
                    id="deep_subdomains",
                    status="flagged",
                    points=chk.get("points", 10),
                    reason_key=chk.get("reason_key", "link.deep_subdomains"),
                    params={"count": str(sub_count)},
                )
            )

    # 7. Shortener
    known_shorteners = set(cfg.get("known_shorteners", []))
    apex = f"{domain_name}.{suffix}".lower() if suffix else domain_name.lower()
    if apex in known_shorteners or hostname in known_shorteners:
        chk = checks_cfg.get("shortener", {})
        results.append(
            LinkCheckResult(
                id="shortener",
                status="flagged",
                points=chk.get("points", 5),
                reason_key=chk.get("reason_key", "link.shortener"),
                params={},
            )
        )

    # 8. Scam keywords
    scam_keywords = cfg.get("scam_keywords", [])
    url_lower = url.lower()
    found_keywords = [kw for kw in scam_keywords if kw in url_lower]
    if found_keywords:
        chk = checks_cfg.get("scam_keywords", {})
        pts = min(len(found_keywords) * chk.get("points", 10), chk.get("max_points", 20))
        results.append(
            LinkCheckResult(
                id="scam_keywords",
                status="flagged",
                points=pts,
                reason_key=chk.get("reason_key", "link.scam_keywords"),
                params={"keyword": found_keywords[0]},
            )
        )

    # 9. Direct APK in URL
    apk_extensions = tuple(cfg.get("apk_extensions", [".apk", ".xapk", ".apks"]))
    path_lower = parsed.path.lower()
    if path_lower.endswith(apk_extensions) or any(ext in url_lower for ext in apk_extensions):
        chk = checks_cfg.get("direct_apk", {})
        results.append(
            LinkCheckResult(
                id="direct_apk",
                status="flagged",
                points=chk.get("points", 30),
                reason_key=chk.get("reason_key", "link.direct_apk"),
                params={},
            )
        )

    # 10. Brand look-alike
    is_lookalike, brand_name = check_brand_lookalike(domain_name, rules)
    if is_lookalike:
        chk = checks_cfg.get("brand_lookalike", {})
        results.append(
            LinkCheckResult(
                id="brand_lookalike",
                status="flagged",
                points=chk.get("points", 35),
                reason_key=chk.get("reason_key", "link.brand_lookalike"),
                params={"brand": brand_name or ""},
            )
        )

    return results
