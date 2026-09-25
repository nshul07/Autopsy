package com.appautopsy.watch

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import androidx.core.app.NotificationCompat
import com.appautopsy.analysis.model.Verdict

/**
 * The one warning surface. SMS, mail, and a held link all funnel through here
 * so the wording, colour and actions can never disagree with each other.
 *
 * What "professional" means concretely, and why each part is here:
 *
 *  - **Score and band inside the notification.** The user's first question on
 *    seeing a warning is "how bad?", and the answer must not require a tap.
 *  - **Icon + word + colour, never colour alone.** Colour-blind users and
 *    greyscale notification shades both have to work; the symbol and the
 *    localized verdict word carry the meaning, colour only reinforces it.
 *  - **The top reasons as body text, in the user's language.** A warning that
 *    does not say *why* trains people to dismiss it.
 *  - **No message text, ever.** Reasons are localized constants plus params
 *    like a domain or a brand name — the same rule the report model follows.
 */
object RiskNotifier {

    const val CHANNEL_ID = "appautopsy_alerts"

    /** Everything the notifier needs; every string already localized. */
    data class Content(
        val sourceLabel: String,
        val verdict: Verdict,
        val verdictWord: String,
        val score: Int,
        /** Localized reason sentences, most important first. May be empty. */
        val reasons: List<String>,
        /** Localized label for the escape hatch. Null hides the action. */
        val openAnywayLabel: String? = null,
        /** URL the escape hatch opens. Null hides the action. */
        val openAnywayUrl: String? = null,
    )

    fun symbol(verdict: Verdict): String = when (verdict) {
        Verdict.RED -> "⛔"
        Verdict.YELLOW -> "⚠️"
        Verdict.GREEN -> "✅"
    }

    /**
     * Stable id per source+key, so re-scanning the same message replaces its
     * old warning instead of stacking a second copy in the shade.
     */
    fun idFor(sourceLabel: String, key: String): Int =
        ((sourceLabel + key).hashCode() and 0x7fffffff) % 100000

    fun show(
        context: Context,
        notificationId: Int,
        content: Content,
        contentIntent: PendingIntent?,
    ) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        ensureChannel(manager)

        val title = "${symbol(content.verdict)} ${content.sourceLabel} — ${content.verdictWord}"
        val body = content.reasons.take(3).joinToString("\n")
            .ifBlank { content.verdictWord }

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            // A status-bar icon must be a monochrome member of the system set,
            // not app artwork: anything else renders as a white blob.
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setColor(colorFor(content.verdict))
            .setContentTitle(title)
            .setSubText("${content.score}/100")
            .setContentText(body.lineSequence().first())
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)

        if (contentIntent != null) builder.setContentIntent(contentIntent)

        val url = content.openAnywayUrl
        val label = content.openAnywayLabel
        if (url != null && label != null) {
            // An escape hatch, not a recommendation: a guard that can never be
            // overridden gets uninstalled. It runs the same explicit-package
            // handoff as a green link, so it cannot loop back into us.
            builder.addAction(
                0,
                label,
                HandoffReceiver.pendingIntent(context, url, notificationId),
            )
        }

        // A blocked channel or a revoked POST_NOTIFICATIONS permission must not
        // take the scan down with it: the verdict screen is still reachable and
        // the dashboard already counted the scan.
        runCatching { manager.notify(notificationId, builder.build()) }
    }

    private fun colorFor(verdict: Verdict): Int = when (verdict) {
        Verdict.RED -> 0xFFD32F2F.toInt()
        Verdict.YELLOW -> 0xFFF9A825.toInt()
        Verdict.GREEN -> 0xFF2E7D32.toInt()
    }

    /** The same accent the in-app verdict banner uses, so app and shade agree. */
    fun accentFor(verdict: Verdict): Int = colorFor(verdict)

    private fun ensureChannel(manager: NotificationManager) {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Phishing alerts",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Warnings about risky links, messages and email"
            enableLights(true)
            enableVibration(true)
        }
        manager.createNotificationChannel(channel)
    }
}