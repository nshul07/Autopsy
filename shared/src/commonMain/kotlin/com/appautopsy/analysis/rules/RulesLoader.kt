package com.appautopsy.analysis.rules

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Turns the shipped JSON into compiled [Rules].
 *
 * All tunables live in JSON rather than Kotlin so a rule change never requires
 * a code change or a rebuild of the analysis logic.
 *
 * Complexity: O(K) over the rule definitions — a few hundred entries, measured
 * in microseconds, and paid once per process.
 */
object RulesLoader {

    private val json = Json { ignoreUnknownKeys = true }

    /**
     * @param readFile resolves a data file name (e.g. `rules.json`) to its text.
     *   Tests pass a fixture reader; the app passes an asset reader. Keeping this
     *   as a parameter is what lets the whole engine be tested on the JVM with no
     *   Android framework present.
     */
    fun load(readFile: (String) -> String): Rules {
        val rulesRaw = json.parseToJsonElement(readFile("rules.json")).jsonObject
        val categoriesRaw = json.parseToJsonElement(readFile("categories.json")).jsonObject
        val patternsRaw = json.parseToJsonElement(readFile("patterns.json")).jsonObject
        val brandsRaw = json.parseToJsonElement(readFile("brands.json")).jsonObject

        val groups = rulesRaw["groups"]!!.jsonObject

        val permToGroup = mutableMapOf<String, String>()
        val groupPoints = mutableMapOf<String, Int>()
        val groupLabelKeys = mutableMapOf<String, String>()
        val permissionSignals = mutableMapOf<String, String>()
        val metaDataSignals = mutableMapOf<String, String>()

        for ((groupId, specElement) in groups) {
            val spec = specElement.jsonObject
            groupPoints[groupId] = spec["points"]?.jsonPrimitive?.content?.toInt() ?: 0
            groupLabelKeys[groupId] = spec["label_key"]!!.jsonPrimitive.content

            spec["permissions"]?.jsonArray?.forEach { permission ->
                permToGroup[permission.jsonPrimitive.content] = groupId
            }

            if (spec["source"]?.jsonPrimitive?.content == "component") {
                spec["component_signals"]?.jsonArray?.forEach { signal ->
                    permissionSignals[signal.jsonPrimitive.content] = groupId
                }
                spec["meta_data_names"]?.jsonArray?.forEach { name ->
                    metaDataSignals[name.jsonPrimitive.content] = groupId
                }
            }
        }

        val categories = buildCategories(categoriesRaw["categories"]!!.jsonObject)
        val (singleWord, multiWord) = buildCategoryIndices(categoriesRaw["categories"]!!.jsonObject)
        val (brands, aliasIndex) = buildBrands(brandsRaw["brands"]!!.jsonArray)

        val scoring = rulesRaw["rules"]!!.jsonObject

        return Rules(
            bands = rulesRaw["bands"]!!.jsonArray.map { element ->
                val band = element.jsonObject
                BandDef(
                    id = band["id"]!!.jsonPrimitive.content,
                    minScore = band["min"]!!.jsonPrimitive.content.toInt(),
                    maxScore = band["max"]!!.jsonPrimitive.content.toInt(),
                    verdict = band["verdict"]!!.jsonPrimitive.content,
                    recommendation = band["recommendation"]!!.jsonPrimitive.content,
                    labelKey = band["label_key"]!!.jsonPrimitive.content,
                )
            },
            manySensitiveThreshold = scoring["many_sensitive_threshold"]!!.jsonPrimitive.content.toInt(),
            manySensitivePoints = scoring["many_sensitive_points"]!!.jsonPrimitive.content.toInt(),
            mismatchPoints = scoring["mismatch_points"]!!.jsonPrimitive.content.toInt(),
            impersonationPoints = scoring["impersonation_points"]!!.jsonPrimitive.content.toInt(),
            maxScore = scoring["max_score"]!!.jsonPrimitive.content.toInt(),
            groupPoints = groupPoints,
            groupLabelKeys = groupLabelKeys,
            permToGroup = permToGroup,
            // Zero-point groups (boot) exist to feed patterns, not to score.
            sensitiveGroups = groupPoints.filterValues { it > 0 }.keys,
            componentPermissionSignals = permissionSignals,
            componentMetaDataSignals = metaDataSignals,
            categories = categories,
            singleWordIndex = singleWord,
            multiWordKeywords = multiWord,
            unknownCategoryId = "unknown",
            patterns = buildPatterns(patternsRaw["patterns"]!!.jsonArray),
            brands = brands,
            brandAliasIndex = aliasIndex,
        )
    }

    private fun buildCategories(raw: JsonObject): Map<String, CategoryDef> =
        raw.entries.associate { (categoryId, element) ->
            val spec = element.jsonObject
            categoryId to CategoryDef(
                id = categoryId,
                expectedGroups = spec["expected_groups"].stringSet(),
                mismatchPenaltyDisabled =
                    spec["mismatch_penalty_disabled"]?.jsonPrimitive?.content == "true",
                confidence = spec["confidence"]?.jsonPrimitive?.content,
            )
        }

    /**
     * Splits keywords into a single-token index (O(1) lookups) and a list of
     * multi-word ones (substring checks).
     *
     * Multi-word keywords are sorted longest-first so a more specific keyword
     * wins over a shorter prefix of it, and so the outcome never depends on the
     * order the JSON happened to be written in.
     */
    private fun buildCategoryIndices(raw: JsonObject): Pair<Map<String, String>, List<Pair<String, String>>> {
        val single = mutableMapOf<String, String>()
        val multi = mutableListOf<Pair<String, String>>()

        for ((categoryId, element) in raw) {
            for (keywordElement in element.jsonObject["keywords"].stringList()) {
                val keyword = keywordElement.trim().lowercase()
                if (keyword.isEmpty()) continue
                if (keyword.any { it == ' ' || it == '-' || it == '.' }) {
                    multi += keyword to categoryId
                } else {
                    single[keyword] = categoryId
                }
            }
        }

        multi.sortWith(compareByDescending<Pair<String, String>> { it.first.length }.thenBy { it.first })
        return single to multi
    }

    private fun buildPatterns(raw: JsonArray): List<PatternDef> =
        raw.map { element ->
            val spec = element.jsonObject
            PatternDef(
                id = spec["id"]!!.jsonPrimitive.content,
                requires = spec["requires"].stringSet(),
                requiresAny = spec["requires_any"].stringSet(),
                bonus = spec["bonus"]?.jsonPrimitive?.content?.toInt() ?: 0,
                critical = spec["critical"]?.jsonPrimitive?.content == "true",
                criticalIfNoLauncher = spec["critical_if_no_launcher"]?.jsonPrimitive?.content == "true",
                excludedCategories = spec["excluded_categories"].stringSet(),
                reasonKey = spec["reason_key"]!!.jsonPrimitive.content,
                evaluatedBy = spec["evaluated_by"]?.jsonPrimitive?.content,
            )
        }

    private fun buildBrands(raw: JsonArray): Pair<List<BrandDef>, Map<String, String>> {
        val brands = mutableListOf<BrandDef>()
        val aliasIndex = mutableMapOf<String, String>()

        for (element in raw) {
            val spec = element.jsonObject
            val brand = BrandDef(
                name = spec["brand"]!!.jsonPrimitive.content,
                aliases = spec["aliases"].stringList().map { it.lowercase() },
                officialDomains = spec["official_domains"].stringSet(),
                officialPackages = spec["official_packages"].stringSet(),
                officialCertSha256 = spec["official_cert_sha256"].stringSet(),
            )
            brands += brand
            for (alias in brand.aliases) aliasIndex[alias] = brand.name
        }

        return brands to aliasIndex
    }
}

/** Reads a JSON array of strings, treating a missing or null field as empty. */
private fun kotlinx.serialization.json.JsonElement?.stringList(): List<String> =
    (this as? JsonArray)?.map { it.jsonPrimitive.content } ?: emptyList()

private fun kotlinx.serialization.json.JsonElement?.stringSet(): Set<String> =
    stringList().toSet()