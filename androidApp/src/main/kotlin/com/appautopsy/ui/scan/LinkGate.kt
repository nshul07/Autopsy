package com.appautopsy.ui.scan

import com.appautopsy.analysis.model.Verdict

/**
 * Where a scan came from. This is not bookkeeping — it decides whether the
 * app may navigate the user somewhere. Only a link the user actually *tapped*
 * earns a handoff; text pasted into the box never opens a browser, because
 * the user is already looking at the app and did not ask to go anywhere.
 */
enum class ScanOrigin {
    /** ACTION_VIEW with real data — a tapped link. The only silent-pass case. */
    LINK,

    /** Share sheet or text-selection menu — the user chose to send us this. */
    SHARE,

    /** Pasted or typed into the app's own box. */
    MANUAL,

    /** Tapped one of our own notifications. */
    NOTIFICATION,
    // The mapping onto the history store's Source lives with the store, not
    // here: this file stays free of the storage layer so the policy below can
    // be compiled and tested as plain Kotlin.
}

/**
 * What to do with a finished scan. Pure: no context, no I/O, so the policy
 * can be tested off-device and reviewed without reading the activity.
 */
sealed interface GateDecision {
    /** Clean tapped link and a real browser is known — go straight there. */
    data object HandOff : GateDecision

    /**
     * Clean tapped link, but no browser chosen yet. Asking once is the only
     * way to learn where "the user's browser" is: guessing means handing the
     * URL to the system default, which may well be *us* — the loop.
     */
    data object AskBrowserThenHandOff : GateDecision

    /** Risky tapped link: hold on the verdict screen and warn. */
    data object HoldAndWarn : GateDecision

    /** Not the link path at all — just show the result. */
    data object ShowResult : GateDecision
}

object LinkGate {

    /**
     * The whole policy, in one place:
     *
     *  - a **clean** link the user tapped passes through with no screen at all
     *    (a guard must be invisible when there is nothing to say);
     *  - a **risky** link is held, and the hold is announced by a notification
     *    so the warning survives even if the user immediately backs out;
     *  - anything that did not arrive as a tap just gets shown.
     *
     * @param hasBrowser whether a real (non-self) browser package is remembered
     */
    fun decide(scan: ScanResult, origin: ScanOrigin, hasBrowser: Boolean): GateDecision {
        if (origin != ScanOrigin.LINK) return GateDecision.ShowResult

        // Only a single clean URL can pass through. A *message* containing a
        // link must not auto-open anything: the message is what is being
        // judged, and we have no business navigating to a URL pulled out of
        // prose the user never tapped.
        val link = scan as? ScanResult.Link ?: return GateDecision.ShowResult

        return when (link.verdict) {
            Verdict.GREEN ->
                if (hasBrowser) GateDecision.HandOff else GateDecision.AskBrowserThenHandOff

            Verdict.YELLOW, Verdict.RED -> GateDecision.HoldAndWarn
        }
    }
}