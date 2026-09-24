package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.CategoryResult
import com.appautopsy.analysis.model.Confidence
import com.appautopsy.analysis.model.NoteItem
import com.appautopsy.analysis.model.ParsedApk

/**
 * Calibration card (F16): the reasons this verdict might be wrong.
 *
 * Calibrated honesty is rare in security tools and this is where it is
 * enforced. Every note is a genuine limitation of the analysis, derived from
 * what actually happened during the scan — never boilerplate hedging.
 *
 * Contributes 0 points and never changes the verdict.
 */
object Calibration {

    /**
     * @param notCheckedChecks names of checks that did not run, e.g.
     *   `reputation`. Naming them is required: a check that silently vanished
     *   looks identical to a check that passed, and that is a lie by omission.
     */
    fun notes(
        apk: ParsedApk,
        category: CategoryResult,
        notCheckedChecks: List<String> = emptyList(),
    ): List<NoteItem> {
        val notes = mutableListOf<NoteItem>()

        if (category.id == "unknown") {
            notes += NoteItem(reasonKey = "calibration.unknown_category")
        } else if (category.confidence == Confidence.LOW) {
            notes += NoteItem(reasonKey = "calibration.low_confidence")
        }

        if (!apk.hasLauncherActivity) {
            notes += NoteItem(reasonKey = "calibration.no_launcher")
        }

        if (notCheckedChecks.isNotEmpty()) {
            notes += NoteItem(
                reasonKey = "calibration.not_checked_checks",
                params = mapOf("checks" to notCheckedChecks.joinToString(", ")),
            )
        }

        // Always: an expected-permission allowlist is a judgement call, and
        // saying so is cheaper than being caught not saying it.
        notes += NoteItem(reasonKey = "calibration.allowlist_caveat")

        return notes
    }
}
