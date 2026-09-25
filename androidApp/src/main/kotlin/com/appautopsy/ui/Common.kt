package com.appautopsy.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.appautopsy.analysis.catalog.Catalog

/**
 * The disclaimer. Mandatory on every result surface, rendered from the catalog
 * so it localizes with the rest. The mockup shows it as a tinted caution box;
 * the text itself is the catalog string, never edited per-screen.
 */
@Composable
fun Disclaimer(catalog: Catalog, modifier: Modifier = Modifier) {
    ReasonRow(
        text = catalog.text("disclaimer"),
        accent = Ink.Amber,
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
    )
}

/** A centered informational note (the green-result reassurance line). */
@Composable
fun InfoNote(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodySmall,
        color = Ink.Ink2,
        textAlign = TextAlign.Center,
        modifier = modifier.fillMaxWidth().padding(vertical = 8.dp),
    )
}
