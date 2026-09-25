package com.appautopsy.watch

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.appautopsy.AppAutopsyApp
import com.appautopsy.MainActivity
import com.appautopsy.analysis.message.checkMessage
import com.appautopsy.analysis.model.Verdict

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
        analyzeAndWarn(context, body.toString(), source = "SMS")
    }

    companion object {
        const val CHANNEL_ID = "appautopsy_alerts"

        /** Shared by the notification listener: one warn path, one behavior. */
        fun analyzeAndWarn(context: Context, text: String, source: String) {
            if (text.isBlank()) return
            val container = AppAutopsyApp.container
            val report = runCatching { checkMessage(text, container.rules) }.getOrNull()
                ?: return
            val verdict = Verdict.fromId(report.verdictId)
            if (verdict == Verdict.GREEN) return // silent unless risky

            val manager = context.getSystemService(NotificationManager::class.java)
            ensureChannel(manager)

            val openIntent = PendingIntent.getActivity(
                context,
                source.hashCode(),
                Intent(context, MainActivity::class.java).apply {
                    putExtra(MainActivity.EXTRA_PASTE, text)
                    action = Intent.ACTION_VIEW
                },
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

            val symbol = when (verdict) {
                Verdict.RED -> "⛔"
                Verdict.YELLOW -> "⚠️"
                Verdict.GREEN -> "✅"
            }
            val reason = report.signals.firstOrNull()?.let { container.catalog.text(it) }
                ?: container.catalog.text("verdict.${verdict.id}")

            manager.notify(
                (text.hashCode() and 0x7fffffff) % 100000,
                NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_alert)
                    .setContentTitle("$symbol $source — ${container.catalog.text("verdict.${verdict.id}")}")
                    .setContentText(reason)
                    .setStyle(NotificationCompat.BigTextStyle().bigText(reason))
                    .setContentIntent(openIntent)
                    .setAutoCancel(true)
                    .build(),
            )
        }

        private fun ensureChannel(manager: NotificationManager) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Phishing alerts",
                NotificationManager.IMPORTANCE_HIGH,
            )
            manager.createNotificationChannel(channel)
        }
    }
}
