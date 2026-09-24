package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.ImpersonationResult
import com.appautopsy.analysis.rules.Rules

/**
 * Brand impersonation detection.
 *
 * An app wearing a known brand's name or package while not being that brand's
 * package is claiming to be something it is not. Only brands with a known
 * official-package list can be judged — with no list, there is nothing honest
 * to say, so no result.
 */
object Impersonation {

    fun detect(
        label: String?,
        packageName: String?,
        rules: Rules,
    ): ImpersonationResult? {
        val targetText = "${label.orEmpty()} ${packageName.orEmpty()}".lowercase()
        val pkgClean = packageName.orEmpty().lowercase()

        for (brand in rules.brands) {
            val matchedAlias = brand.aliases.any { it in targetText }
            if (!matchedAlias) continue

            if (brand.officialPackages.isNotEmpty() && pkgClean !in brand.officialPackages) {
                return ImpersonationResult(
                    brand = brand.name,
                    reasonKey = "impersonation.detected",
                )
            }
        }

        return null
    }
}
