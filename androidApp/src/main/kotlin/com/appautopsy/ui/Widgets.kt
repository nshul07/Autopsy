package com.appautopsy.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Lang
import com.appautopsy.analysis.model.Verdict

/**
 * The shared vocabulary of the v4 screens, matching the product mockup:
 * tinted verdict banner with icon + word + score, white stat tiles,
 * option cards with a tinted icon well, and reason rows.
 *
 * Every verdict cue here is icon + word + color together — never color alone
 * (§12), which is also why the banner spells "RED" as a word.
 */

/** Verdict → the (color, tint, symbol, risk-word key) triple used everywhere. */
data class VerdictStyle(
    val accent: Color,
    val tint: Color,
    val symbol: String,
    val riskKey: String,
)

fun styleFor(verdict: Verdict): VerdictStyle = when (verdict) {
    Verdict.RED -> VerdictStyle(Ink.Red, Ink.RedTint, "!", "result.high_risk")
    Verdict.YELLOW -> VerdictStyle(Ink.Amber, Ink.AmberTint, "!", "result.medium_risk")
    Verdict.GREEN -> VerdictStyle(Ink.Green, Ink.GreenTint, "✓", "result.low_risk")
}

@Composable
fun VerdictBanner(
    verdict: Verdict,
    score: Int,
    catalog: Catalog,
    modifier: Modifier = Modifier,
) {
    val s = styleFor(verdict)
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = s.tint),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(s.accent),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = s.symbol,
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                )
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = catalog.text("verdict.${verdict.id}").uppercase(),
                    color = s.accent,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                )
                Text(
                    text = catalog.text(s.riskKey),
                    color = Ink.Ink2,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            Column(
                modifier = Modifier.wrapContentWidth(),
                horizontalAlignment = Alignment.End,
            ) {
                Text(
                    text = "$score / 100",
                    color = Ink.Ink1,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = catalog.text("result.risk_score"),
                    color = Ink.Ink3,
                    style = MaterialTheme.typography.labelMedium,
                )
            }
        }
    }
}

/** One row in "Why this was flagged": bullet circle + localized sentence. */
@Composable
fun ReasonRow(text: String, accent: Color, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .padding(top = 3.dp)
                .size(14.dp)
                .clip(CircleShape)
                .background(accent.copy(alpha = 0.14f)),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(accent),
            )
        }
        Spacer(Modifier.width(10.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = Ink.Ink1,
            modifier = Modifier.weight(1f),
        )
    }
}

/** Home-screen stat tile: verdict dot + big number + label — icon + word + color. */
@Composable
fun StatTile(
    value: Int,
    label: String,
    accent: Color,
    symbol: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Ink.Card),
        border = BorderStroke(1.dp, Ink.Line),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.Start,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .clip(CircleShape)
                        .background(accent.copy(alpha = 0.14f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(symbol, color = accent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.width(6.dp))
                Text(
                    text = value.toString(),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = Ink.Ink1,
                )
            }
            Spacer(Modifier.height(4.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = Ink.Ink2,
            )
        }
    }
}

/** The scan-hub option card: icon well + title + subtitle + chevron. */
@Composable
fun ScanOptionCard(
    icon: @Composable (Color) -> Unit,
    iconTint: Color,
    iconWell: Color,
    title: String,
    subtitle: String,
    badge: String? = null,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Ink.Card),
        border = BorderStroke(1.dp, Ink.Line),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(iconWell),
                contentAlignment = Alignment.Center,
            ) {
                Box(modifier = Modifier.size(26.dp)) { icon(iconTint) }
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = Ink.Ink1,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = Ink.Ink2,
                )
            }
            if (badge != null) {
                Text(
                    text = badge,
                    style = MaterialTheme.typography.labelSmall,
                    color = Ink.Ink3,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Ink.Canvas)
                        .padding(horizontal = 8.dp, vertical = 3.dp),
                )
            } else {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = Ink.Ink3,
                    modifier = Modifier.size(18.dp),
                )
            }
        }
    }
}

/** A small filled verdict dot — for list rows; the row itself carries the word. */
@Composable
fun VerdictDot(verdict: Verdict, modifier: Modifier = Modifier, size: androidx.compose.ui.unit.Dp = 22.dp) {
    val s = styleFor(verdict)
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(s.accent),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = s.symbol,
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

/** Bottom navigation: Home / Scan / History, matching the mockup's bar. */
@Composable
fun BottomBar(
    selected: Int,
    onSelect: (Int) -> Unit,
    catalog: Catalog,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Ink.Card)
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(0.dp),
    ) {
        BottomItem(Icons.Filled.Home, catalog.text("nav.home"), selected == 0) { onSelect(0) }
        BottomItem(Icons.Filled.Search, catalog.text("nav.scan"), selected == 1) { onSelect(1) }
        BottomItem(null, catalog.text("nav.history"), selected == 2, iconDraw = { color ->
            HistoryIcon(color, Modifier.size(22.dp))
        }) { onSelect(2) }
    }
}

@Composable
private fun RowScope.BottomItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector?,
    label: String,
    selected: Boolean,
    iconDraw: (@Composable (Color) -> Unit)? = null,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        val tint = if (selected) Ink.Brand else Ink.Ink3
        if (iconDraw != null) {
            Box(modifier = Modifier.size(22.dp)) { iconDraw(tint) }
        } else if (icon != null) {
            Icon(icon, contentDescription = label, tint = tint, modifier = Modifier.size(22.dp))
        }
        Spacer(Modifier.height(2.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = tint,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        )
    }
}

/** Language chip for the top bar: globe + current language name. */
@Composable
fun LanguageChip(catalog: Catalog, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        GlobeIcon(Ink.Ink2, Modifier.size(16.dp))
        Spacer(Modifier.width(4.dp))
        Text(
            text = when (catalog.lang) {
                Lang.EN -> "English"
                Lang.HI -> "हिन्दी"
                Lang.PA -> "ਪੰਜਾਬੀ"
            },
            style = MaterialTheme.typography.labelLarge,
            color = Ink.Ink2,
        )
    }
}

@Composable
fun ShareButton(onShare: () -> Unit, contentDescription: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(36.dp)
            .clip(CircleShape)
            .clickable(onClick = onShare),
        contentAlignment = Alignment.Center,
    ) {
        Icon(Icons.Filled.Share, contentDescription, tint = Ink.Ink2, modifier = Modifier.size(20.dp))
    }
}
