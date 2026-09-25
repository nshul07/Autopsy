package com.appautopsy.watch

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.appautopsy.AppAutopsyApp
import com.appautopsy.MainActivity
import com.appautopsy.analysis.message.checkMessage
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.ui.scan.ScanStore

/**
 * Incoming SMS → analyze → warn, all on-device.
 *
 * The message body is read, scanned, and discarded; only the verdict and the
 * signal keys ever reach the notification. That is the privacy contract of
 * F23 enforced at the one place it could actually be violated.
 *
 * Green mail stays silent: a warning per message would train the user to
 * ignore us. Only yellow and red get a notification.
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != "android.provider.Telephony.SMS_RECEIVED") return
        val bundle = intent.getBundleExtra("pdus") ?: return
        @Suppress("DEPRECATION")
        val pdus = bundle.getParcelableArray("pdus") ?: return

        // Reassemble multipart SMS bodies. The array's elements are the raw
        // PDU bytes — SmsMessage.createFromPdu's documented input.
        val body = StringBuilder()
        for (pdu in pdus) {
            @Suppress("DEPRECATION")
            val message = runCatching {
                android.telephony.SmsMessage.createFromPdu(pdu as ByteArray)
            }.getOrNull()
            body.append(message?.messageBody ?: "")
        }
        analyzeAndWarn(context, body.toString(), sourceLabel = "SMS", storeAs = ScanStore.Source.SMS)
    }

    companion object {
        /** Alias so the channel id keeps one definition, in RiskNotifier. */
        const val CHANNEL_ID = RiskNotifier.CHANNEL_ID

        /** Shared by the notification listener: one warn path, one behavior. */
        fun analyzeAndWarn(
            context: Context,
            text: String,
            sourceLabel: String,
            storeAs: ScanStore.Source,
        ) {
            if (text.isBlank()) return
            val container = AppAutopsyApp.container
            val report = runCatching { checkMessage(text, container.rules) }.getOrNull()
                ?: return
            val verdict = Verdict.fromId(report.verdictId)
            // Every auto-scan counts on the dashboard — a clean message was
            // still a checked message. Only the *notification* is suppressed.
            ScanStore.record(context, verdict, report.score, storeAs)
            if (verdict == Verdict.GREEN) return // silent unless risky

            val catalog = container.catalog
            val openIntent = PendingIntent.getActivity(
                context,
                sourceLabel.hashCode(),
                Intent(context, MainActivity::class.java).apply {
                    putExtra(MainActivity.EXTRA_PASTE, text)
                    action = Intent.ACTION_VIEW
                },
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

            // Body: the message's own signals plus any link findings, all
            // localized. Never the message text itself — F23's hard rule.
            val reasons = report.signals.map { catalog.text(it) } +
                report.links.flatMap { link ->
                    link.reasons.map { (key, params) -> catalog.text(key, params) }
                }

            RiskNotifier.show(
                context = context,
                notificationId = RiskNotifier.idFor(sourceLabel, text.trim()),
                content = RiskNotifier.Content(
                    sourceLabel = sourceLabel,
                    verdict = verdict,
                    verdictWord = catalog.text("verdict.${verdict.id}"),
                    score = report.score,
                    reasons = reasons.distinct(),
                    // No escape hatch here: there is no single URL the user
                    // tapped, and offering "open anyway" on a message would
                    // invite them into the very link being warned about.
                    openAnywayLabel = null,
                    openAnywayUrl = null,
                ),
                contentIntent = openIntent,
            )
        }
    }
}
