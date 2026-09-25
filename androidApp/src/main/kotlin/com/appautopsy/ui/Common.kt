package com.appautopsy.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.TextButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Lang
import com.appautopsy.analysis.model.Verdict

/** The verdict chip: icon + word + color, never color alone (§12 hard rule). */
@Composable
fun VerdictBanner(verdict: Verdict, catalog: Catalog, modifier: Modifier = Modifier) {
    val (symbol, color) = when (verdict) {
        Verdict.GREEN -> "✅" to RiskGreen
        Verdict.YELLOW -> "⚠️" to RiskYellow
        Verdict.RED -> "⛔" to RiskRed
    }
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(text = symbol, style = MaterialTheme.typography.headlineSmall)
            Text(
                text = catalog.text("verdict.${verdict.id}"),
                style = MaterialTheme.typography.titleLarge,
                color = color,
                textAlign = TextAlign.Start,
            )
        }
    }
}

/**
 * The disclaimer. Mandatory on every result surface, rendered from the catalog
 * so it localizes with the rest.
 */
@Composable
fun Disclaimer(catalog: Catalog, modifier: Modifier = Modifier) {
    Text(
        text = catalog.text("disclaimer"),
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = modifier.padding(top = 16.dp, bottom = 8.dp),
    )
}

@Composable
fun LanguageToggle(current: Lang, onSelect: (Lang) -> Unit, modifier: Modifier = Modifier) {
    Row(modifier = modifier) {
        Lang.entries.forEach { lang ->
            TextButton(onClick = { onSelect(lang) }) {
                Text(
                    text = when (lang) {
                        Lang.EN -> "EN"
                        Lang.HI -> "हि"
                        Lang.PA -> "ਪ"
                    },
                    fontWeight = if (lang == current) {
                        androidx.compose.ui.text.font.FontWeight.Bold
                    } else {
                        androidx.compose.ui.text.font.FontWeight.Normal
                    },
                )
            }
        }
    }
}
