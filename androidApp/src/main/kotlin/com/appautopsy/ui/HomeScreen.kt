package com.appautopsy.ui

import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.ui.scan.ScanStore

/**
 * The Home tab: the four counters from the mockup, the automated-guard card,
 * the three scan doors, and a recent feed.
 *
 * Everything renders from ScanStore, which holds verdict + score + source +
 * time (+ link host label) only — no message text, no full URL. That is why
 * this screen is safe to show on a projector mid-demo.
 *
 * [tick] exists so the caller can force a re-read after a scan lands.
 */
@Composable
fun HomeScreen(
    catalog: Catalog,
    tick: Long,
    onScanLink: () -> Unit,
    onScanMessage: () -> Unit,
    onScanApk: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenReport: (ScanStore.Record) -> Unit,
    onLanguage: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    var localTick by remember { mutableLongStateOf(0L) }
    val readTick = tick + localTick
    val counts = remember(readTick) { ScanStore.counts(context) }
    val recent = remember(readTick) { ScanStore.recent(context, limit = 3) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Ink.Canvas)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        TopBar(title = catalog.text("app.name"), catalog = catalog) {
            LanguageChip(catalog = catalog, onClick = onLanguage)
        }

        // The four counters.
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatTile(
                value = counts["total"] ?: 0,
                label = catalog.text("ui.total_checked"),
                accent = Ink.Brand,
                symbol = "✓",
                modifier = Modifier.weight(1f),
            )
            StatTile(
                value = counts["red"] ?: 0,
                label = catalog.text("ui.flagged_red"),
                accent = Ink.Red,
                symbol = "!",
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatTile(
                value = counts["yellow"] ?: 0,
                label = catalog.text("ui.warned_yellow"),
                accent = Ink.Amber,
                symbol = "!",
                modifier = Modifier.weight(1f),
            )
            StatTile(
                value = counts["green"] ?: 0,
                label = catalog.text("ui.looked_clean"),
                accent = Ink.Green,
                symbol = "✓",
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(18.dp))

        // The three scan doors.
        ScanOptionCard(
            icon = { c -> LinkIcon(c) },
            iconTint = Ink.Brand,
            iconWell = Ink.BrandSoft,
            title = catalog.text("scan.link"),
            subtitle = catalog.text("scan.link_sub"),
            onClick = onScanLink,
        )
        Spacer(Modifier.height(10.dp))
        ScanOptionCard(
            icon = { c -> MessageIcon(c) },
            iconTint = Ink.Brand,
            iconWell = Ink.BrandSoft,
            title = catalog.text("scan.message"),
            subtitle = catalog.text("scan.message_sub"),
            onClick = onScanMessage,
        )
        Spacer(Modifier.height(10.dp))
        ScanOptionCard(
            icon = { c -> ApkIcon(c) },
            iconTint = Ink.Green,
            iconWell = Ink.GreenTint,
            title = catalog.text("scan.apk"),
            subtitle = catalog.text("scan.apk_sub"),
            badge = catalog.text("scan.apk_soon"),
            onClick = onScanApk,
        )

        // Recent feed.
        Spacer(Modifier.height(20.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = catalog.text("ui.recent_activity"),
                color = Ink.Ink1,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
            )
            if (recent.isNotEmpty()) {
                TextButton(onClick = onOpenHistory) {
                    Text(catalog.text("history.title"), color = Ink.Brand, fontSize = 13.sp)
                }
            }
        }
        if (recent.isEmpty()) {
            Text(
                text = catalog.text("ui.no_activity"),
                color = Ink.Ink2,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 2.dp),
            )
        } else {
            recent.forEach { rec ->
                RecentRow(rec, catalog, onClick = { onOpenReport(rec) })
                Spacer(Modifier.height(6.dp))
            }
        }

        Spacer(Modifier.height(16.dp))
        PermissionsCard(catalog = catalog)
        Spacer(Modifier.height(12.dp))
        Disclaimer(catalog)
        Text("", modifier = Modifier.padding(bottom = 24.dp))
    }
}
