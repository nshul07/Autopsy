package com.appautopsy.ui.scan

import com.appautopsy.analysis.link.LinkReport
import com.appautopsy.analysis.message.MessageReport
import com.appautopsy.analysis.model.Verdict
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The handoff policy is the product's central promise, and it is the one piece
 * of the Android layer that can be tested without a device:
 *
 *   "if link is safe then redirect to the default browser, and if risky then
 *    pop up a warning"
 *
 * Each test below pins one clause of that sentence. The dangerous direction is
 * a false HandOff — a link the user never tapped, or a message body, silently
 * navigating them somewhere. That is why the negative cases outnumber the
 * positive ones.
 */
class LinkGateTest {

    private fun bandOf(verdict: Verdict) = when (verdict) {
        Verdict.GREEN -> "low"
        Verdict.YELLOW -> "medium"
        Verdict.RED -> "high"
    }

    private fun link(verdict: Verdict) = ScanResult.Link(
        report = LinkReport(
            inputUrl = "https://example.com",
            normalizedUrl = "https://example.com/",
            score = if (verdict == Verdict.GREEN) 0 else 80,
            bandId = bandOf(verdict),
            verdictId = verdict.id,
            checks = emptyList(),
            reasons = emptyList(),
        ),
        verdict = verdict,
        score = if (verdict == Verdict.GREEN) 0 else 80,
        bandId = bandOf(verdict),
    )

    private fun message(verdict: Verdict) = ScanResult.Message(
        report = MessageReport(
            score = if (verdict == Verdict.GREEN) 0 else 80,
            bandId = bandOf(verdict),
            verdictId = verdict.id,
            signals = emptyList(),
            foundUrls = emptyList(),
            links = emptyList(),
            linksCapped = false,
        ),
        verdict = verdict,
        score = if (verdict == Verdict.GREEN) 0 else 80,
        bandId = bandOf(verdict),
    )

    // ---- the promise: a clean tapped link passes straight through ----------

    @Test
    fun `clean tapped link with a known browser is handed off without a screen`() {
        assertEquals(
            GateDecision.HandOff,
            LinkGate.decide(link(Verdict.GREEN), ScanOrigin.LINK, hasBrowser = true),
        )
    }

    @Test
    fun `clean tapped link with no browser asks once instead of guessing`() {
        // Guessing would mean handing the URL to the system default, which on
        // a device where the user set us as default is us — an infinite loop.
        assertEquals(
            GateDecision.AskBrowserThenHandOff,
            LinkGate.decide(link(Verdict.GREEN), ScanOrigin.LINK, hasBrowser = false),
        )
    }

    // ---- the promise: a risky tapped link is held, never opened ------------

    @Test
    fun `risky tapped links are held and warned, browser or not`() {
        for (verdict in listOf(Verdict.YELLOW, Verdict.RED)) {
            for (hasBrowser in listOf(true, false)) {
                assertEquals(
                    "verdict=$verdict hasBrowser=$hasBrowser",
                    GateDecision.HoldAndWarn,
                    LinkGate.decide(link(verdict), ScanOrigin.LINK, hasBrowser = hasBrowser),
                )
            }
        }
    }

    // ---- the dangerous direction: nothing else may auto-navigate ----------

    @Test
    fun `only a tapped link can be handed off`() {
        for (origin in listOf(ScanOrigin.SHARE, ScanOrigin.MANUAL, ScanOrigin.NOTIFICATION)) {
            assertEquals(
                "origin=$origin",
                GateDecision.ShowResult,
                LinkGate.decide(link(Verdict.GREEN), origin, hasBrowser = true),
            )
        }
    }

    @Test
    fun `a message is never handed off even when its verdict is clean`() {
        // A message is judged as a whole; we have no business navigating to a
        // URL scraped out of prose the user never tapped.
        for (verdict in listOf(Verdict.GREEN, Verdict.YELLOW, Verdict.RED)) {
            assertEquals(
                "verdict=$verdict",
                GateDecision.ShowResult,
                LinkGate.decide(message(verdict), ScanOrigin.LINK, hasBrowser = true),
            )
        }
    }

    @Test
    fun `a rejected scan is only ever shown`() {
        assertEquals(
            GateDecision.ShowResult,
            LinkGate.decide(ScanResult.Rejected("error.invalid_url"), ScanOrigin.LINK, hasBrowser = true),
        )
    }

    // ---- history bookkeeping must not claim a handoff that never happened --

    @Test
    fun `only the link door records as a link scan`() {
        assertEquals(ScanStore.Source.LINK, ScanOrigin.LINK.toStoreSource())
        assertEquals(ScanStore.Source.MANUAL, ScanOrigin.SHARE.toStoreSource())
        assertEquals(ScanStore.Source.MANUAL, ScanOrigin.MANUAL.toStoreSource())
        assertEquals(ScanStore.Source.MANUAL, ScanOrigin.NOTIFICATION.toStoreSource())
    }
}