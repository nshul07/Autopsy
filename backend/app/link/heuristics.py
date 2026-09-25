"""Offline link heuristics (F10).

Evaluates structural URL features against rules without making network requests.

The brand look-alike check here is a field-for-field port of the Kotlin engine
(`shared/.../link/Heuristics.kt`), which is the canonical implementation. An
earlier version of this file only ran a bare Levenshtein distance against each
brand's SLD, and the measured cost of that was two phishing URLs scoring
**green**: `microsoft-secure-login.xyz` (10) and `sbi.verify-loan.xyz` (20). A
bank impersonation that scores green is worse than no check at all, so the four
signals below — wrong-TLD exact, typo-squat, lured containment, subdomain
spoof — are the point, not a refinement.
"""

from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import urlparse

import tldextract
from rapidfuzz.distance import Levenshtein

from app.core.rules_loader import Rules, get_rules
from app.link.homoglyphs import fold, decode_host
from app.models.schemas import CheckStatus, LinkCheckResult


def _extract_domain_parts(hostname: str) -> tuple[str, str, str]:
    """Returns (subdomain, domain, suffix) using tldextract."""
    ext = tldextract.extract(hostname)
    return ext.subdomain, ext.domain, ext.suffix


@dataclass(frozen=True)
class BrandMatch:
    """A brand impersonation hit, plus how damning the signal is.

    ``strong`` means "impersonation by construction, not a coincidence": the
    scorer turns those straight to RED, because a 35-point check would
    otherwise only warn.
    """

    brand: str
    strong: bool


# Words that only ever appear next to a brand in a phishing lure. Their
# presence next to a brand token turns a mere "contains the brand name"
# coincidence into an impersonation signal.
LURE_WORDS: frozenset[str] = frozenset(
    {
        "verify", "verification", "secure", "security", "login", "signin",
        "logon", "update", "kyc", "reward", "rewards", "claim", "support",
        "account", "wallet", "pay", "payment", "payments", "banking",
        "netbanking", "official", "service", "services", "help", "helpdesk",
        "alert", "notice", "gift", "gifts", "offer", "offers", "bonus",
        "team", "care", "customer", "customercare", "portal", "auth",
        "online", "india", "app", "refund", "cashback", "loan", "loans",
        "card", "upi", "unlock", "confirm",
    }
)


def _bounded_edit_distance(a: str, b: str, max_dist: int) -> int:
    """Levenshtein with an early abort once a row minimum exceeds max_dist.

    Same prefilter discipline as AGENTS.md 10.2: never run an unrestricted
    distance. Returns ``max_dist + 1`` as the "too far to care" sentinel.
    """
    if a == b:
        return 0
    if abs(len(a) - len(b)) > max_dist:
        return max_dist + 1
    return Levenshtein.distance(a, b, score_cutoff=max_dist + 1)


def check_brand_lookalike_match(
    hostname: str,
    rules: Rules,
) -> BrandMatch | None:
    """Brand look-alike, four signals:

    1. exact brand SLD on a wrong TLD — sbi.xyz, microsoft.net       [strong]
    2. typo-squat — small edit distance to a brand token  — rnmicrosoft [strong]
    3. containment — a brand token buried in a lured-up domain —
       microsoft-secure-login, paytm-verify, claim-reward-flipkart   [weak]
    4. subdomain spoof — brand token among the labels while someone else owns
       the domain — sbi.verify-loan.xyz, microsoft.com.verify-login.xyz [strong]

    The brand's own domains (including any subdomain of them) return None, so
    login.microsoft.com stays clean. That is the exact-match guard below.
    """
    max_dist = rules.link_rules.get("lookalike_max_edit_distance", 2)
    len_tol = rules.link_rules.get("lookalike_length_tolerance", 2)

    # Punycode first (xn--pple-43d.com -> аpple.com), then fold confusables to
    # ASCII (а -> a -> apple). The raw-vs-official guard below uses only the
    # DECODED string, so a homoglyph "аpple.com" never passes as the real
    # apple.com: folding is for matching brands, never for trusting hosts.
    lowered = hostname.lower().strip()
    decoded = decode_host(lowered) if "xn--" in lowered else lowered
    subdomain, sld, suffix = _extract_domain_parts(decoded)
    reg = f"{sld}.{suffix}" if suffix else sld
    if not reg:
        return None

    raw_labels = [label for label in decoded.split(".") if label]
    sld_folded = fold(sld)
    labels_folded = {fold(label) for label in raw_labels}
    # Every brand alias doubles as a lure word for its own brand ("upi" is both
    # a BHIM UPI alias and a lure word), so a lure signal on the SLD itself
    # proves nothing — upi.com lured itself into a forced RED on a real news
    # site. Only subdomain labels and hyphenated/underscored parts count.
    lure_scope = [part for part in raw_labels if part != sld]
    lure_scope += [part for label in raw_labels for part in re.split(r"[-_]", label)[1:]]
    lured = any(fold(part) in LURE_WORDS for part in lure_scope)

    suspicious_tlds = {t.lower() for t in rules.link_rules.get("suspicious_tlds", [])}
    suffix_is_suspicious = suffix.lower() in suspicious_tlds

    for brand in rules.brands:
        # Order-preserving, like the Kotlin engine's LinkedHashSet: the fuzzy
        # loop below returns on the first token that matches, so declaration
        # order decides whether a hit is graded strong. Building this as a plain
        # set reintroduces hash-order nondeterminism between runs.
        official = tuple(dict.fromkeys(d.lower() for d in brand.official_domains))
        # Literally the brand's own domain — never the folded form! — is clean.
        if reg in official or any(o and reg.endswith(f".{o}") for o in official):
            continue
        # The brand's own SLD under a different public suffix is still the
        # brand's own site: amazon.co.uk, amazon.de, google.co.jp are Amazon's
        # and Google's, even though official_domains only lists .com/.in. Every
        # ccTLD variant of every brand cannot be enumerated, so match the SLD
        # and require only that the suffix is not one a phishing kit would
        # pick. Measured cost of the missing guard: amazon.co.uk, amazon.ca
        # and amazon.fr were all forced RED — a false alarm on the real store.
        # A wrong-TLD squat on amazon.xyz / amazon.tk still trips this check,
        # because those suffixes are suspicious.
        if not suffix_is_suspicious and any(
            o and sld == _extract_domain_parts(o)[1] for o in official
        ):
            continue

        def _norm(text: str) -> str:
            return text.lower().replace(" ", "")

        exact_tokens = {
            t for t in (
                {_extract_domain_parts(o)[1] for o in official}
                | {_norm(brand.name)}
                | {_norm(a) for a in brand.aliases}
            ) if len(t) >= 3
        }
        fuzzy_candidates = [
            _norm(brand.name),
            *(_norm(a) for a in brand.aliases),
        ]
        if official:
            # official.firstOrNull() in Kotlin — first in declaration order,
            # not an arbitrary member.
            fuzzy_candidates.append(_extract_domain_parts(official[0])[1])
        # Fuzzy typo-squat candidates need real length: a 4-char token like
        # "uber" is 1 edit from "aber" (aber.ac.uk) and would force RED on a
        # university. Containment instead runs on short tokens too, because it
        # is gated on a lure word next to the brand — "paytm-verify" and
        # "sbi.verify-loan" must keep working, and "olive"/"snapple" still do
        # not, since neither is lured up.
        fuzzy_tokens = tuple(
            dict.fromkeys(t for t in fuzzy_candidates if len(t) >= 6)
        )
        contain_tokens = tuple(
            dict.fromkeys(t for t in fuzzy_candidates if len(t) >= 3)
        )
        # 1. right brand name, wrong domain — in ASCII or via homoglyphs. A
        #    long brand word (microsoft, paytm) matching an SLD that is not the
        #    brand's is impersonation outright. A SHORT alias is a coincidence:
        #    "upi" is the alias of BHIM UPI and also upi.com, a real news
        #    agency, so short tokens only force a match when the TLD is already
        #    suspicious (sbi.xyz) or a lure word is present.
        if sld_folded in exact_tokens:
            if len(sld_folded) >= 5 or suffix_is_suspicious or lured:
                return BrandMatch(brand.name, strong=True)

        for token in fuzzy_tokens:
            # 2. typo-squat, distance budget scaled to token length. Distance 1
            #    only: at distance 2 a short token matches unrelated words —
            #    measured cost was "telegraph" being 2 edits from "telegram",
            #    which forced RED on telegraph.co.uk. A 7+ char token gets the
            #    full rules budget, but each extra edit past the first raises
            #    the length bar: a 2-edit hit needs a >= 9 char token
            #    (microsoft/office365 still qualify; telegram alone does not).
            budget = max_dist if len(token) >= 7 else 1
            if budget > 1 and len(token) < 9:
                budget = 1
            if budget > 0 and abs(len(sld_folded) - len(token)) <= len_tol:
                dist = _bounded_edit_distance(sld_folded, token, budget)
                # A two-edit hit only accuses when the brand word is still a
                # substring of the domain — a real character-level wrap
                # (rnmicrosoft, microsooft). Anything else at distance 2 is a
                # coincidence the engine cannot distinguish from a squat:
                # "rnicrosoft" (a genuine Microsoft squat) and "picosoft" (a
                # real Italian software firm) are both one insertion from
                # "microsoft" and differ by no string test whatsoever, and
                # "citibank"/"hiexpress"/"oakbank" are the same story against
                # icicibank/dhlexpress/kotakbank. Demanding the embedded brand
                # word keeps every real site clean (hiexpress, devexpress,
                # picosoft, citibank.co.uk, oakbank.co.nz were all forced RED
                # before) at the documented cost of one miss: "rnicrosoft" is
                # no longer caught. That trade is deliberate — crying wolf on a
                # real bank costs more trust than missing one typosquat, and a
                # wrap that keeps the brand visible is the signal a phisher
                # actually relies on.
                if 1 <= dist <= budget and (dist == 1 or token in sld_folded):
                    return BrandMatch(brand.name, strong=True)

        for token in contain_tokens:
            # 3. containment — only when the domain is lured up. A bare
            #    containment match is too loose: "olive" contains "live",
            #    "snapple" contains "apple", "costco" contains "cost".
            if lured and len(sld_folded) > len(token) and token in sld_folded:
                return BrandMatch(brand.name, strong=True)

        # 4. brand token in the hostname but someone else owns the domain.
        #    Require a lure signal, because a lone brand label is usually a real
        #    subdomain — microsoft.wikia.com and blog.google.com are not
        #    phishing. A lured label is the spoof: sbi.verify-loan.xyz,
        #    login.microsoft.com.evil.tk. The lure gate is what makes a short
        #    brand label ("sbi") safe to honour here; without it "navy.mil"
        #    would read as the brand "Navi".
        if lured and any(len(label) >= 3 and label in exact_tokens for label in labels_folded):
            return BrandMatch(brand.name, strong=True)

    return None


def check_brand_lookalike(
    hostname: str,
    rules: Rules,
) -> tuple[bool, str | None, bool]:
    """Compat wrapper: (matched, brand name, strong)."""
    match = check_brand_lookalike_match(hostname, rules)
    if match is None:
        return False, None, False
    return True, match.brand, match.strong


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

    # 3. Punycode — show the user the address as it really spells. The decoded
    #    string is what lets the reason text name the impersonated brand, and
    #    what lets the scorer treat "punycode + brand match" as a hard spoof.
    if "xn--" in hostname:
        chk = checks_cfg.get("punycode", {})
        results.append(
            LinkCheckResult(
                id="punycode",
                status="flagged",
                points=chk.get("points", 20),
                reason_key=chk.get("reason_key", "link.punycode"),
                params={"decoded": decode_host(hostname)},
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

    # 10. Injected credential path. The largest family of phishing URLs has no
    #     brand word anywhere: a compromised legit site (often WordPress) gets a
    #     dropper written into its own folders and the phish lives at a path
    #     like /wp-content/themes/x/PayPal/login.php. Structure alone catches
    #     it: a request for sign-in details that resolves into the site's own
    #     internal plumbing. Measured on 20k bad / 20k good URLs: this fires on
    #     5.0% of bad and 0.00% of good (the pairing is what does the work —
    #     either signal alone is common on healthy sites).
    path_lower = parsed.path.lower()
    inject_dirs = tuple(cfg.get("inject_dirs", ()))
    credential_words = tuple(cfg.get("credential_words", ()))
    if any(d in path_lower for d in inject_dirs) and any(
        w in path_lower for w in credential_words
    ):
        chk = checks_cfg.get("phish_path", {})
        results.append(
            LinkCheckResult(
                id="phish_path",
                status="flagged",
                points=chk.get("points", 30),
                reason_key=chk.get("reason_key", "link.phish_path"),
                params={},
            )
        )

    # 11. Brand look-alike (typo squat, homoglyph, containment, subdomain
    #     spoof). Strength is encoded in a param the scorer reads: points alone
    #     cannot express "this is impersonation by construction".
    match = check_brand_lookalike_match(hostname, rules)
    if match is not None:
        chk = checks_cfg.get("brand_lookalike", {})
        params = {"brand": match.brand}
        if match.strong:
            params["strong"] = "1"
        results.append(
            LinkCheckResult(
                id="brand_lookalike",
                status="flagged",
                points=chk.get("points", 35),
                reason_key=chk.get("reason_key", "link.brand_lookalike"),
                params=params,
            )
        )

    return results
