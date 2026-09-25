package com.appautopsy.analysis.link

import com.appautopsy.analysis.core.RiskEngine
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.analysis.rules.Rules

/**
 * Link check scoring, offline path (F10/F11). Mirrors `backend/app/link/scorer.py`
 * minus the redirect expansion and reputation stages, which are network-only;
 * the online checks are appended as `not_checked` with zero points so the UI
 * can honestly show "could not check" instead of silently omitting them.
 */
object LinkScorer {

    fun checkLink(rawUrl: String, rules: Rules): LinkReport {
        val normalized = normalizeUrl(rawUrl)
        val checks = evaluateOfflineHeuristics(normalized, rules).toMutableList()

        // Online stages, explicitly not run offline (v1 contract).
        for (id in listOf("downgrade_redirect", "reputation_flagged")) {
            val def = rules.linkRules.checks[id]
            if (def != null) {
                checks += LinkCheckResult(
                    id = id,
                    status = CheckStatus.NOT_CHECKED,
                    points = 0,
                    reasonKey = "status.not_checked",
                )
            }
        }

        val rawScore = checks.filter { it.status == CheckStatus.FLAGGED }.sumOf { it.points }
        val score = minOf(rawScore, rules.maxScore)
        val bandDef = RiskEngine.bandFor(score, rules)

        // A punycode host that matches a brand (xn--pple-43d.com) is a
        // homoglyph spoof by construction — no legitimate site registers
        // those. Same for a strong brand match (brand's own word on someone
        // else's domain, a typo-squat, a brand buried in a lured-up domain):
        // 35 points alone would only warn, and a warning is the wrong answer
        // for a link that is impersonating a bank.
        val flagged = checks.filter { it.status == CheckStatus.FLAGGED }.map { it.id }.toSet()
        val homoglyphSpoof = "punycode" in flagged && "brand_lookalike" in flagged
        val strongBrand = checks.any {
            it.id == "brand_lookalike" && it.status == CheckStatus.FLAGGED && it.params["strong"] == "1"
        }
        val critical = homoglyphSpoof || strongBrand || checks.any {
            it.status == CheckStatus.FLAGGED && rules.linkRules.checks[it.id]?.critical == true
        }
        var verdict = Verdict.fromId(bandDef.verdict)
        if (critical && verdict != Verdict.RED) verdict = Verdict.RED

        val reasons = checks
            .filter { it.status == CheckStatus.FLAGGED }
            .map { it.reasonKey to it.params }

        return LinkReport(
            inputUrl = rawUrl,
            normalizedUrl = normalized.value,
            score = score,
            bandId = bandDef.id,
            verdictId = verdict.id,
            checks = checks,
            reasons = reasons,
        )
    }
}
