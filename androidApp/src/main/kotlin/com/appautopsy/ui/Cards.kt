package com.appautopsy.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Lang

/**
 * The paste box: one field takes links, SMS, WhatsApp forwards or emails.
 * Nothing here is stored — the text is scanned and dropped (privacy contract).
 */
@Composable
fun MessageCheckCard(catalog: Catalog, onSubmit: (String) -> Unit) {
    var text by remember { mutableStateOf("") }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            OutlinedTextField(
                value = text,
                onValueChange = { if (it.length <= 4000) text = it },
                label = { Text(catalog.text("ui.paste_hint")) },
                minLines = 3,
                maxLines = 8,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = { onSubmit(text) },
                enabled = text.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(catalog.text("ui.check_now"))
            }
        }
    }
}

/**
 * Verdict word next to its band — kept as a tiny helper so the result screen
 * stays declarative.
 */
@Composable
fun ScoreRow(score: Int, bandId: String, catalog: Catalog) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = "Risk score: $score / 100", style = MaterialTheme.typography.titleMedium)
        Text(
            text = catalog.text("verdict.${bandToVerdict(bandId)}"),
            style = MaterialTheme.typography.titleMedium,
        )
    }}

private fun bandToVerdict(bandId: String): String = when (bandId) {
    "high" -> "red"
    "medium" -> "yellow"
    else -> "green"
}

@Composable
fun SignalList(
    catalog: Catalog,
    signals: List<Pair<String, Map<String, String>>>,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        signals.forEach { (key, params) ->
            Text(
                text = "• ${catalog.text(key, params)}",
                style = MaterialTheme.typography.bodyMedium,
                overflow = TextOverflow.Visible,
            )
        }
    }
}
