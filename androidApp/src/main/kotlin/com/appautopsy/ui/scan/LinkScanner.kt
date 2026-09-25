package com.appautopsy.ui.scan

import com.appautopsy.analysis.link.InvalidUrlException
import com.appautopsy.analysis.link.LinkReport
import com.appautopsy.analysis.link.LinkScorer
import com.appautopsy.analysis.link.normalizeUrl
import com.appautopsy.analysis.message.MessageReport
import com.appautopsy.analysis.message.checkMessage
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.analysis.rules.Rules

/**
 * One entry point for user text, one verdict out.
 *
 * A single bare URL gets the dedicated link report; anything else (messages,
 * pasted chats, a URL inside sentences) goes through the message checker,
 * which runs the link engine over every URL it finds inside.
 */
sealed class ScanResult {
    abstract val verdict: Verdict
    abstract val score: Int
    abstract val bandId: String

    data class Link(
        val report: LinkReport,
        override val verdict: Verdict,
        override val score: Int,
        override val bandId: String,
    ) : ScanResult()

    data class Message(
        val report: MessageReport,
        override val verdict: Verdict,
        override val score: Int,
        override val bandId: String,
    ) : ScanResult()

    /** Input was empty or a malformed URL — show error text, never a verdict. */
    data class Rejected(val reasonKey: String) : ScanResult() {
        override val verdict: Verdict get() = Verdict.GREEN
        override val score: Int get() = 0
        override val bandId: String get() = "low"
    }
}

object LinkScanner {

    fun scan(rules: Rules, input: String): ScanResult {
        val trimmed = input.trim()
        if (trimmed.isEmpty()) return ScanResult.Rejected("error.invalid_url")

        // Single bare URL (no spaces, no newline) → link report directly.
        val looksLikeUrl = !trimmed.any { it == ' ' || it == '\n' || it == '\t' }
        if (looksLikeUrl) {
            val normalized = runCatching { normalizeUrl(trimmed) }
            if (normalized.isSuccess) {
                val report = LinkScorer.checkLink(trimmed, rules)
                return ScanResult.Link(
                    report = report,
                    verdict = Verdict.fromId(report.verdictId),
                    score = report.score,
                    bandId = report.bandId,
                )
            }
            return ScanResult.Rejected("error.invalid_url")
        }

        val report = runCatching { checkMessage(trimmed, rules) }
            .getOrElse { return ScanResult.Rejected("error.internal") }
        return ScanResult.Message(
            report = report,
            verdict = Verdict.fromId(report.verdictId),
            score = report.score,
            bandId = report.bandId,
        )
    }
}
