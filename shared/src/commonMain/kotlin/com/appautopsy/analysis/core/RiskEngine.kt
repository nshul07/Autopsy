package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.Band
import com.appautopsy.analysis.model.BreakdownItem
import com.appautopsy.analysis.model.CategoryResult
import com.appautopsy.analysis.model.ParsedApk
import com.appautopsy.analysis.model.ScoreResult
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.analysis.rules.Rules

/**
 * Scoring: the heart of the system.
 *
 * Pure functions only. No I/O, no network, no clock, no globals. Data in, data
 * out. That is what makes the test vectors trivial to assert and makes a rule
 * change safe.
 *
 * The engine never sees the APK. It receives an already-extracted group set, so
 * its cost is independent of file size and the same input always yields the
 * same score.
 */
object RiskEngine {

    /**
     * Score an APK against its declared category.
     *
     * Order of operations is fixed: group points first, then the two penalties,
     * then pattern bonuses, then impersonation, then the cap and band, with the
     * critical override applied last.
     *
     * Time O(G + K), space O(G), where G is the group set (about 15 max) and K
     * the pattern count. Constant with respect to APK size.
     */
    fun score(
        apk: ParsedApk,
        category: CategoryResult,
        rules: Rules,
        impersonationDetected: Boolean = false,
        repackagingDetected: Boolean = false,
    ): ScoreResult {
        val expected = Category.expectedGroups(category.id, rules)
        val groups = Permissions.presentGroups(
            apk.permissions, apk.services, apk.receivers, rules,
        )

        val breakdown = mutableListOf<BreakdownItem>()
        var score = 0

        for (group in groups.sorted()) {
            val points = rules.groupPoints[group] ?: 0
            val isExpected = group in expected

            if (points == 0 && !isExpected) {
                // Zero-point groups (boot) only exist to feed patterns. They are
                // still reported so the reader can see the app declares them.
                breakdown += BreakdownItem(
                    rule = "group:$group",
                    points = 0,
                    reasonKey = "perm.info",
                    status = "info",
                    params = mapOf("group" to group),
                )
                continue
            }

            val awarded = if (isExpected) 0 else points
            score += awarded

            breakdown += BreakdownItem(
                rule = "group:$group",
                points = awarded,
                reasonKey = if (isExpected) "perm.expected" else "perm.unexpected",
                status = if (isExpected) "expected" else "unexpected",
                params = mapOf("group" to group, "category" to category.id),
            )
        }

        val unexpected = groups.filter { it !in expected }.toSet()

        if (unexpected.size > rules.manySensitiveThreshold) {
            score += rules.manySensitivePoints
            breakdown += BreakdownItem(
                rule = "many_sensitive",
                points = rules.manySensitivePoints,
                reasonKey = "rule.many_sensitive",
                status = "unexpected",
                params = mapOf("count" to unexpected.size.toString()),
            )
        }

        // The mismatch penalty fires once, however many unexpected groups exist.
        if (unexpected.isNotEmpty() && !Category.mismatchPenaltyDisabled(category.id, rules)) {
            score += rules.mismatchPoints
            breakdown += BreakdownItem(
                rule = "mismatch",
                points = rules.mismatchPoints,
                reasonKey = "rule.mismatch",
                status = "unexpected",
                params = mapOf("category" to category.id),
            )
        }

        val matched = Patterns.matched(groups, category.id, apk.hasLauncherActivity, rules)
        for (match in matched) {
            score += match.bonus
            breakdown += BreakdownItem(
                rule = "pattern:${match.id}",
                points = match.bonus,
                reasonKey = match.reasonKey,
                status = if (match.critical) "critical" else "unexpected",
                params = emptyMap(),
            )
        }

        if (impersonationDetected) {
            score += rules.impersonationPoints
            breakdown += BreakdownItem(
                rule = "impersonation",
                points = rules.impersonationPoints,
                reasonKey = "impersonation.detected",
                status = "critical",
                params = emptyMap(),
            )
        }

        score = minOf(score, rules.maxScore)
        val band = bandFor(score, rules)

        val critical = Patterns.hasCritical(matched) ||
            impersonationDetected ||
            repackagingDetected

        // A critical finding forces red regardless of the numeric score. An app
        // that acts like a banking trojan is not "mostly fine" at 60 points.
        var verdict = Verdict.fromId(band.verdict)
        var recommendation = band.recommendation
        if (critical && verdict != Verdict.RED) {
            verdict = Verdict.RED
            recommendation = "do_not_install"
        }

        return ScoreResult(
            score = score,
            band = Band.fromId(band.id),
            verdict = verdict,
            recommendation = recommendation,
            criticalOverride = critical,
            breakdown = breakdown,
            permissions = Permissions.permissionItems(apk.permissions, expected, rules),
            patterns = matched,
            presentGroups = groups,
            unexpectedGroups = unexpected,
        )
    }

    /**
     * The band a score falls into.
     *
     * Time O(B) over a fixed three bands. A gap in the ranges falls back to the
     * top band, which fails safe: an impossible score is treated as dangerous
     * rather than as safe.
     */
    fun bandFor(score: Int, rules: Rules): com.appautopsy.analysis.rules.BandDef =
        rules.bands.firstOrNull { it.contains(score) } ?: rules.bands.last()
}