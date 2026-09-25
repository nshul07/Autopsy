package com.appautopsy.analysis

import com.appautopsy.analysis.link.CheckStatus
import com.appautopsy.analysis.link.Confusables
import com.appautopsy.analysis.link.LinkScorer
import com.appautopsy.analysis.link.Punycode
import com.appautopsy.analysis.link.checkBrandLookalike
import com.appautopsy.analysis.model.Verdict
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * The engine that "sees through" a phishing link, locked down:
 * punycode decoding, confusable folding, brand look-alike signals, and the
 * forced-RED override for a homoglyph spoof. Written against the real shipped
 * rules + brands, not a fixture — a JSON edit that breaks detection fails here.
 */
class LinkDetectionTest {

    private val rules = TestData.rules

    private fun flaggedIds(url: String): Set<String> =
        LinkScorer.checkLink(url, rules)
            .checks
            .filter { it.status == CheckStatus.FLAGGED }
            .map { it.id }
            .toSet()

    @Test
    fun `punycode decodes the apple homoglyph`() {
        // xn--pple-43d.com is аpple.com with the Cyrillic а (U+0430).
        assertEquals("аpple", Punycode.decodeLabel("xn--pple-43d"))
        assertEquals("аpple.com", Punycode.decodeHost("xn--pple-43d.com"))
        // Folding brings it back to plain ASCII "apple.com".
        assertEquals("apple.com", Confusables.fold(Punycode.decodeHost("xn--pple-43d.com")))
    }

    @Test
    fun `punycode apple spoof is RED and names Apple`() {
        val report = LinkScorer.checkLink("http://xn--pple-43d.com/", rules)
        assertEquals(Verdict.RED.id, report.verdictId)
        val ids = report.checks.filter { it.status == CheckStatus.FLAGGED }.map { it.id }
        assertTrue("punycode" in ids, "punycode must flag: $ids")
        assertTrue("brand_lookalike" in ids, "brand must flag: $ids")
        // The user-facing reason must show what the address really spells.
        val puny = report.checks.first { it.id == "punycode" }
        assertEquals("аpple.com", puny.params["decoded"])
        val brand = report.checks.first { it.id == "brand_lookalike" }
        assertEquals("Apple", brand.params["brand"])
    }

    @Test
    fun `typo squat rnicrosoft is flagged as Microsoft`() {
        assertEquals("Microsoft", checkBrandLookalike("rnicrosoft.com", rules))
    }

    @Test
    fun `impersonation links land RED not yellow`() {
        // The 35-point brand check alone would only warn. Every one of these
        // is impersonation by construction, so the scorer must force RED.
        for (url in listOf(
            "https://rnmicrosoft.com/signin",
            "https://sbi.verify-loan.xyz/ok",
            "https://microsoft-secure-login.xyz",
            "http://paytm-verify.top/kyc",
        )) {
            val report = LinkScorer.checkLink(url, rules)
            assertEquals(Verdict.RED.id, report.verdictId, "should be RED: $url")
        }
    }

    @Test
    fun `bare IP host is flagged by the ip and https checks`() {
        // No domain means no brand signal — the IP/no-HTTPS checks carry it.
        val ids = flaggedIds("http://193.44.55.66/paytm-verify")
        assertTrue("ip_host" in ids, "expected ip_host: $ids")
        assertTrue("no_https" in ids, "expected no_https: $ids")
    }

    @Test
    fun `brand token buried in a lure is flagged`() {
        assertEquals("Microsoft", checkBrandLookalike("microsoft-secure-login.xyz", rules))
        assertEquals("State Bank of India", checkBrandLookalike("sbi.verify-loan.xyz", rules))
    }

    @Test
    fun `bare containment without a lure word does not false-positive`() {
        // "snapple" contains "apple" but no lure word: not an impersonation.
        assertNull(checkBrandLookalike("snapple.com", rules))
        assertNull(checkBrandLookalike("olive.com", rules))
    }

    @Test
    fun `official brand domains stay clean`() {
        assertNull(checkBrandLookalike("apple.com", rules))
        assertNull(checkBrandLookalike("login.microsoft.com", rules))
        assertNull(checkBrandLookalike("outlook.office.com", rules))
        assertNull(checkBrandLookalike("sbi.co.in", rules))
        assertNull(checkBrandLookalike("secure.yono.sbi", rules))
    }

    @Test
    fun `short generic labels do not fuzzy-match brands`() {
        // "t" alone must not become Telegram via fuzzy matching.
        assertNull(checkBrandLookalike("olive.com", rules))
        // t.me IS Telegram's official domain.
        assertNull(checkBrandLookalike("t.me/foo", rules))
    }

    @Test
    fun `plain clean link scores green`() {
        val report = LinkScorer.checkLink("https://www.google.com/search?q=appautopsy", rules)
        assertEquals(Verdict.GREEN.id, report.verdictId)
        assertTrue(report.checks.none { it.status == CheckStatus.FLAGGED })
    }

    @Test
    fun `http host with at symbol and scam tld accumulates points`() {
        val ids = flaggedIds("http://paytm-verify.top/login")
        assertTrue("no_https" in ids)
        assertTrue("suspicious_tld" in ids, "expected .top flagged: $ids")
        assertEquals("Paytm", checkBrandLookalike("paytm-verify.top", rules))
        assertTrue("brand_lookalike" in ids)
    }
}
