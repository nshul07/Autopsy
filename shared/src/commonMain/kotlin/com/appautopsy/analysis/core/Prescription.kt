package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.Prescription
import com.appautopsy.analysis.rules.Rules

/**
 * Minimum-permission prescription (F19).
 *
 * The tool does not only diagnose, it prescribes: "a flashlight app can do its
 * job with only: Camera". Derived straight from the category's expected groups,
 * so it can never disagree with the scoring that used the same list.
 *
 * Pure function over the category. Contributes 0 points.
 */
object Prescription {

    fun minimum(categoryId: String, rules: Rules): Prescription =
        Prescription(minimalGroups = Category.expectedGroups(categoryId, rules).sorted())
}
