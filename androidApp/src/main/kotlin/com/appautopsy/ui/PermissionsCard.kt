package com.appautopsy.ui

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.ui.scan.LinkHandoff
import com.appautopsy.watch.MailNotificationListener

/**
 * The switchboard for the app's three automated paths.
 *
 * Without this screen the automated features simply never fire on a fresh
 * install: nothing requests RECEIVE_SMS or POST_NOTIFICATIONS, and Android has
 * no way to discover a NotificationListenerService on its own — the user must
 * find the system settings page themselves. The app looked broken and was not.
 *
 * Each row states *why* in one plain line. A permission prompt with no reason
 * attached is the kind users reflexively deny.
 *
 * Nothing here is required: the paste box works with every row off, and the
 * card says so. This is an offer, not a gate.
 */
@Composable
fun PermissionsCard(catalog: Catalog, modifier: Modifier = Modifier) {
    val context = LocalContext.current

    // Re-read on every recomposition trigger; permission state changes outside
    // the app (user returns from system settings), so it cannot be cached for
    // the process lifetime.
    var tick by remember { mutableLongStateOf(0L) }
    val sms = remember(tick) { context.hasPermission(Manifest.permission.RECEIVE_SMS) }
    val notif = remember(tick) {
        Build.VERSION.SDK_INT < 33 || context.hasPermission(Manifest.permission.POST_NOTIFICATIONS)
    }
    val mail = remember(tick) { context.hasMailAccess() }
    // The browser role is the one that decides whether a tapped link reaches us
    // at all. It is not a runtime permission — no dialog exists — so it is read
    // from RoleManager and requested through the system role intent.
    val browserOffered = remember(tick) { LinkHandoff.isBrowserRoleAvailable(context) }
    val browser = remember(tick) { LinkHandoff.holdsBrowserRole(context) }

    val roleLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) {
        // A role request can come back RESULT_CANCELED even when the role was
        // granted, so the result code is not evidence. Re-read the real state.
        tick++
        if (!LinkHandoff.holdsBrowserRole(context)) {
            toast(context, catalog.text("ui.perm_denied_hint"))
        }
    }

    val smsLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) {
        tick++
        if (!it) toast(context, catalog.text("ui.perm_denied_hint"))
    }
    val notifLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { tick++ }

    val allOn = sms && notif && mail && (browser || !browserOffered)

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = catalog.text("ui.perm_title"),
                style = MaterialTheme.typography.titleMedium,
            )
            if (!allOn) {
                Text(
                    text = catalog.text("ui.perm_body"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            // Browser role FIRST. This is the one row that stands between the
            // app and its headline promise: until it is granted, every link the
            // user taps opens in Chrome and AppAutopsy never runs. Listed above
            // SMS/mail because it is the highest-value switch on this card.
            if (browserOffered) {
                PermissionRow(
                    labelKey = "ui.perm_browser",
                    whyKey = "ui.perm_browser_why",
                    granted = browser,
                    grantedLabel = "ui.perm_browser_on",
                    catalog = catalog,
                    onEnable = {
                        // Null only if we already hold it or the platform has no
                        // role API; the row is hidden in the latter case, and a
                        // stale hold re-reads to granted on the next tick.
                        val request = LinkHandoff.browserRoleIntent(context)
                        if (request != null) {
                            runCatching { roleLauncher.launch(request) }
                                .onFailure { openDefaultAppsSettings(context) }
                        } else {
                            tick++
                        }
                    },
                )
            }

            PermissionRow(
                labelKey = "ui.perm_sms",
                whyKey = "ui.perm_sms_why",
                granted = sms,
                catalog = catalog,
                onEnable = { smsLauncher.launch(Manifest.permission.RECEIVE_SMS) },
            )

            PermissionRow(
                labelKey = "ui.perm_notif",
                whyKey = "ui.perm_notif_why",
                granted = notif,
                catalog = catalog,
                onEnable = {
                    if (Build.VERSION.SDK_INT >= 33) {
                        notifLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        // Pre-13 there is no runtime prompt; the only thing that
                        // can block us is the channel being off in settings.
                        openNotificationSettings(context)
                    }
                },
            )

            PermissionRow(
                labelKey = "ui.perm_mail",
                whyKey = "ui.perm_mail_why",
                granted = mail,
                catalog = catalog,
                // There is no runtime prompt for notification access at all —
                // the settings page is the only door, which is exactly why
                // this row has to exist.
                onEnable = { openNotificationListenerSettings(context) },
            )
        }
    }
}

@Composable
private fun PermissionRow(
    labelKey: String,
    whyKey: String,
    granted: Boolean,
    catalog: Catalog,
    grantedLabel: String = "ui.perm_granted",
    onEnable: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                // Icon + word, never colour alone (§12) — "On" is a word. The
                // browser row overrides the word: "On" alone would not say that
                // link taps are now being checked, which is the whole point.
                text = if (granted) {
                    "✅ ${catalog.text(labelKey)} · ${catalog.text(grantedLabel)}"
                } else {
                    catalog.text(labelKey)
                },
                style = MaterialTheme.typography.bodyMedium,
            )
            if (!granted) {
                Text(
                    text = catalog.text(whyKey),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (!granted) {
            TextButton(onClick = onEnable) {
                Text(catalog.text("ui.perm_open_settings"))
            }
        }
    }
}

/** True when the user has ticked us in Settings → Notification access. */
fun Context.hasMailAccess(): Boolean {
    val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        ?: return false
    val me = ComponentName(this, MailNotificationListener::class.java)
    // The stored value is a colon-separated list of flattened ComponentNames.
    // Match on the flattened form rather than substring: "com.appautopsy" alone
    // would also match a differently-named component.
    return flat.split(':').any { ComponentName.unflattenFromString(it) == me }
}

private fun Context.hasPermission(permission: String): Boolean =
    ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

private fun openNotificationListenerSettings(context: Context) {
    // Settings, not Intent: the constant lives on Settings. No runtime dialog
    // exists for this permission, so a settings page is the only door.
    runCatching { context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)) }
}

private fun openNotificationSettings(context: Context) {
    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
    }
    runCatching { context.startActivity(intent) }
}

/**
 * Fallback when the role request cannot be shown. Some OEM builds ship a
 * RoleManager that reports ROLE_BROWSER as available but has no activity to
 * resolve the request — startActivity then throws, and without this the tap
 * would do nothing at all, which is the exact complaint this row exists to fix.
 */
private fun openDefaultAppsSettings(context: Context) {
    runCatching { context.startActivity(LinkHandoff.defaultAppsSettings()) }
        .onFailure { openNotificationSettings(context) }
}

private fun toast(context: Context, message: String) {
    runCatching { Toast.makeText(context, message, Toast.LENGTH_LONG).show() }
}
