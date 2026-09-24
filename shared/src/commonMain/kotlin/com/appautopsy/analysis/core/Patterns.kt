package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.PatternMatch
import com.appautopsy.analysis.rules.PatternDef
import com.appautopsy.analysis.rules.Rules

/**
 * Scam-pattern matching.
 *
 * Operates purely on the already-extracted group set, so it never touches APK
 * bytes and costs nothing that scales with archive size.
 *
 * Complexity: O(K) set containment tests, K a small fixed constant.
 */
object Patterns {

    /**
     * Every pattern whose conditions hold.
     *
     * Patterns flagged with `evaluatedBy` are decided by another module (the
     * repackaging check) and are skipped here so exactly one implementation of
     * each rule exists. Two implementations would drift and produce different
     * scores for the same file, which breaks the determinism this project
     * claims.
     */
    fun matched(
        presentGroups: Set<String>,
        categoryId: String,
        hasLauncherActivity: Boolean,
        rules: Rules,
    ): List<PatternMatch> {
        val matches = mutableListOf<PatternMatch>()

        for (pattern in rules.patterns) {
            if (pattern.evaluatedBy != null) continue
            if (categoryId in pattern.excludedCategories) continue
            if (!pattern.matchesGroups(presentGroups)) continue

            matches += toMatch(pattern, hasLauncherActivity)
        }

        return matches
    }

    /**
     * A pattern can be conditionally critical: spyware_profile is only a
     * red-flag override when the app also has no normal way to be launched,
     * which is what distinguishes a hidden payload from a legitimate app.
     */
    private fun toMatch(pattern: PatternDef, hasLauncherActivity: Boolean): PatternMatch {
        val critical = pattern.critical ||
            (pattern.criticalIfNoLauncher && !hasLauncherActivity)

        return PatternMatch(
            id = pattern.id,
            bonus = pattern.bonus,
            critical = critical,
            reasonKey = pattern.reasonKey,
        )
    }

    fun hasCritical(matches: List<PatternMatch>): Boolean = matches.any { it.critical }
}