"""Offline link heuristics and the brand look-alike engine.

The regression this file exists for, measured before the port: an earlier
``check_brand_lookalike`` ran a bare Levenshtein distance against each brand's
SLD only, and the cost was two phishing URLs scoring **green** —
``microsoft-secure-login.xyz`` (10) and ``sbi.verify-loan.xyz`` (20). A bank
impersonation that scores green is worse than no check at all, so the verdicts,
not just the flagged ids, are asserted below.

The demo table here mirrors ``shared/src/jvmTest/.../LinkDetectionTest.kt``. If
a rules edit moves a verdict on either side, one of the two files fails.
"""

import pytest

from app.link.heuristics import (
    check_brand_lookalike,
    check_brand_lookalike_match,
    evaluate_offline_heuristics,
)
from app.link.homoglyphs import decode_host, fold
from app.link.normalize import normalize_url
from app.link.scorer import check_link


def _rules():
    from app.core.rules_loader import get_rules

    return get_rules()


def _ids(url: str) -> set[str]:
    return {r.id for r in evaluate_offline_heuristics(normalize_url(url))}


# ---- individual checks ------------------------------------------------------


def test_link_heuristics_flags() -> None:
    # 1. Direct APK
    assert "direct_apk" in _ids("https://example.com/app/update.apk")

    # 2. No HTTPS
    assert "no_https" in _ids("http://example.com/login")

    # 3. IP host
    assert "ip_host" in _ids("http://198.51.100.1/test")

    # 4. Punycode
    assert "punycode" in _ids("https://xn--e1afmkfd.com/download")

    # 5. Scam keyword
    assert "scam_keywords" in _ids("https://example.com/claim-reward-kyc")


def test_punycode_host_carries_the_decoded_form() -> None:
    """The decoded string is what lets the reason text name the real brand —
    and what lets the scorer see "punycode + brand hit" as a hard spoof."""
    checks = evaluate_offline_heuristics(normalize_url("http://xn--pple-43d.com/"))
    punycode = next(c for c in checks if c.id == "punycode")
    assert punycode.params.get("decoded") == "аpple.com"
    assert fold(punycode.params["decoded"]) == "apple.com"


def test_punycode_decoder_round_trips() -> None:
    assert decode_host("xn--pple-43d.com") == "аpple.com"
    # A non-punycode host passes through untouched.
    assert decode_host("login.microsoft.com") == "login.microsoft.com"
    # Malformed input must not raise — a decoder that throws is a crash on a
    # hostile input, which is exactly the input this code exists to look at.
    for bad in ("xn--", "xn--.com", "xn--a.com", "xn--!!!.com"):
        decode_host(bad)


# ---- brand look-alike: the four signals -------------------------------------


def test_typo_squat_matches_the_brand() -> None:
    matched, brand, strong = check_brand_lookalike("rnmicrosoft.com", _rules())
    assert matched and brand == "Microsoft" and strong


def test_brand_token_buried_in_a_lure_is_flagged() -> None:
    assert check_brand_lookalike("microsoft-secure-login.xyz", _rules())[1] == "Microsoft"
    assert (
        check_brand_lookalike("sbi.verify-loan.xyz", _rules())[1] == "State Bank of India"
    )


def test_bare_containment_without_a_lure_word_does_not_false_positive() -> None:
    # "snapple" contains "apple" but no lure word: not an impersonation.
    rules = _rules()
    assert check_brand_lookalike_match("snapple.com", rules) is None
    assert check_brand_lookalike_match("olive.com", rules) is None


def test_official_brand_domains_stay_clean() -> None:
    rules = _rules()
    for host in (
        "apple.com",
        "login.microsoft.com",
        "outlook.office.com",
        "sbi.co.in",
        "secure.yono.sbi",
        "www.swiggy.com",
        "t.me",
    ):
        assert check_brand_lookalike_match(host, rules) is None, host


# ---- the verdict table: the part that was wrong -----------------------------


PHISHING = [
    "http://xn--pple-43d.com/",
    "https://rnmicrosoft.com/signin",
    "https://microsoft-secure-login.xyz",
    "https://sbi.verify-loan.xyz/ok",
    "http://paytm-verify.top/kyc",
]

CLEAN = [
    "https://login.microsoft.com/home",
    "https://www.swiggy.com/menu",
    "https://apple.com/",
    "https://outlook.office.com/mail",
    "https://secure.yono.sbi/",
]


@pytest.mark.asyncio
@pytest.mark.parametrize("url", PHISHING)
async def test_every_impersonation_link_scores_red(url: str) -> None:
    report = await check_link(url)
    assert report.verdict == "red", f"{url} -> {report.verdict} {report.score}"
    assert report.critical_check_triggered


@pytest.mark.asyncio
@pytest.mark.parametrize("url", CLEAN)
async def test_no_false_positives_on_real_domains(url: str) -> None:
    report = await check_link(url)
    assert report.verdict == "green", f"{url} -> {report.verdict} {report.score}"
    assert not report.critical_check_triggered


@pytest.mark.asyncio
async def test_bare_ip_host_stays_a_warning_not_a_red() -> None:
    """An IP host has no domain, so no brand signal can fire. Correct
    arithmetic, and deliberately left a warning: ``ip_host`` is not marked
    critical in link_rules.json. Flipping that flag is the one-word fix if you
    disagree — this test asserts the current contract, not a preference."""
    report = await check_link("http://193.44.55.66/paytm-verify")
    assert report.verdict == "yellow"
    assert not report.critical_check_triggered
