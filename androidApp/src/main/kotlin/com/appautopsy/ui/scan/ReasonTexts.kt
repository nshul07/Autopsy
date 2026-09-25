package com.appautopsy.ui.scan

import com.appautopsy.analysis.catalog.Catalog

/**
 * Turns a scan's reason keys into localized sentences.
 *
 * This is the single renderer used by both the verdict screen and the warning
 * notification. Two renderers would drift, and the drift would surface as a
 * notification contradicting the screen — the fastest way to make a user
 * distrust both.
 *
 * Params travel with each key (the `{decoded}` domain in a punycode warning,
 * the brand name in an impersonation warning) so the sentence reads as an
 * explanation rather than a category label.
 */
fun scanReasonTexts(scan: ScanResult, catalog: Catalog, limit: Int = 3): List<String> {
    val pairs: List<Pair<String, Map<String, String>>> = when (scan) {
        is ScanResult.Link -> scan.report.reasons

        // A message's own signals come first — they describe the message the
        // user is holding; the link findings that follow are consequences.
        is ScanResult.Message ->
            scan.report.signals.map { it to emptyMap<String, String>() } +
                scan.report.links.flatMap { it.reasons }

        is ScanResult.Rejected -> listOf(scan.reasonKey to emptyMap<String, String>())
    }

    return pairs
        .map { (key, params) -> catalog.text(key, params) }
        .filter { it.isNotBlank() }
        .distinct()
        .take(limit)
}