package com.appautopsy.analysis

import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.core.Calibration
import com.appautopsy.analysis.core.Explain
import com.appautopsy.analysis.core.Playbook
import com.appautopsy.analysis.core.Prescription
import com.appautopsy.analysis.core.RiskEngine
import com.appautopsy.analysis.model.CategoryResult
import com.appautopsy.analysis.model.Confidence
import com.appautopsy.analysis.model.ImpersonationResult
import com.appautopsy.analysis.model.Lang
import com.appautopsy.analysis.model.ParsedApk
import com.appautopsy.analysis.model.PatternMatch
import com.appautopsy.analysis.model.RepackagingResult
import com.appautopsy.analysis.model.Verdict
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * The zero-point presentation layer: playbook (F15), calibration (F16),
 * prescription (F19), explanation builder. None of these may touch the score,
 * and the tests assert that as much as the content.
 */
class PresentationTest {

    private val rules = TestData.rules
    private val catalogs = TestData.catalogs
    private val playbooks = TestData.playbookDefinitions

    private fun pattern(id: String, critical: Boolean = false) =
        PatternMatch(id = id, bonus = 0, critical = critical, reasonKey = "pattern.$id")

    // ---- F15 playbook -------------------------------------------------------

    @Test
    fun `red playbook prefers the most specific matched pattern`() {
        assertEquals(
            "red.otp_stealer",
            Playbook.keyFor(Verdict.RED, listOf(pattern("otp_stealer"), pattern("banking_trojan")), false),
            "otp_stealer outranks banking_trojan",
        )
        assertEquals(
            "red.banking_trojan",
            Playbook.keyFor(Verdict.RED, listOf(pattern("banking_trojan")), false),
        )
        assertEquals(
            "red.repackaged_signer",
            Playbook.keyFor(Verdict.RED, emptyList(), repackagingDetected = true),
        )
        assertEquals("red.default", Playbook.keyFor(Verdict.RED, emptyList(), false))
        assertEquals("yellow.default", Playbook.keyFor(Verdict.YELLOW, listOf(pattern("otp_stealer")), false))
        assertEquals("green.default", Playbook.keyFor(Verdict.GREEN, emptyList(), false))
    }

    @Test
    fun `steps carry the app label where the definition asks for it`() {
        val steps = Playbook.steps(
            definitions = playbooks,
            verdict = Verdict.RED,
            patterns = listOf(pattern("otp_stealer")),
            appLabel = "Super Flashlight (DEMO)",
            repackagingDetected = false,
        )

        assertTrue(steps.isNotEmpty())
        // The shipped otp_stealer playbook: do-not-install, remove, otp-shared, report.
        assertEquals(
            listOf(
                "playbook.red.do_not_install",
                "playbook.red.remove",
                "playbook.red.otp_shared",
                "playbook.red.report",
            ),
            steps.map { it.stepKey },
        )

        val remove = steps.first { it.stepKey == "playbook.red.remove" }
        assertEquals("Super Flashlight (DEMO)", remove.params["app"])
        assertTrue(
            steps.first { it.stepKey == "playbook.red.do_not_install" }.params.isEmpty(),
            "steps that declare no params get none",
        )
    }

    @Test
    fun `a blank app label falls back to the literal this app`() {
        val steps = Playbook.steps(playbooks, Verdict.RED, listOf(pattern("otp_stealer")), appLabel = "  ", false)
        assertEquals("this app", steps.first { it.stepKey == "playbook.red.remove" }.params["app"])
    }

    // ---- F16 calibration ----------------------------------------------------

    private val flashlight = CategoryResult(id = "flashlight", confidence = Confidence.MEDIUM, method = "keyword")

    @Test
    fun `unknown category reports itself honestly and the allowlist caveat is unconditional`() {
        val apk = ParsedApk(label = "X", hasLauncherActivity = true)
        val unknown = CategoryResult(id = "unknown", confidence = Confidence.LOW, method = "unknown")

        val notes = Calibration.notes(apk, unknown, notCheckedChecks = emptyList())

        assertEquals(
            listOf("calibration.unknown_category", "calibration.allowlist_caveat"),
            notes.map { it.reasonKey },
        )
    }

    @Test
    fun `low confidence and missing launcher and unchecked checks each add their note`() {
        val noLauncher = ParsedApk(label = "X", hasLauncherActivity = false)
        val lowConf = CategoryResult(id = "flashlight", confidence = Confidence.LOW, method = "keyword")

        val notes = Calibration.notes(noLauncher, lowConf, notCheckedChecks = listOf("reputation"))

        assertEquals(
            listOf(
                "calibration.low_confidence",
                "calibration.no_launcher",
                "calibration.not_checked_checks",
                "calibration.allowlist_caveat",
            ),
            notes.map { it.reasonKey },
        )
        assertEquals("reputation", notes[2].params["checks"])
    }

    // ---- F19 prescription -----------------------------------------------------

    @Test
    fun `prescription is the sorted expected groups of the category`() {
        assertEquals(
            listOf("camera"),
            Prescription.minimum("flashlight", rules).minimalGroups,
        )
        assertEquals(
            listOf("camera", "contacts", "microphone"),
            Prescription.minimum("video_calling", rules).minimalGroups,
        )
        assertTrue(Prescription.minimum("unknown", rules).minimalGroups.isEmpty())
    }

    // ---- explanation builder ----------------------------------------------------

    @Test
    fun `explanations put identity findings first and end with the disclaimer`() {
        val en = catalogs.getValue(Lang.EN)
        val score = RiskEngine.score(
            apk = ParsedApk(
                label = "Super Flashlight (DEMO)",
                packageName = "com.example.flash",
                permissions = rules.permToGroup
                    .filterValues { it == "sms" }
                    .keys.toList(),
            ),
            category = flashlight,
            rules = rules,
            impersonationDetected = false,
            repackagingDetected = true,
        )

        val repackaging = RepackagingResult(
            detected = true,
            signal = "signer_mismatch",
            detailKey = "repackaging.signer_mismatch",
        )

        val out = Explain.build(
            score = score,
            categoryId = "flashlight",
            impersonation = null,
            repackaging = repackaging,
            catalog = en,
        )

        assertEquals(
            en.text("repackaging.signer_mismatch"),
            out.reasons.first(),
            "is this even the app it claims to be comes before everything",
        )
        assertTrue(out.reasons.any { it.contains(en.text("perm.sms"), ignoreCase = true) })
        assertEquals(en.text("disclaimer"), out.limitations)
        assertTrue(out.summary.isNotBlank())
        assertTrue(out.recommendation.isNotBlank())
    }

    @Test
    fun `impersonation text joins the reasons when detected`() {
        val en = catalogs.getValue(Lang.EN)
        val score = RiskEngine.score(
            ParsedApk(label = "x", permissions = emptyList()), flashlight, rules,
            impersonationDetected = true,
        )

        val out = Explain.build(
            score, "flashlight",
            ImpersonationResult("SampleBank", "impersonation.detected"),
            null, en,
        )

        assertTrue(en.text("impersonation.detected") in out.reasons)
    }
}
