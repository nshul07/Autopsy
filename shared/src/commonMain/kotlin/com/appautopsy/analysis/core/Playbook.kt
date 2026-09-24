package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.PatternMatch
import com.appautopsy.analysis.model.PlaybookStep
import com.appautopsy.analysis.model.Verdict
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Action playbook (F15): ordered, actionable steps for the verdict.
 *
 * A verdict doesn't change behaviour; an instruction does. Keyed by band and by
 * which patterns matched — `red` picks the most specific playbook available.
 *
 * Contributes 0 points and never alters the verdict. Purely presentational.
 *
 * Steps arrive as `step_key` plus params; the text itself is resolved by the
 * Catalog at render time, so changing language changes the playbook for free.
 * The playbook definitions live in the English file only — the step *keys* are
 * language-neutral, and each language ships its own `strings` block.
 */
object Playbook {

    /** Which playbook list to use, given the verdict and what fired. */
    fun keyFor(
        verdict: Verdict,
        patterns: List<PatternMatch>,
        repackagingDetected: Boolean,
    ): String {
        if (verdict != Verdict.RED) return "${verdict.id}.default"

        val ids = patterns.map { it.id }.toSet()
        return when {
            "otp_stealer" in ids -> "red.otp_stealer"
            "banking_trojan" in ids -> "red.banking_trojan"
            repackagingDetected || "repackaged_signer" in ids -> "red.repackaged_signer"
            else -> "red.default"
        }
    }

    /**
     * Builds the steps for a result. Falls back to `red.default` when a key has
     * no list, because an empty playbook for a dangerous app is worse than a
     * generic one.
     */
    fun steps(
        definitions: Map<String, List<StepDef>>,
        verdict: Verdict,
        patterns: List<PatternMatch>,
        appLabel: String?,
        repackagingDetected: Boolean,
    ): List<PlaybookStep> {
        val key = keyFor(verdict, patterns, repackagingDetected)
        val raw = definitions[key] ?: definitions["red.default"] ?: return emptyList()
        val label = appLabel?.takeIf { it.isNotBlank() } ?: "this app"

        return raw.map { def ->
            val params = if ("app" in def.params) mapOf("app" to label) else emptyMap()
            PlaybookStep(stepKey = def.stepKey, params = params)
        }
    }

    data class StepDef(val stepKey: String, val params: List<String>)

    /**
     * Parses the `playbooks` block of playbook_en.json. Loaded once at startup
     * alongside the Catalog; a scan never re-reads it.
     */
    fun loadDefinitions(text: String): Map<String, List<StepDef>> {
        val json = Json { ignoreUnknownKeys = true }
        val playbooks = json.parseToJsonElement(text).jsonObject["playbooks"]!!.jsonObject

        return playbooks.mapValues { (_, stepsElement) ->
            stepsElement.jsonArray.map { stepElement ->
                val step = stepElement.jsonObject
                StepDef(
                    stepKey = step["step_key"]!!.jsonPrimitive.content,
                    params = step["params"]?.jsonArray
                        ?.map { it.jsonPrimitive.content }
                        ?: emptyList(),
                )
            }
        }
    }
}
