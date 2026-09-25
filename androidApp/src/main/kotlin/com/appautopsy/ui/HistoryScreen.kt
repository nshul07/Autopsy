package com.appautopsy.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.ui.scan.ScanStore
import java.util.concurrent.TimeUnit

/**
 * The History tab: every scan, newest first, with filter chips and a trash
 * button. Rows show host-or-source + verdict word + relative time — never
 * message text, never a full URL (the privacy contract at rest).
 */
@Composable
fun HistoryScreen(
    catalog: Catalog,
    tick: Long,
    onOpenReport: (ScanStore.Record) -> Unit,
) {
    val context = LocalContext.current
    var localTick by remember { mutableLongStateOf(0L) }
    var filter by remember { mutableStateOf(0) } // 0 all, 1 links, 2 messages
    var confirmClear by remember { mutableStateOf(false) }

    val all = remember(tick + localTick) { ScanStore.recent(context, limit = 200) }
    val rows = when (filter) {
        1 -> all.filter { it.source == ScanStore.Source.LINK }
        2 -> all.filter { it.source != ScanStore.Source.LINK }
        else -> all
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink.Canvas)
            .padding(horizontal = 16.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = catalog.text("history.title"),
                color = Ink.Ink1,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
            )
            if (all.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { confirmClear = true },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Filled.Delete, catalog.text("ui.clear_history"), tint = Ink.Ink2)
                }
            }
        }

        // Filter chips.
        val chips = listOf("history.filter_all", "scan.link", "scan.message")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            chips.forEachIndexed { i, key ->
                val on = filter == i
                Text(
                    text = catalog.text(key),
                    color = if (on) Color.White else Ink.Ink2,
                    fontSize = 13.sp,
                    fontWeight = if (on) FontWeight.SemiBold else FontWeight.Normal,
                    modifier = Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (on) Ink.Navy else Ink.Card)
                        .clickable { filter = i }
                        .padding(horizontal = 14.dp, vertical = 7.dp),
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        if (rows.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.TopStart,
            ) {
                Text(
                    text = catalog.text(if (all.isEmpty()) "ui.no_activity" else "history.empty"),
                    color = Ink.Ink2,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(top = 40.dp),
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(rows, key = { it.atMillis.toString() + it.hashCode() }) { rec ->
                    HistoryRow(rec, catalog, onClick = { onOpenReport(rec) })
                }
                item {
                    Text(
                        text = catalog.text("ui.history_privacy"),
                        color = Ink.Ink3,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(vertical = 12.dp),
                    )
                }
            }
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            title = { Text(catalog.text("ui.clear_history")) },
            text = { Text(catalog.text("ui.history_privacy")) },
            confirmButton = {
                TextButton(onClick = {
                    ScanStore.clear(context)
                    localTick++
                    confirmClear = false
                }) { Text(catalog.text("ui.clear_history"), color = Ink.Red) }
            },
            dismissButton = {
                TextButton(onClick = { confirmClear = false }) {
                    Text(catalog.text("ui.back"), color = Ink.Ink2)
                }
            },
        )
    }
}

@Composable
private fun HistoryRow(rec: ScanStore.Record, catalog: Catalog, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Ink.Card),
        border = androidx.compose.foundation.BorderStroke(1.dp, Ink.Line),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val tint = styleFor(runCatching { com.appautopsy.analysis.model.Verdict.fromId(rec.verdict) }
                .getOrDefault(com.appautopsy.analysis.model.Verdict.GREEN)).accent
            Box(modifier = Modifier.size(20.dp)) {
                if (rec.source == ScanStore.Source.LINK) LinkIcon(tint) else MessageIcon(tint)
            }
            Spacer(Modifier.size(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = rec.label ?: catalog.text("ui.source_${rec.source.name.lowercase()}"),
                    color = Ink.Ink1,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                )
                Text(
                    text = relativeTime(catalog, rec.atMillis),
                    color = Ink.Ink3,
                    fontSize = 11.sp,
                )
            }
            VerdictDot(runCatching { com.appautopsy.analysis.model.Verdict.fromId(rec.verdict) }
                .getOrDefault(com.appautopsy.analysis.model.Verdict.GREEN))
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
