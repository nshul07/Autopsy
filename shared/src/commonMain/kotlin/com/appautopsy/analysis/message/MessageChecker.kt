package com.appautopsy.analysis.message

import com.appautopsy.analysis.link.LinkReport
import com.appautopsy.analysis.link.LinkScorer
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.analysis.rules.Rules

/**
 * Message scam checker (F23), 1:1 port of `backend/app/message/checker.py`.
 *
 * Rule-regex only: urgency, KYC/block threats, OTP/PIN asks, prize claims,
 * APK mentions, plus every embedded link sent through the link engine.
 *
 * Privacy contract inherited from the Python original: text crosses this
 * function and dies here. Nothing is stored, nothing logged; callers that
 * keep a report must keep signals and scores only, never the message body.
 *
 * Input length is capped by [MAX_TEXT_LEN] at the boundary — the receiver
 * path feeds untrusted remote content into regexes, so this is the zip-bomb
 * rule applied to text: bound it before you scan it.
 */

const val MAX_TEXT_LEN = 4000

/** Reason keys for each signal family; the catalog renders them in any language. */
data class MessageReport(
    val score: Int,
    val bandId: String,
    val verdictId: String,
    val signals: List<String>,
    val foundUrls: List<String>,
    val links: List<LinkReport>,
    /** Only the first [LINK_CAP] links are analyzed; the rest are listed raw. */
    val linksCapped: Boolean,
)

private val URGENCY_PATTERNS = listOf(
    Regex("(?i)\\burgent\\b"), Regex("(?i)\\bimmediately\\b"), Regex("(?i)\\bwithin 24\\b"),
    Regex("(?i)\\bexpire[ds]?\\b"), Regex("(?i)\\baction required\\b"), Regex("(?i)\\blast warning\\b"),
    Regex("(?i)\\btoday only\\b"), Regex("तुरंत"), Regex("जल्दी"), Regex("बंद हो जाएगा"), Regex("ਅੱਜ ਹੀ"),
)
private val KYC_PATTERNS = listOf(
    Regex("(?i)\\bkyc\\b"), Regex("(?i)\\bpan\\b"), Regex("(?i)\\baadhaar\\b"),
    Regex("(?i)\\baccount block\\b"), Regex("(?i)\\bsuspend(ed)?\\b"),
    Regex("(?i)\\bdeactivate[d]?\\b"), Regex("(?i)\\bunblock\\b"),
    Regex("केवाईसी"), Regex("खाता बंद"), Regex("ਖਾਤਾ ਬੰਦ"),
)
private val CREDENTIAL_PATTERNS = listOf(
    Regex("(?i)\\botp\\b"), Regex("(?i)\\bpin\\b"), Regex("(?i)\\bcvv\\b"),
    Regex("(?i)\\bpassword\\b"), Regex("ओटीपी"), Regex("पिन"),
)
private val PRIZE_PATTERNS = listOf(
    Regex("(?i)\\bwon\\b"), Regex("(?i)\\blottery\\b"), Regex("(?i)\\bprize\\b"),
    Regex("(?i)\\breward points\\b"), Regex("(?i)\\bcashback\\b"),
    Regex("(?i)\\bcongratulations\\b"), Regex("(?i)\\bclaim\\b"),
    Regex("इनाम"), Regex("लॉटरी"), Regex("ਜੀਤਿਆ"),
)
private val APK_PATTERNS = listOf(
    Regex("(?i)\\.apk\\b"), Regex("(?i)\\binstall app\\b"),
    Regex("(?i)\\bdownload apk\\b"), Regex("ऐप डाउनलोड"),
)

private val URL_REGEX = Regex("https?://[^\\s<>\"']+", RegexOption.IGNORE_CASE)

private const val LINK_CAP = 3

private fun matchAny(patterns: List<Regex>, text: String): Boolean =
    patterns.any { it.containsMatchIn(text) }

fun checkMessage(textIn: String, rules: Rules): MessageReport {
    val text = textIn.take(MAX_TEXT_LEN)
    val signals = mutableListOf<String>()
    var score = 0

    val hasCredentials = matchAny(CREDENTIAL_PATTERNS, text)
    if (matchAny(URGENCY_PATTERNS, text)) { score += 20; signals += "msg.urgency" }
    if (matchAny(KYC_PATTERNS, text)) { score += 25; signals += "msg.kyc_threat" }
    if (hasCredentials) { score += 35; signals += "msg.credential_ask" }
    if (matchAny(PRIZE_PATTERNS, text)) { score += 20; signals += "msg.prize_claim" }
    if (matchAny(APK_PATTERNS, text)) { score += 25; signals += "msg.apk_prompt" }

    val foundUrls = URL_REGEX.findAll(text).map { it.value }.toList()
    val links = foundUrls.take(LINK_CAP).mapNotNull { raw ->
        runCatching { LinkScorer.checkLink(raw, rules) }.getOrNull()
    }
    for (link in links) {
        when (link.verdictId) {
            Verdict.RED.id -> score += 40
            Verdict.YELLOW.id -> score += 20
        }
    }

    score = minOf(score, 100)
    val band = com.appautopsy.analysis.core.RiskEngine.bandFor(score, rules)
    var verdict = Verdict.fromId(band.verdict)
    // Credentials alone force red: a bank never asks for an OTP by message.
    if (hasCredentials && verdict != Verdict.RED) verdict = Verdict.RED

    return MessageReport(
        score = score,
        bandId = band.id,
        verdictId = verdict.id,
        signals = signals,
        foundUrls = foundUrls,
        links = links,
        linksCapped = foundUrls.size > LINK_CAP,
    )
}
