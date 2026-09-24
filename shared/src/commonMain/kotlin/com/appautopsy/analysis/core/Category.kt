package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.CategoryResult
import com.appautopsy.analysis.model.Confidence
import com.appautopsy.analysis.rules.Rules

/**
 * App category detection and confidence.
 *
 * Priority is strict and confidence is honest: a label match is materially more
 * trustworthy than a package-name match, and the calibration card depends on
 * that distinction being real rather than cosmetic.
 *
 * Complexity: O(T) token lookups plus O(K) multi-word substring checks, where T
 * is token count and K a small fixed keyword list. No fuzzy matching here; that
 * lives in the look-alike domain path where it is actually needed.
 */
object Category {

    private val TOKEN_SPLIT = Regex("[^a-z0-9]+")

    private fun tokenize(value: String): Set<String> =
        TOKEN_SPLIT.split(value.lowercase()).filter { it.isNotEmpty() }.toSet()

    private fun match(text: String, rules: Rules): String? {
        if (text.isEmpty()) return null

        val normalized = text.lowercase()

        // Longest-first, so a specific phrase beats a shorter one inside it.
        for ((keyword, categoryId) in rules.multiWordKeywords) {
            if (normalized.contains(keyword)) return categoryId
        }

        // Sorted so the result does not depend on set iteration order when
        // several categories match the same label.
        for (token in tokenize(normalized).sorted()) {
            rules.singleWordIndex[token]?.let { return it }
        }

        return null
    }

    /**
     * Resolve the category in strict priority order.
     *
     * A user selection always wins. Otherwise the label is tried before the
     * package name, because package identifiers are noisier than display names.
     */
    fun detect(
        label: String?,
        packageName: String?,
        userChoice: String?,
        rules: Rules,
    ): CategoryResult {
        if (!userChoice.isNullOrBlank()) {
            if (userChoice !in rules.categories) {
                throw IllegalArgumentException("unknown category id: $userChoice")
            }
            return CategoryResult(id = userChoice, confidence = Confidence.HIGH, method = "user")
        }

        match(label.orEmpty(), rules)?.let {
            return CategoryResult(id = it, confidence = Confidence.MEDIUM, method = "keyword")
        }

        match(packageName.orEmpty(), rules)?.let {
            return CategoryResult(id = it, confidence = Confidence.LOW, method = "keyword")
        }

        val unknown = rules.categories.getValue(rules.unknownCategoryId)
        return CategoryResult(
            id = unknown.id,
            confidence = Confidence.fromId(unknown.confidence),
            method = "unknown",
        )
    }

    fun expectedGroups(categoryId: String, rules: Rules): Set<String> =
        rules.categories[categoryId]?.expectedGroups ?: emptySet()

    /**
     * True for the `unknown` category, where no mismatch penalty applies.
     *
     * This is the honesty rule: if we could not tell what the app is, we must
     * not punish it for not matching what we could not identify.
     */
    fun mismatchPenaltyDisabled(categoryId: String, rules: Rules): Boolean {
        val category = rules.categories[categoryId] ?: return true
        return category.mismatchPenaltyDisabled || category.id == rules.unknownCategoryId
    }
}