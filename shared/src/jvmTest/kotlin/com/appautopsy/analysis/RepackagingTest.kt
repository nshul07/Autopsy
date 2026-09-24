package com.appautopsy.analysis

import com.appautopsy.analysis.core.Impersonation
import com.appautopsy.analysis.core.Repackaging
import com.appautopsy.analysis.core.SignerHistory
import com.appautopsy.analysis.rules.BrandDef
import com.appautopsy.analysis.rules.Rules
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Repackaging / signer-mismatch (F12) — the wedge, and the impersonation rule
 * it shares brand data with. Ported 1:1 from backend/tests/test_repackaging.py
 * so both runtimes are held to the same contract.
 */
class RepackagingTest {

    private val base = TestData.rules

    /** Rules that carry one brand with a known official cert. */
    private fun rulesWithBrand(
        officialCerts: Set<String>,
        officialPackages: Set<String> = setOf("com.samplebank.app"),
    ): Rules =
        base.copy(
            brands = listOf(
                BrandDef(
                    name = "SampleBank",
                    aliases = listOf("samplebank"),
                    officialDomains = setOf("samplebank.com"),
                    officialPackages = officialPackages,
                    officialCertSha256 = officialCerts,
                ),
            ),
            brandAliasIndex = mapOf("samplebank" to "SampleBank"),
        )

    @Test
    fun `signer mismatch fires when official package carries an unknown cert`() {
        val rules = rulesWithBrand(officialCerts = setOf("1122334455667788"))

        val result = Repackaging.detect(
            label = "SampleBank Mobile",
            packageName = "com.samplebank.app",
            signingCerts = listOf("deadbeefdeadbeef"),
            priorCertSha256 = null,
            rules = rules,
        )

        assertNotNull(result)
        assertTrue(result.detected)
        assertEquals("signer_mismatch", result.signal)
        assertEquals("1122334455667788", result.expectedCertSha256)
        assertEquals("deadbeefdeadbeef", result.actualCertSha256)
    }

    @Test
    fun `no mismatch when the official cert is the one that signed it`() {
        val rules = rulesWithBrand(officialCerts = setOf("1122334455667788"))

        val result = Repackaging.detect(
            label = "SampleBank Mobile",
            packageName = "com.samplebank.app",
            signingCerts = listOf("1122334455667788"),
            priorCertSha256 = null,
            rules = rules,
        )

        assertNull(result, "a matching official cert is the app it claims to be")
    }

    /**
     * The honesty rule: with no official cert on file we cannot say anything,
     * so we say nothing. A fabricated fingerprint would flag every legitimate
     * SampleBank app as malware — worse than no check at all.
     */
    @Test
    fun `empty official certs means no signer check, never a false alarm`() {
        val rules = rulesWithBrand(officialCerts = emptySet())

        val result = Repackaging.detect(
            label = "SampleBank Mobile",
            packageName = "com.samplebank.app",
            signingCerts = listOf("whatever"),
            priorCertSha256 = null,
            rules = rules,
        )

        assertNull(result, "no official cert on file must not invent a mismatch")
    }

    @Test
    fun `signer changed from history is detected without any brand data`() {
        val result = Repackaging.detect(
            label = "Clean App",
            packageName = "com.example.clean",
            signingCerts = listOf("cert_new_2222"),
            priorCertSha256 = "cert_old_1111",
            rules = base,
        )

        assertNotNull(result)
        assertEquals("signer_changed", result.signal)
    }

    @Test
    fun `package collision fires when a brand package wears a foreign label`() {
        // Alias chosen so it cannot hide inside the package name — otherwise
        // substring matching finds it there and correctly reports no collision.
        val rules = base.copy(
            brands = listOf(
                BrandDef(
                    name = "SampleBank",
                    aliases = listOf("pay with us"),
                    officialDomains = setOf("samplebank.com"),
                    officialPackages = setOf("com.samplebank.app"),
                    officialCertSha256 = emptySet(),
                ),
            ),
            brandAliasIndex = mapOf("pay with us" to "SampleBank"),
        )

        // Package is the brand's, but neither label nor package says so.
        val result = Repackaging.detect(
            label = "Totally Unrelated",
            packageName = "com.samplebank.app",
            signingCerts = listOf("deadbeef"),
            priorCertSha256 = null,
            rules = rules,
        )

        assertNotNull(result)
        assertEquals("package_collision", result.signal)
        assertEquals("repackaging.package_collision", result.detailKey)
    }

    @Test
    fun `signer history comparison is order and case insensitive`() {
        assertTrue(
            SignerHistory.hasSignerChanged(
                "AABBCC",
                listOf("aabbcc"),
            ).not(),
            "same cert in different case has not changed",
        )
        assertFalse(
            SignerHistory.hasSignerChanged(null, listOf("anything")),
            "no prior means no comparison",
        )
        assertFalse(
            SignerHistory.hasSignerChanged("prior", emptyList()),
            "no current means no comparison",
        )
    }

    @Test
    fun `impersonation fires for a brand name on a non-official package`() {
        val rules = rulesWithBrand(officialCerts = emptySet())

        val result = Impersonation.detect(
            label = "SampleBank Reward APK",
            packageName = "com.thief.fake",
            rules = rules,
        )

        assertNotNull(result)
        assertEquals("SampleBank", result.brand)
        assertEquals("impersonation.detected", result.reasonKey)
    }

    @Test
    fun `impersonation does not fire for the real official package`() {
        val rules = rulesWithBrand(officialCerts = emptySet())

        val result = Impersonation.detect(
            label = "SampleBank Mobile",
            packageName = "com.samplebank.app",
            rules = rules,
        )

        assertNull(result)
    }
}
