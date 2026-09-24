package com.appautopsy.analysis.core

import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.ImpersonationResult
import com.appautopsy.analysis.model.RepackagingResult
import com.appautopsy.analysis.model.ScoreResult

/**
 * Builds the human-readable part of a report from the scored part.
 *
 * Order is deliberate: the most damning findings first (is this even the app it
 * claims to be → is it wearing a brand's face → which attack pattern does it
 * match → then the individual permission mismatches). Deduplication keeps the
 * reader from seeing the same sentence twice when a pattern and a group share
 * a reason.
 *
 * Pure: given the same result and catalog, the same strings forever.
 */
object Explain {

    data class Explanations(
        val reasons: List<String>,
        val summary: String,
        val recommendation: String,
        val limitations: String,
    )

    fun build(
        score: ScoreResult,
        categoryId: String,
        impersonation: ImpersonationResult?,
        repackaging: RepackagingResult?,
        catalog: Catalog,
    ): Explanations {
        val reasons = mutableListOf<String>()

        // 1. "Is this the app it claims to be" comes before everything.
        if (repackaging != null && repackaging.detected) {
            reasons += catalog.text(repackaging.detailKey)
        }
        if (impersonation != null) {
            reasons += catalog.text(impersonation.reasonKey)
        }

        // 2. Matched attack patterns. Added verbatim, matching the Python
        //    reference exactly — divergent report text between runtimes would
        //    break the reproducibility claim, even in cosmetic ways.
        for (pattern in score.patterns) {
            reasons += catalog.text(pattern.reasonKey)
        }

        // 3. Unexpected permission groups and penalties, with the permission
        //    label and category name interpolated.
        for (item in score.breakdown) {
            if (item.status != "unexpected") continue

            val permissionLabel = item.params["group"]
                ?.let { catalog.text("perm.$it") }
                ?: ""
            val categoryName = catalog.text("category.$categoryId")

            val text = catalog.text(
                item.reasonKey,
                mapOf(
                    "permission_label" to permissionLabel,
                    "category" to categoryName,
                    "count" to item.params["count"].orEmpty(),
                ),
            )
            if (text.isNotEmpty() && text !in reasons) reasons += text
        }

        val categoryDisplay = catalog.text("category.$categoryId")
        val summary = catalog.text("summary.${score.verdict.id}", mapOf("category" to categoryDisplay))
        val recommendation = catalog.text("recommendation.${score.recommendation}")
        val limitations = catalog.text("disclaimer")

        return Explanations(
            reasons = reasons,
            summary = summary,
            recommendation = recommendation,
            limitations = limitations,
        )
    }
}
