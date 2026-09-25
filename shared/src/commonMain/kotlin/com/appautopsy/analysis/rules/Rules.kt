package com.appautopsy.analysis.rules

/**
 * The compiled rules, ready for the hot path.
 *
 * Every lookup the analysis performs is a flat map or set built once here.
 * Nothing in this file reads a file or allocates per call, so a scan costs the
 * same whether it is the first of the session or the thousandth.
 */
data class Rules(
    val bands: List<BandDef>,
    val manySensitiveThreshold: Int,
    val manySensitivePoints: Int,
    val mismatchPoints: Int,
    val impersonationPoints: Int,
    val maxScore: Int,
    val groupPoints: Map<String, Int>,
    val groupLabelKeys: Map<String, String>,
    /** Permission -> group. Built once so classification is O(P) lookups. */
    val permToGroup: Map<String, String>,
    val sensitiveGroups: Set<String>,
    /**
     * Component-derived groups are declared on `<service>`/`<receiver>`, never
     * as `uses-permission`. Two independent signals are recognised for each,
     * because real banking trojans often use the `<meta-data>` form alone and a
     * permission-only check would miss them.
     */
    val componentPermissionSignals: Map<String, String>,
    val componentMetaDataSignals: Map<String, String>,
    val categories: Map<String, CategoryDef>,
    val singleWordIndex: Map<String, String>,
    val multiWordKeywords: List<Pair<String, String>>,
    val unknownCategoryId: String,
    val patterns: List<PatternDef>,
    val brands: List<BrandDef>,
    val brandAliasIndex: Map<String, String>,
    val linkRules: LinkRules,
)

/**
 * Everything `link_rules.json` says, compiled to flat lookups.
 *
 * Kept separate from the APK rules because the link engine runs on-device in
 * the offline v1 and must not depend on any parsing feature the phone lacks.
 */
data class LinkRules(
    val checks: Map<String, LinkCheckDef>,
    val suspiciousTlds: Set<String>,
    val scamKeywords: List<String>,
    val knownShorteners: Set<String>,
    val apkExtensions: List<String>,
    val lookalikeMaxEditDistance: Int,
    val lookalikeLengthTolerance: Int,
)

data class LinkCheckDef(
    val id: String,
    val points: Int,
    val maxPoints: Int,
    val critical: Boolean,
    val reasonKey: String,
)

data class BandDef(
    val id: String,
    val minScore: Int,
    val maxScore: Int,
    val verdict: String,
    val recommendation: String,
    val labelKey: String,
) {
    fun contains(score: Int): Boolean = score in minScore..maxScore
}

data class CategoryDef(
    val id: String,
    val expectedGroups: Set<String>,
    val mismatchPenaltyDisabled: Boolean = false,
    val confidence: String? = null,
)

data class PatternDef(
    val id: String,
    val requires: Set<String>,
    val requiresAny: Set<String>,
    val bonus: Int,
    val critical: Boolean,
    val criticalIfNoLauncher: Boolean,
    val excludedCategories: Set<String>,
    val reasonKey: String,
    /**
     * Patterns decided by a different module are skipped by the matcher so that
     * exactly one implementation of each rule exists. Repackaging uses this.
     */
    val evaluatedBy: String? = null,
) {
    /**
     * True when every required group is present and, if `requiresAny` is
     * non-empty, at least one of those is present too.
     *
     * Time O(|requires| + |requiresAny|) set containment, constant in APK size.
     */
    fun matchesGroups(present: Set<String>): Boolean {
        if (!present.containsAll(requires)) return false
        if (requiresAny.isNotEmpty() && requiresAny.none { it in present }) return false
        return true
    }
}

data class BrandDef(
    val name: String,
    val aliases: List<String>,
    val officialDomains: Set<String>,
    val officialPackages: Set<String>,
    /**
     * Empty means "we cannot verify this brand yet", which is the correct and
     * honest value. A guessed fingerprint would flag every legitimate app of
     * the brand as malware, which is worse than having no check at all.
     */
    val officialCertSha256: Set<String>,
)

class RulesException(message: String) : Exception(message)