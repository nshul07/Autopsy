package com.appautopsy.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.ui.scan.ScanResult

/**
 * The result surface: verdict banner, score, every named signal, per-link
 * breakdown, disclaimer. Rendered from reason keys, so the language toggle
 * re-renders it instantly without re-running any analysis.
 */
@Composable
fun ResultScreen(
    catalog: Catalog,
    lang: com.appautopsy.analysis.model.Lang,
    result: ScanResult,
    onBack: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (result is ScanResult.Rejected) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = catalog.text(result.reasonKey),
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
            TextButton(onClick = onBack) { Text(catalog.text("ui.back")) }
            return@Column
        }

        VerdictBanner(verdict = result.verdict, catalog = catalog)
        ScoreRow(score = result.score, bandId = result.bandId, catalog = catalog)

        when (result) {
            is ScanResult.Link -> {
                SignalCard(
                    title = catalog.text("ui.why"),
                    catalog = catalog,
                    signals = result.report.reasons,
                )
                val notChecked = result.report.checks
                    .filter { it.status == com.appautopsy.analysis.link.CheckStatus.NOT_CHECKED }
                if (notChecked.isNotEmpty()) {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text(
                                text = catalog.text("ui.could_not_check"),
                                style = MaterialTheme.typography.titleMedium,
                            )
                            notChecked.forEach {
                                Text(
                                    text = "— ${it.id}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            }

            is ScanResult.Message -> {
                if (result.report.signals.isNotEmpty()) {
                    SignalCard(
                        title = catalog.text("ui.why"),
                        catalog = catalog,
                        signals = result.report.signals.map { it to emptyMap() },
                    )
                }
                result.report.links.forEachIndexed { i, link ->
                    SignalCard(
                        title = "${catalog.text("ui.links_analyzed")} ${i + 1}",
                        catalog = catalog,
                        signals = link.reasons,
                    )
                }
                if (result.report.linksCapped) {
                    Text(
                        text = catalog.text("ui.links_more"),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            else -> {}
        }

        Disclaimer(catalog = catalog)
        TextButton(onClick = onBack, modifier = Modifier.padding(bottom = 24.dp)) {
            Text(catalog.text("ui.check_another"))
        }
    }
}

@Composable
private fun SignalCard(
    title: String,
    catalog: Catalog,
    signals: List<Pair<String, Map<String, String>>>,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            if (signals.isEmpty()) {
                Text(
                    text = catalog.text("ui.no_signals"),
                    style = MaterialTheme.typography.bodyMedium,
                )
            } else {
                SignalList(catalog = catalog, signals = signals)
            }
        }
    }
}
