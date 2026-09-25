package com.appautopsy.watch

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.appautopsy.ui.scan.LinkHandoff

/**
 * The "Open anyway" escape hatch on a held-link warning.
 *
 * This lives in a receiver rather than in the notification's content intent
 * because a content tap should show the verdict, not bypass it: the whole
 * point of holding a red link is that the user has to look at it once. This
 * action is the deliberate second tap that says "I read that, open it".
 *
 * A user-initiated notification action is one of the documented exemptions
 * from the background-activity-launch restriction, so starting the browser
 * from here is allowed — and [LinkHandoff] still refuses to open anything in
 * our own package, so the escape hatch can never loop back into the scan.
 */
class HandoffReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_OPEN_ANYWAY) return
        val url = intent.getStringExtra(EXTRA_URL) ?: return
        // open() targets the remembered real browser explicitly. If the user
        // has not picked one yet it returns false and we simply do nothing:
        // silently firing an implicit intent here could resolve back to us.
        LinkHandoff.open(context.applicationContext, url)
    }

    companion object {
        const val ACTION_OPEN_ANYWAY = "com.appautopsy.action.OPEN_ANYWAY"
        private const val EXTRA_URL = "com.appautopsy.extra.OPEN_URL"

        fun pendingIntent(context: Context, url: String, requestCode: Int): PendingIntent {
            val intent = Intent(context, HandoffReceiver::class.java).apply {
                action = ACTION_OPEN_ANYWAY
                putExtra(EXTRA_URL, url)
            }
            // FLAG_IMMUTABLE: nothing outside this app may rewrite the URL the
            // user is about to open. FLAG_UPDATE_CURRENT so re-scanning the
            // same link points the action at the newer URL.
            return PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )
        }
    }
}