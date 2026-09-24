package com.appautopsy.analysis.core

import com.appautopsy.analysis.model.ComponentInfo
import com.appautopsy.analysis.model.PermissionItem
import com.appautopsy.analysis.rules.Rules

/**
 * Permission and component to group classification.
 *
 * Groups, not individual permissions, carry points: an app declaring READ_SMS,
 * RECEIVE_SMS and SEND_SMS pays the `sms` cost once.
 *
 * The permission-to-group map is a flat map built once at startup, so
 * classification is O(P) lookups rather than an O(P x G) nested scan over every
 * group's every permission.
 */
object Permissions {

    /**
     * Groups implied by component declarations.
     *
     * A component contributes a group when it either declares the binding
     * permission or carries the matching `<meta-data>` name. Either signal alone
     * is sufficient, which is the point of the dual check.
     *
     * Time O(C x M) over components and their meta-data names; both are small
     * fixed counts in a manifest.
     */
    fun componentGroupIds(
        services: List<ComponentInfo>,
        receivers: List<ComponentInfo>,
        rules: Rules,
    ): Set<String> {
        val found = mutableSetOf<String>()

        for (component in services + receivers) {
            component.permission?.let { permission ->
                resolveSignal(permission, rules)?.let { found += it }
            }
            for (metaName in component.metaDataNames) {
                rules.componentMetaDataSignals[metaName]?.let { found += it }
            }
        }

        return found
    }

    /**
     * Rules name component permissions in short form (`BIND_ACCESSIBILITY_SERVICE`)
     * while a manifest declares the fully qualified
     * `android.permission.BIND_ACCESSIBILITY_SERVICE`. Matching the short form as
     * a fallback keeps the rules readable and accepts either spelling, so a
     * mismatch here cannot silently disable the highest-value detection in the
     * system.
     */
    private fun resolveSignal(permission: String, rules: Rules): String? =
        rules.componentPermissionSignals[permission]
            ?: rules.componentPermissionSignals[permission.substringAfterLast('.')]

    /**
     * Every group the manifest declares, from permissions and components.
     *
     * Includes zero-point groups such as `boot`: they carry no score but
     * patterns depend on them.
     *
     * Time O(P + C), space O(G).
     */
    fun presentGroups(
        permissions: List<String>,
        services: List<ComponentInfo>,
        receivers: List<ComponentInfo>,
        rules: Rules,
    ): Set<String> {
        val groups = mutableSetOf<String>()
        for (permission in permissions) {
            rules.permToGroup[permission]?.let { groups += it }
        }
        groups += componentGroupIds(services, receivers, rules)
        return groups
    }

    /**
     * Per-permission view for the report table.
     *
     * Only permissions that map to a group are listed; everything else is noise
     * for a non-technical reader. Sorted by group then name so the output is
     * stable across runs.
     *
     * Time O(P log P) for the sort, dominated by P which is dozens at most.
     */
    fun permissionItems(
        permissions: List<String>,
        expected: Set<String>,
        rules: Rules,
    ): List<PermissionItem> =
        permissions
            .mapNotNull { name ->
                val group = rules.permToGroup[name] ?: return@mapNotNull null
                PermissionItem(
                    name = name,
                    group = group,
                    status = if (group in expected) "expected" else "unexpected",
                )
            }
            .sortedWith(compareBy({ it.group }, { it.name }))
}