package com.appautopsy.analysis

import com.appautopsy.analysis.core.RiskEngine
import com.appautopsy.analysis.model.CategoryResult
import com.appautopsy.analysis.model.ComponentInfo
import com.appautopsy.analysis.model.Confidence
import com.appautopsy.analysis.model.ParsedApk
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.analysis.rules.Rules
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * The six verified scoring vectors from the build spec, asserted exactly.
 *
 * These are the contract for the whole system: if a rule edit changes any of
 * these numbers, scoring changed and the change must be deliberate.
 *
 * Vectors are built from the rules themselves (see [groups], which reverses the
 * permission->group map) rather than from hard-coded permission strings, so
 * renaming a permission in JSON cannot leave a test silently passing on nothing.
 */
class RiskEngineVectorsTest {

    private val rules = TestData.rules

    /** The permissions that produce exactly this set of groups. */
    private fun groups(vararg groupIds: String): List<String> {
        val wanted = groupIds.toSet()
        return rules.permToGroup
            .filterValues { it in wanted }
            .keys
            .sorted()
    }

    /** Component-declared groups, which never appear as uses-permission. */
    private fun componentApk(vararg groupIds: String): ParsedApk {
        val wanted = groupIds.toSet()
        val needed = wanted - rules.permToGroup.values.toSet()

        val services = needed.mapNotNull { group ->
            rules.componentPermissionSignals.entries
                .firstOrNull { it.value == group }
                ?.let { ComponentInfo(name = "Stub", permission = it.key) }
        }
        val receivers = needed
            .filter { "device_admin" == it }
            .map { ComponentInfo(name = "AdminReceiver", permission = "android.permission.BIND_DEVICE_ADMIN") }

        val declared = groups(*wanted.toTypedArray())
        return ParsedApk(
            label = "Vector (DEMO)",
            packageName = "com.example.vector",
            permissions = declared,
            services = services,
            receivers = receivers,
        )
    }

    private fun category(id: String) =
        CategoryResult(id = id, confidence = Confidence.MEDIUM, method = "keyword")

    private fun scoreFor(apk: ParsedApk, categoryId: String) =
        RiskEngine.score(apk, category(categoryId), rules)

    /**
     * Vector A: flashlight app asking for sms, contacts, location, accessibility.
     * 20 + 15 + 8 + 25 = 68, plus the 20 mismatch penalty = 88.
     */
    @Test
    fun `vector A - flashlight with four unexpected groups scores 88`() {
        val result = scoreFor(
            componentApk("sms", "contacts", "location", "accessibility"),
            "flashlight",
        )

        assertEquals(88, result.score, "score for vector A")
        assertEquals(Verdict.RED, result.verdict, "88 must land in the red band")
        assertTrue(result.unexpectedGroups.containsAll(
            setOf("sms", "contacts", "location", "accessibility")
        ))
    }

    /** Vector B: a flashlight app using the camera is exactly what it is for. */
    @Test
    fun `vector B - flashlight with camera only scores 0`() {
        val result = scoreFor(componentApk("camera"), "flashlight")

        assertEquals(0, result.score, "camera is expected, so it carries no points")
        assertEquals(Verdict.GREEN, result.verdict)
        assertTrue(result.unexpectedGroups.isEmpty())
    }

    /** Vector C: navigation apps legitimately need location. */
    @Test
    fun `vector C - navigation with location scores 0`() {
        val result = scoreFor(componentApk("location"), "navigation")

        assertEquals(0, result.score)
        assertEquals(Verdict.GREEN, result.verdict)
    }

    /**
     * Vector D: an unidentifiable app gets no mismatch penalty and a
     * low-confidence badge. This is the honesty rule made testable: we must not
     * punish an app for not matching a category we failed to determine.
     */
    @Test
    fun `vector D - unknown category with sms scores 20 and no mismatch penalty`() {
        val result = scoreFor(componentApk("sms"), "unknown")

        assertEquals(20, result.score, "sms points only, no mismatch penalty")
        assertTrue(
            result.breakdown.none { it.rule == "mismatch" },
            "the unknown category must not apply a mismatch penalty",
        )
    }

    /**
     * Vector E: flashlight asking for five unexpected groups.
     *
     * The spec prints this as `20+15+8+10+20 (+20 mismatch) = 93`, which does not
     * add up: 20+15+8+10+20 is 73, and 73+20 is 93. The arithmetic in the prose
     * is wrong; the expected total of 93 is correct and is what is asserted
     * here, because that is the number the demo and the spec table agree on.
     * (Contrast vector A, where the same shape of sum is written correctly.)
     */
    @Test
    fun `vector E - flashlight with five unexpected groups scores 93`() {
        val result = scoreFor(
            componentApk("sms", "contacts", "location", "microphone", "overlay"),
            "flashlight",
        )

        assertEquals(93, result.score, "group total 73 plus the 20 mismatch penalty")
        assertEquals(Verdict.RED, result.verdict)
    }

    /**
     * Vector F: the banking-trojan signature.
     *
     * Permissions alone give 20 + 20 + 25 = 65, plus the 20 mismatch penalty is
     * 85. Two patterns fire: otp_stealer (+15) and banking_trojan (+25), taking
     * the raw total to 125, which the cap reduces to 100. banking_trojan is
     * critical, so the verdict is red by override.
     */
    @Test
    fun `vector F - flashlight with sms, overlay, accessibility caps at 100 and forces red`() {
        val result = scoreFor(
            componentApk("sms", "overlay", "accessibility"),
            "flashlight",
        )

        assertEquals(100, result.score, "125 raw is capped at 100")
        assertEquals(Verdict.RED, result.verdict)
        assertTrue(result.criticalOverride, "a critical pattern must force the override")

        val matchedIds = result.patterns.map { it.id }.toSet()
        assertEquals(setOf("otp_stealer", "banking_trojan"), matchedIds)
        assertEquals(15 + 25, result.patterns.sumOf { it.bonus })
    }
}