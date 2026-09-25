package com.appautopsy.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.ui.scan.ScanResult
import com.appautopsy.ui.scan.scanReasonTexts

/**
 * The result surface, matching the mockup: tinted verdict banner with the
 * score, the scanned subject (with copy for links), every named signal as an
 * icon+word row, the honest "could not check" list, and the disclaimer.
 *
 * [originalText] is shown for message scans only, for this one screen — it is
 * never written to storage. A message's text is the user's; the verdict is
 * ours.
 */
@Composable
fun ResultScreen(
    catalog: Catalog,
    result: ScanResult,
    originalText: String?,
    onBack: () -> Unit,
) {
    val context = LocalContext.current

    if (result is ScanResult.Rejected) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Ink.Canvas)
                .padding(horizontal = 16.dp),
        ) {
            TopBar(catalog.text("result.title"), catalog, onBack = onBack)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Ink.AmberTint),
            ) {
                ReasonRow(
                    text = catalog.text(result.reasonKey),
                    accent = Ink.Amber,
                    modifier = Modifier.padding(16.dp),
                )
            }
        }
        return
    }

    val verdict = result.verdict
    val style = styleFor(verdict)
    val reasons = scanReasonTexts(result, catalog, limit = 100)

    val sharePayload: String = remember(result, verdict, reasons) {
        buildShareText(catalog, result, reasons)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink.Canvas)
            .verticalScroll(rememberScrollState()),
    ) {
        TopBar(
            title = catalog.text("result.title"),
            catalog = catalog,
            onBack = onBack,
        ) {
            ShareButton(
                onShare = {
                    val send = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, sharePayload)
                    }
                    runCatching { context.startActivity(Intent.createChooser(send, catalog.text("ui.share"))) }
                },
                contentDescription = catalog.text("ui.share"),
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            VerdictBanner(verdict = verdict, score = result.score, catalog = catalog)

            // The scanned subject.
            when (result) {
                is ScanResult.Link -> ScannedSubject(
                    icon = { c -> LinkIcon(c) },
                    label = catalog.text("result.scanned_link"),
                    value = result.report.inputUrl,
                    copyable = true,
                    catalog = catalog,
                )

                is ScanResult.Message -> ScannedSubject(
                    icon = { c -> MessageIcon(c) },
                    label = catalog.text("result.scanned_message"),
                    value = originalText?.take(220) ?: catalog.text("ui.source_manual"),
                    copyable = false,
                    catalog = catalog,
                )

                else -> {}
            }

            // Why.
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Ink.Card),
                border = androidx.compose.foundation.BorderStroke(1.dp, Ink.Line),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = catalog.text(
                            if (verdict == Verdict.GREEN) "result.why_clean" else "result.why",
                        ),
                        color = Ink.Ink1,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Spacer(Modifier.height(10.dp))
                    if (reasons.isEmpty()) {
                        Text(
                            text = catalog.text("result.no_risky"),
                            color = Ink.Green,
                            fontSize = 14.sp,
                        )
                    } else {
                        reasons.forEachIndexed { i, r ->
                            ReasonRow(text = r, accent = style.accent)
                            if (i != reasons.lastIndex) Spacer(Modifier.height(10.dp))
                        }
                    }
                }
            }

            // Green gets the honest note, not just a checkmark.
            if (verdict == Verdict.GREEN) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Ink.GreenTint),
                ) {
                    ReasonRow(
                        text = catalog.text("result.clean_note"),
                        accent = Ink.Green,
                        modifier = Modifier.padding(14.dp),
                    )
                }
            }

            // Checks that could not run offline — honesty as a feature.
            if (result is ScanResult.Link) {
                val notChecked = result.report.checks
                    .filter { it.status == com.appautopsy.analysis.link.CheckStatus.NOT_CHECKED }
                if (notChecked.isNotEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Ink.Canvas),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Ink.Line),
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = catalog.text("ui.could_not_check"),
                                color = Ink.Ink2,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                            )
                            notChecked.forEach {
                                Text(
                                    text = "— ${it.id}",
                                    color = Ink.Ink3,
                                    fontSize = 12.sp,
                                )
                            }
                        }
                    }
                }
            }

            Disclaimer(catalog)
            TextButton(
                onClick = onBack,
                modifier = Modifier.padding(bottom = 24.dp),
            ) {
                Text(catalog.text("ui.check_another"), color = Ink.Brand, fontSize = 14.sp)
            }
        }
    }
}

@Composable
private fun ScannedSubject(
    icon: @Composable (androidx.compose.ui.graphics.Color) -> Unit,
    label: String,
    value: String,
    copyable: Boolean,
    catalog: Catalog,
) {
    val context = LocalContext.current
    var copied by remember { mutableStateOf(false) }
    Column {
        Text(
            text = label,
            color = Ink.Ink2,
            fontSize = 12.sp,
            modifier = Modifier.padding(bottom = 6.dp),
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Ink.Card),
            border = androidx.compose.foundation.BorderStroke(1.dp, Ink.Line),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(modifier = Modifier.size(18.dp)) { icon(Ink.Brand) }
                Spacer(Modifier.width(10.dp))
                Text(
                    text = value,
                    color = Ink.Ink1,
                    fontSize = 13.sp,
                    maxLines = 2,
                    modifier = Modifier.weight(1f),
                )
                if (copyable) {
                    Spacer(Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                                cm?.setPrimaryClip(ClipData.newPlainText("AppAutopsy", value))
                                copied = true
                                Toast.makeText(context, catalog.text("ui.copied"), Toast.LENGTH_SHORT).show()
                            }
                            .padding(6.dp),
                    ) {
                        Text(
                            text = if (copied) "✓ ${catalog.text("ui.copied")}" else catalog.text("ui.copy"),
                            color = if (copied) Ink.Green else Ink.Ink2,
                            fontSize = 12.sp,
                        )
                    }
                }
            }
        }
    }
}

/**
 * The share payload: verdict, score, host (links only), reasons, disclaimer.
 * Message text is deliberately absent — sharing would hand the user's message
 * to another app, and the privacy contract says the text never leaves the
 * scan that produced the verdict.
 */
private fun buildShareText(catalog: Catalog, result: ScanResult, reasons: List<String>): String {
    val sb = StringBuilder()
    sb.append(catalog.text("app.name")).append(" — ")
    sb.append(catalog.text("verdict.${result.verdict.id}")).append(" (")
    sb.append(result.score).append("/100)\n")
    if (result is ScanResult.Link) {
        sb.append(result.report.inputUrl).append("\n")
    }
    reasons.forEach { sb.append("• ").append(it).append("\n") }
    sb.append("\n").append(catalog.text("disclaimer"))
    return sb.toString()
}
