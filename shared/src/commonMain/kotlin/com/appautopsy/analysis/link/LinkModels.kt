package com.appautopsy.analysis.link

/**
 * Types the link engine produces. Mirrors `backend/app/models/schemas.py`
 * field-for-field for the offline subset, so a report rendered on the phone
 * reads exactly like the same report from the reference backend.
 *
 * The online half of the Python contract (redirect expansion, reputation) is
 * intentionally absent: v1 is offline and those checks report as
 * `not_checked`, contributing zero points.
 */

enum class CheckStatus(val id: String) {
    FLAGGED("flagged"),
    PASSED("passed"),
    NOT_CHECKED("not_checked");
}

data class LinkCheckResult(
    val id: String,
    val status: CheckStatus,
    val points: Int,
    val reasonKey: String,
    val params: Map<String, String> = emptyMap(),
)

data class LinkReport(
    val inputUrl: String,
    val normalizedUrl: String,
    val score: Int,
    val bandId: String,
    val verdictId: String,
    val checks: List<LinkCheckResult>,
    /** reason_keys + params; the UI renders through Catalog so language
     * switching never re-runs analysis. */
    val reasons: List<Pair<String, Map<String, String>>>,
)
