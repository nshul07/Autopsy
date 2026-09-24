import pytest
from app.link.heuristics import evaluate_offline_heuristics
from app.link.normalize import normalize_url


def test_link_heuristics_flags() -> None:
    # 1. Direct APK
    url1 = normalize_url("https://example.com/app/update.apk")
    res1 = evaluate_offline_heuristics(url1)
    ids1 = {r.id for r in res1}
    assert "direct_apk" in ids1

    # 2. No HTTPS
    url2 = normalize_url("http://example.com/login")
    res2 = evaluate_offline_heuristics(url2)
    ids2 = {r.id for r in res2}
    assert "no_https" in ids2

    # 3. IP host
    url3 = normalize_url("http://198.51.100.1/test")
    res3 = evaluate_offline_heuristics(url3)
    ids3 = {r.id for r in res3}
    assert "ip_host" in ids3

    # 4. Punycode
    url4 = normalize_url("https://xn--e1afmkfd.com/download")
    res4 = evaluate_offline_heuristics(url4)
    ids4 = {r.id for r in res4}
    assert "punycode" in ids4

    # 5. Scam keyword
    url5 = normalize_url("https://example.com/claim-reward-kyc")
    res5 = evaluate_offline_heuristics(url5)
    ids5 = {r.id for r in res5}
    assert "scam_keywords" in ids5
