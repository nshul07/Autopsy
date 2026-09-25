package com.appautopsy.watch

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Reads incoming-mail notifications (user grants it once in system settings —
 * the same access an app like a smart-watch companion uses).
 *
 * What gets scanned is the notification's *visible text*: sender line +
 * preview. That is where a phishing email's tell lives (mismatched display
 * name, urgency, OTP asks, the link itself). We never open the mail, never
 * fetch anything — Gmail's own sync delivered the notification.
 *
 * Deduped per package+timestamp so an updated notification doesn't re-warn.
 */
class MailNotificationListener : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val extras = sbn.notification?.extras ?: return
        val text = listOf(
            extras.getCharSequence("android.title")?.toString(),
            extras.getCharSequence("android.text")?.toString(),
        ).filterNotNull().joinToString("\n").trim()
        if (text.isEmpty()) return

        // Only act on things that look like mail clients; cheap and avoids
        // scanning every WhatsApp notification twice (SMS path covers texts).
        val pkg = sbn.packageName ?: return
        if (pkg !in MAIL_PACKAGES) return

        SmsReceiver.analyzeAndWarn(
            applicationContext,
            text,
            source = pkgShortName(pkg),
            storeAs = com.appautopsy.ui.scan.ScanStore.Source.MAIL,
        )
    }

    private fun pkgShortName(pkg: String): String = when {
        pkg.contains("gmail") -> "Gmail"
        pkg.contains("outlook") || pkg.contains("hotmail") -> "Outlook"
        pkg.contains("yahoo") -> "Yahoo"
        else -> "Mail"
    }

    companion object {
        private val MAIL_PACKAGES = setOf(
            "com.google.android.gm",
            "com.microsoft.office.outlook",
            "com.yahoo.mobile.client.android.mail",
        )
    }
}
