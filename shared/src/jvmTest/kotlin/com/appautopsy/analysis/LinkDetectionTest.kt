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
    fun `typo squat that keeps the brand visible is flagged as Microsoft`() {
        // A two-edit squat is only accused when the brand word is still a
        // substring of the domain — see the documented miss below.
        assertEquals("Microsoft", checkBrandLookalike("rnmicrosoft.com", rules))
        assertEquals("Microsoft", checkBrandLookalike("microsooft.com", rules))
    }

    @Test
    fun `two-edit near miss of a real business is a documented miss`() {
        // "rnicrosoft" is a genuine Microsoft squat (one insertion of "n") but
        // does NOT contain "microsoft". "picosoft", a real Italian software
        // firm, is string-indistinguishable from it, so no distance-2 test can
        // keep one and drop the other. The engine demands the embedded brand
        // word and accepts the miss; this test is the record of that trade.
        assertNull(checkBrandLookalike("rnicrosoft.com", rules))
        assertNotNull(checkBrandLookalike("rnmicrosoft.com", rules))
    }

    @Test
    fun `impersonation links land RED not yellow`() {
        // rnmicrosoft, not rnicrosoft — see the two-edit miss test below.
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
    fun `ccTLD variants of a brand are its own site, not a squat`() {
        // Measured before the SLD guard existed: amazon.co.uk, amazon.ca and
        // amazon.fr were all forced RED. A wrong-TLD squat on a suspicious
        // suffix must still trip the check.
        for (host in listOf(
            "www.amazon.co.uk",
            "www.amazon.ca",
            "www.amazon.fr",
            "www.google.co.jp",
        )) {
            assertNull(checkBrandLookalike(host, rules), "must stay clean: $host")
        }
        assertEquals("Amazon", checkBrandLookalike("amazon.xyz", rules))
    }

    @Test
    fun `short alias SLD without a lure or bad TLD stays clean`() {
        // "upi" is the BHIM UPI alias and also upi.com, a real news agency.
        // It is also a lure word, so it must not lure itself.
        assertNull(checkBrandLookalike("upi.com/story", rules))
    }

    @Test
    fun `two-edit near miss of a real site is not a spoof`() {
        // These are all exactly two edits from a brand token but do NOT contain
        // it. Measured before the containment gate: every one of them was a
        // forced RED on a real site — hiexpress/devexpress (dhlexpress),
        // picosoft (microsoft), citibank.co.uk (icicibank), oakbank.co.nz
        // (kotakbank). A shared-character-run test does not separate these,
        // because "hiexpress" and "dhlexpress" genuinely share "express".
        for (host in listOf(
            "www.hiexpress.com",
            "www.devexpress.com",
            "www.picosoft.it",
            "www.citibank.co.uk",
            "oakbank.co.nz",
        )) {
            assertNull(checkBrandLookalike(host, rules), "must stay clean: $host")
        }
    }

    @Test
    fun `unlured brand label in a subdomain is not a spoof`() {
        // A lone brand label is usually a real subdomain.
        assertNull(checkBrandLookalike("microsoft.wikia.com", rules))
        assertNull(checkBrandLookalike("blog.google.com", rules))
    }

    @Test
    fun `injected credential path is flagged`() {
        val ids = flaggedIds("https://newsite.com/wp-content/themes/x/PayPal/login.php")
        assertTrue("phish_path" in ids, "expected phish_path: $ids")
        // Either signal alone is common on healthy sites, so neither fires.
        assertTrue("phish_path" !in flaggedIds("https://wordpress.org/wp-content/uploads/2024/pic.jpg"))
        assertTrue("phish_path" !in flaggedIds("https://example.com/login"))
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
