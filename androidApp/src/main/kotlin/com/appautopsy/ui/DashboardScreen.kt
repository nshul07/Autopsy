package com.appautopsy.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.ui.scan.ScanStore
import java.util.concurrent.TimeUnit

/**
 * The dashboard: totals by verdict and a recent-activity feed.
 *
 * Everything here renders from ScanStore, which holds verdict + score +
 * source + time only — no message text, no URL. That is why this screen is
 * safe to show on a projector mid-demo.
 *
 * [tick] exists solely so the caller can force a re-read after a scan lands
 * (SharedPreferences reads are remembered against it).
 */
@Composable
fun DashboardScreen(catalog: Catalog, tick: Long, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    var localTick by remember { mutableLongStateOf(0L) }
    val readTick = tick + localTick // bumps on clear too, forcing a re-read
    val counts = remember(readTick) { ScanStore.counts(context) }
    val recent = remember(readTick) { ScanStore.recent(context, limit = 10) }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = catalog.text("ui.dashboard"),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(top = 16.dp),
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatTile(
                label = catalog.text("ui.total_checked"),
                value = counts["total"] ?: 0,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f),
            )
            StatTile(
                label = catalog.text("ui.flagged_red"),
                value = counts["red"] ?: 0,
                color = RiskRed,
                modifier = Modifier.weight(1f),
            )
            StatTile(
                label = catalog.text("ui.warned_yellow"),
                value = counts["yellow"] ?: 0,
                color = RiskYellow,
                modifier = Modifier.weight(1f),
            )
            StatTile(
                label = catalog.text("ui.looked_clean"),
                value = counts["green"] ?: 0,
                color = RiskGreen,
                modifier = Modifier.weight(1f),
            )
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
            ),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = catalog.text("ui.recent_activity"),
                    style = MaterialTheme.typography.titleMedium,
                )
                if (recent.isEmpty()) {
                    Text(
                        text = catalog.text("ui.no_activity"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    recent.forEach { rec ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            // Icon + word + color: never color alone (§12).
                            Text(
                                text = when (rec.verdict) {
                                    "red" -> "⛔"
                                    "yellow" -> "⚠️"
                                    else -> "✅"
                                },
                                modifier = Modifier.size(20.dp),
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${catalog.text("verdict.${rec.verdict}")} · ${rec.score}",
                                    style = MaterialTheme.typography.bodyMedium,
                                )
                                Text(
                                    text = relativeTime(catalog, rec.atMillis),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Text(
                                text = catalog.text("ui.source_${rec.source.name.lowercase()}"),
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
                Text(
                    text = catalog.text("ui.history_privacy"),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (recent.isNotEmpty()) {
                    TextButton(onClick = {
                        ScanStore.clear(context)
                        localTick++
                    }) {
                        Text(catalog.text("ui.clear_history"))
                    }
                }
            }
        }
    }
}

@Composable
private fun StatTile(label: String, value: Int, color: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = CircleShape,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = value.toString(),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = color,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** Clock use is UI-side only — the scoring path never sees a timestamp. */
private fun relativeTime(catalog: Catalog, atMillis: Long): String {
    val delta = System.currentTimeMillis() - atMillis
    val mins = TimeUnit.MILLISECONDS.toMinutes(delta)
    return when {
        mins < 1 -> catalog.text("ui.time_now")
        mins < 60 -> "${mins}m"
        TimeUnit.MILLISECONDS.toHours(delta) < 24 -> "${TimeUnit.MILLISECONDS.toHours(delta)}h"
        else -> "${TimeUnit.MILLISECONDS.toDays(delta)}d"
    }
}
