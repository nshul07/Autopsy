package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.RepackagingResult
import com.appautopsy.analysis.rules.Rules

/**
 * Repackaging / signer-mismatch detection (F12) — the wedge.
 *
 * A repackaged app keeps a trusted name but was rebuilt and re-signed by a
 * stranger. Three independent signals, checked in order of strength:
 *
 *  1. Signer changed since last scan (needs only our own history — no brand
 *     data). The strongest signal available.
 *  2. Known-brand package with an unrecognised certificate.
 *  3. Package-name collision: a brand's package name claimed by a label that
 *     is not that brand.
 *
 * Honesty rule baked into signal 2: it only fires when `official_cert_sha256`
 * is non-empty. An empty list means "we cannot check this brand yet", which is
 * correct; a fabricated fingerprint would flag every legitimate app of the
 * brand as malware.
 */
object Repackaging {

    fun detect(
        label: String?,
        packageName: String?,
        signingCerts: List<String>,
        priorCertSha256: String?,
        rules: Rules,
    ): RepackagingResult? {
        val pkgClean = packageName.orEmpty().lowercase().trim()
        val certsClean = signingCerts
            .filter { it.isNotBlank() }
            .map { it.lowercase().trim() }
            .toSet()
        // Sorted pick, so the reported cert never depends on set iteration
        // order — the same input must print the same report forever.
        val actualCert = certsClean.minOrNull()

        // Signal 1: signer changed since the last scan of this package.
        if (!priorCertSha256.isNullOrEmpty() &&
            SignerHistory.hasSignerChanged(priorCertSha256, signingCerts)
        ) {
            return RepackagingResult(
                detected = true,
                signal = "signer_changed",
                expectedCertSha256 = priorCertSha256,
                actualCertSha256 = actualCert,
                detailKey = "repackaging.signer_mismatch",
            )
        }

        val targetText = "${label.orEmpty()} ${packageName.orEmpty()}".lowercase()

        for (brand in rules.brands) {
            val aliasMatches = brand.aliases.any { it in targetText }
            val isOfficialPackage = pkgClean in brand.officialPackages

            // Signal 2: official package, certificate we cannot attribute to
            // the brand. Skippable only when we hold no official certs at all.
            if (isOfficialPackage && brand.officialCertSha256.isNotEmpty()) {
                if (certsClean.intersect(brand.officialCertSha256).isEmpty()) {
                    return RepackagingResult(
                        detected = true,
                        signal = "signer_mismatch",
                        expectedCertSha256 = brand.officialCertSha256.minOrNull(),
                        actualCertSha256 = actualCert,
                        detailKey = "repackaging.signer_mismatch",
                    )
                }
            }

            // Signal 3: the package belongs to a brand, but the label does not
            // claim to be that brand — someone reusing the identifier itself.
            if (isOfficialPackage && !aliasMatches) {
                return RepackagingResult(
                    detected = true,
                    signal = "package_collision",
                    expectedCertSha256 = null,
                    actualCertSha256 = actualCert,
                    detailKey = "repackaging.package_collision",
                )
            }
        }

        return null
    }
}
