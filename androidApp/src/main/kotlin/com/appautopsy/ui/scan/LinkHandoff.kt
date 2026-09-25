package com.appautopsy.ui.scan

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.net.Uri
import android.os.Build

/**
 * Handing a link back to a real browser.
 *
 * The flow this exists for: user taps a link in WhatsApp → the system offers
 * AppAutopsy (we asked for the browser role) → we scan → **the user must
 * still end up where they meant to go**. A guard that swallows the tap is
 * worse than no guard, because the user is then stuck on a verdict screen
 * with no page. Every path in this file exists to make the handoff happen.
 *
 * Two rules keep it safe:
 *
 *  1. **We always target a real browser explicitly.** The chosen package is
 *     remembered in prefs and passed via [Intent.setPackage]. Without that,
 *     "open in the default browser" would resolve back to *us* — the chooser
 *     would offer AppAutopsy again, and a tap would loop instead of navigat-
 *     ing. [selfPackage] is excluded everywhere for the same reason.
 *
 *  2. **Nothing is ever opened on our own authority.** The URL came from the
 *     user's own tap and is opened in the user's own browser. We do not fetch
 *     it; this class never touches the network.
 */
object LinkHandoff {

    private const val PREFS = "link_handoff"
    private const val KEY_BROWSER = "browser_pkg"

    private fun selfPackage(context: Context): String = context.packageName

    /**
     * Browsers installed on this device, sorted by package name.
     *
     * Excludes our own package. Requires the `<queries>` block in the
     * manifest: on API 30+ this returns an empty list without it, and the
     * failure is silent — the picker just looks empty.
     */
    fun installedBrowsers(context: Context): List<ResolveInfo> {
        val probe = Intent(Intent.ACTION_VIEW, Uri.parse("https://example.com")).apply {
            addCategory(Intent.CATEGORY_BROWSABLE)
        }
        val pm = context.packageManager
        return pm.queryIntentActivities(probe, PackageManager.MATCH_DEFAULT_ONLY)
            .filter { it.activityInfo?.packageName != selfPackage(context) }
            .distinctBy { it.activityInfo?.packageName }
            .sortedBy { it.activityInfo?.packageName }
    }

    /**
     * The remembered real browser, or null if the user never picked one or
     * has since uninstalled it. Callers must treat null as "ask the user",
     * never as "use the system default" — the system default may be us.
     */
    fun chosenBrowser(context: Context): String? {
        val pkg = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_BROWSER, null) ?: return null
        return if (installedBrowsers(context).any { it.activityInfo?.packageName == pkg }) pkg else null
    }

    fun rememberBrowser(context: Context, packageName: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_BROWSER, packageName).apply()
    }

    fun forgetBrowser(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY_BROWSER).apply()
    }

    /**
     * Open [url] in the remembered browser.
     *
     * @return false when no real browser is known yet — the caller should ask
     *   the user to pick one. Returning false (rather than falling back to an
     *   implicit intent) is what stops a URL from ever being handed to
     *   ourselves by accident.
     */
    fun open(context: Context, url: String): Boolean {
        val pkg = chosenBrowser(context) ?: return false
        return openIn(context, url, pkg)
    }

    /** Open [url] in a specific browser package. Refuses to open in ourselves. */
    fun openIn(context: Context, url: String, packageName: String): Boolean {
        if (packageName == selfPackage(context)) return false
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addCategory(Intent.CATEGORY_BROWSABLE)
            setPackage(packageName)
            // The user tapped a link and meant to navigate. Keep our task out
            // of it so Back returns to WhatsApp/Insta, not to the verdict.
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return runCatching { context.startActivity(intent) }.isSuccess
    }

    /** Human-readable app label for a package, for the picker. */
    fun labelFor(context: Context, packageName: String): String = runCatching {
        val pm = context.packageManager
        pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
    }.getOrDefault(packageName)

    /**
     * Ask the system for the browser role (API 29+). Granting this is what
     * makes us see links at all; everything else here is downstream of it.
     *
     * @return null when there is nothing to ask — below API 29 the role API
     *   does not exist, and if we already hold the role there is no dialog to
     *   show. Callers must send the user to Settings in the first case.
     */
    fun browserRoleIntent(context: Context): Intent? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return null
        val rm = context.getSystemService(RoleManager::class.java) ?: return null
        if (!rm.isRoleAvailable(RoleManager.ROLE_BROWSER)) return null
        if (rm.isRoleHeld(RoleManager.ROLE_BROWSER)) return null
        return rm.createRequestRoleIntent(RoleManager.ROLE_BROWSER)
    }

    /**
     * Whether this device could ever hand us the browser role.
     *
     * Distinct from [browserRoleIntent] returning null, which means *either*
     * "already held" or "not offered" — a UI that cannot tell those apart
     * shows "set as browser" to someone who already did, or hides the row on a
     * device where it would have worked. Below API 29 there is no role API at
     * all, so this is false and the row is hidden rather than dead.
     */
    fun isBrowserRoleAvailable(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        val rm = context.getSystemService(RoleManager::class.java) ?: return false
        return rm.isRoleAvailable(RoleManager.ROLE_BROWSER)
    }

    fun holdsBrowserRole(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        val rm = context.getSystemService(RoleManager::class.java) ?: return false
        return rm.isRoleHeld(RoleManager.ROLE_BROWSER)
    }

    /** The OS settings page where an unlisted/default browser choice is made. */
    fun defaultAppsSettings(): Intent =
        Intent(android.provider.Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
}