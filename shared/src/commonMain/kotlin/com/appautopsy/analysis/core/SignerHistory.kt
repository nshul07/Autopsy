package com.appautopsy.analysis.core

/**
 * Shared cert-change detection (F12 signal 3 + F13).
 *
 * "Same package name, different signer than last time" is a textbook
 * repackaging indicator, and it is the one signal that needs no brand data at
 * all. It lives here so repackaging detection and the version-diff tracker
 * consume one implementation rather than two that can diverge.
 */
object SignerHistory {

    /**
     * True when a prior cert exists and none of the current certs match it.
     *
     * An empty side means "no comparison possible", which answers false:
     * absence of data is never treated as evidence of an attack.
     */
    fun hasSignerChanged(
        priorCertSha256: String?,
        currentCertsSha256: List<String>,
    ): Boolean {
        val prior = priorCertSha256?.trim()?.lowercase()
        if (prior.isNullOrEmpty() || currentCertsSha256.isEmpty()) return false

        val current = currentCertsSha256
            .filter { it.isNotBlank() }
            .map { it.trim().lowercase() }
            .toSet()

        return prior !in current
    }
}
