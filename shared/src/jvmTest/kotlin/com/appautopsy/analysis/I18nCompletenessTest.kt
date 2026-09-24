package com.appautopsy.analysis

import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.catalog.messageKeys
import com.appautopsy.analysis.model.Lang
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * i18n completeness, mirroring backend/tests/test_i18n_completeness.py.
 *
 * Every reason key the engine can emit must exist in EN, HI and PA. The key
 * set is *derived from the shipped rules* rather than from the frozen
 * reason_keys.json file, so this test catches a new key the freeze tool has
 * not been re-run for — the Python check can only catch keys that were frozen
 * first. Both runtimes share one contract; this is the stricter half of it.
 */
class I18nCompletenessTest {

    private val rules = TestData.rules
    private val catalogs = TestData.catalogs

    /** Every key the scoring/report pipeline can produce, per the JSON rules. */
    private fun emittableKeys(): Set<String> {
        val keys = mutableSetOf<String>()

        for (band in rules.bands) {
            keys += band.labelKey
            keys += "recommendation.${band.recommendation}"
        }
        keys += rules.groupLabelKeys.values
        keys += setOf(
            "perm.expected",
            "perm.unexpected",
            "perm.info",
            "rule.many_sensitive",
            "rule.mismatch",
            "impersonation.detected",
        )
        keys += rules.patterns.map { it.reasonKey }
        keys += rules.categories.keys.map { "category.$it" }
        keys += setOf("summary.green", "summary.yellow", "summary.red", "disclaimer")
        keys += setOf(
            "repackaging.signer_mismatch",
            "repackaging.package_collision",
            "repackaging.title",
            "update.title",
            "update.added",
            "update.removed",
            "update.cert_changed",
            "update.none",
            "intel.title",
            "intel.body",
            "intel.insufficient",
            "prescription.title",
            "prescription.body",
            "calibration.title",
            "calibration.unknown_category",
            "calibration.low_confidence",
            "calibration.no_launcher",
            "calibration.not_checked_checks",
            "calibration.allowlist_caveat",
            "status.not_checked",
            "status.insufficient_data",
        )
        return keys
    }

    @Test
    fun `every emittable reason key exists in all three languages`() {
        val required = emittableKeys()

        for (lang in Lang.entries) {
            val catalog = catalogs.getValue(lang)
            val missing = required.filter { catalog.get(it) == null }
            assertTrue(
                missing.isEmpty(),
                "language '${lang.code}' is missing keys: $missing",
            )
        }
    }

    @Test
    fun `playbook step keys resolve in all three languages`() {
        val stepKeys = TestData.playbookDefinitions.values
            .flatten()
            .map { it.stepKey }
            .distinct()

        assertTrue(stepKeys.isNotEmpty(), "playbook definitions must not be empty")

        for (lang in Lang.entries) {
            val catalog = catalogs.getValue(lang)
            val missing = stepKeys.filter { catalog.get(it) == null }
            assertTrue(
                missing.isEmpty(),
                "language '${lang.code}' is missing playbook strings: $missing",
            )
        }
    }

    /**
     * The three catalogs must define exactly the same message keys. A key that
     * exists only in Hindi is as broken as one missing from English: two of
     * three users see a raw key.
     */
    @Test
    fun `all languages define the same key set`() {
        val en = catalogs.getValue(Lang.EN).messageKeys()

        for (lang in listOf(Lang.HI, Lang.PA)) {
            val other = catalogs.getValue(lang).messageKeys()
            assertEquals(en, other, "language '${lang.code}' key set differs from EN")
        }
    }

    @Test
    fun `missing key falls back to english then to the raw key, never crashes`() {
        val english = Catalog(Lang.EN, messages = mapOf("only.en" to "English text"), playbookStrings = emptyMap())
        val hindi = Catalog(
            Lang.HI,
            messages = mapOf("common" to "hindi text"),
            playbookStrings = emptyMap(),
            fallback = english,
        )

        // A key that exists only in EN must render EN rather than leak a blank.
        assertEquals("English text", hindi.text("only.en"))
        assertEquals("hindi text", hindi.text("common"))

        // A key nobody defines renders as itself: visible, greppable, no crash.
        assertEquals("nonexistent.key", hindi.text("nonexistent.key"))
    }

    @Test
    fun `params interpolate placeholders`() {
        val en = catalogs.getValue(Lang.EN)
        val template = en.get("summary.red")!!

        val rendered = en.text("summary.red", mapOf("category" to "flashlight app"))

        assertTrue("{category}" !in rendered, "placeholder must be substituted")
        assertTrue("flashlight app" in rendered, "the parameter value must appear")
        assertTrue(template.contains("{category}"), "template sanity: must carry the placeholder")
    }

    @Test
    fun `playbook prefix routes to playbook strings not messages`() {
        val en = catalogs.getValue(Lang.EN)
        val key = "playbook.red.do_not_install"

        assertTrue(en.messages[key] == null, "playbook strings must not live in messages")
        assertTrue(en.playbookStrings.containsKey(key), "and must live in the playbook map")
        assertTrue(en.text(key).isNotEmpty())
    }
}
