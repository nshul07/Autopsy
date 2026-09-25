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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.ui.scan.ScanStore

/**
 * The three scan entry screens from the mockup: the hub (Scan tab), the link
 * scanner and the message scanner.
 *
 * These are the *manual* doors. The automated doors (tapped link, SMS, mail,
 * share sheet) bypass this UI entirely and land straight on the result — the
 * hub exists for the user who came to us on purpose.
 */

@Composable
fun TopBar(
    title: String,
    catalog: Catalog,
    onBack: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (onBack != null) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onBack),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, catalog.text("ui.back"), tint = Ink.Ink1)
            }
            Spacer(Modifier.width(6.dp))
        }
        Text(
            text = title,
            color = Ink.Ink1,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f),
        )
        actions()
    }
}

/** The Scan tab: hero card + the three doors. */
@Composable
fun ScanHubScreen(
    catalog: Catalog,
    onScanLink: () -> Unit,
    onScanMessage: () -> Unit,
    onScanApk: () -> Unit,
    tick: Long,
) {
    val context = LocalContext.current
    val recent = remember(tick) { ScanStore.recent(context, limit = 4) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink.Canvas)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        TopBar(catalog.text("nav.scan"), catalog)

        // Hero: the promise, in the navy card from the mockup.
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = Ink.Navy),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.White.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Box(modifier = Modifier.size(26.dp)) { LinkIcon(Color.White) }
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = catalog.text("scan.title"),
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = catalog.text("scan.hub_body"),
                        color = Color.White.copy(alpha = 0.75f),
                        fontSize = 12.sp,
                        lineHeight = 16.sp,
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))
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

        if (recent.isNotEmpty()) {
            Spacer(Modifier.height(22.dp))
            Text(
                text = catalog.text("ui.recent_activity"),
                color = Ink.Ink1,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            recent.forEach { rec ->
                RecentRow(rec, catalog)
                Spacer(Modifier.height(6.dp))
            }
        }
        Spacer(Modifier.height(20.dp))
    }
}

/** One recent-scan row: icon + label (host, or source word) + verdict dot. */
@Composable
fun RecentRow(rec: ScanStore.Record, catalog: Catalog, onClick: (() -> Unit)? = null) {
    val verdict = runCatching { Verdict.fromId(rec.verdict) }.getOrDefault(Verdict.GREEN)
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Ink.Card),
        border = androidx.compose.foundation.BorderStroke(1.dp, Ink.Line),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 11.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val tint = styleFor(verdict).accent
            Box(modifier = Modifier.size(20.dp)) {
                when (rec.source) {
                    ScanStore.Source.LINK -> LinkIcon(tint)
                    ScanStore.Source.SMS -> MessageIcon(tint)
                    ScanStore.Source.MAIL -> MessageIcon(tint)
                    ScanStore.Source.MANUAL -> MessageIcon(Ink.Ink3)
                }
            }
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = rec.label ?: catalog.text("ui.source_${rec.source.name.lowercase()}"),
                    color = Ink.Ink1,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                )
                Text(
                    text = "${catalog.text("verdict.${rec.verdict}")} · ${rec.score}",
                    color = Ink.Ink3,
                    fontSize = 11.sp,
                )
            }
            VerdictDot(verdict)
        }
    }
}

/** The link scanner. */
@Composable
fun LinkScanScreen(
    catalog: Catalog,
    onBack: () -> Unit,
    onSubmit: (String) -> Unit,
    tick: Long,
) {
    val context = LocalContext.current
    var url by remember { mutableStateOf("") }
    val recent = remember(tick) {
        ScanStore.recent(context, limit = 5).filter { it.source == ScanStore.Source.LINK }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink.Canvas)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        TopBar(catalog.text("scan.link"), catalog, onBack = onBack)

        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(16.dp))
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(Ink.BrandSoft),
                contentAlignment = Alignment.Center,
            ) {
                Box(modifier = Modifier.size(34.dp)) { LinkIcon(Ink.Brand) }
            }
            Spacer(Modifier.height(14.dp))
            Text(
                text = catalog.text("scan.link"),
                color = Ink.Ink1,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = catalog.text("scan.link_sub"),
                color = Ink.Ink2,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        Spacer(Modifier.height(22.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Ink.Card),
            border = androidx.compose.foundation.BorderStroke(1.dp, Ink.Line),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(modifier = Modifier.size(18.dp)) { LinkIcon(Ink.Ink3) }
                Spacer(Modifier.width(10.dp))
                BasicTextField(
                    value = url,
                    onValueChange = { if (it.length <= 2000) url = it },
                    singleLine = true,
                    textStyle = TextStyle(color = Ink.Ink1, fontSize = 15.sp),
                    cursorBrush = SolidColor(Ink.Brand),
                    modifier = Modifier.weight(1f),
                    decorationBox = { inner ->
                        Box(contentAlignment = Alignment.CenterStart) {
                            if (url.isEmpty()) {
                                Text(
                                    "https://example.com",
                                    color = Ink.Ink3,
                                    fontSize = 15.sp,
                                )
                            }
                            inner()
                        }
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                )
                if (url.isNotEmpty()) {
                    Icon(
                        Icons.Filled.Close,
                        contentDescription = null,
                        tint = Ink.Ink3,
                        modifier = Modifier
                            .size(18.dp)
                            .clip(CircleShape)
                            .clickable { url = "" },
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        Button(
            onClick = { if (url.isNotBlank()) onSubmit(url.trim()) },
            enabled = url.isNotBlank(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Ink.Navy,
                contentColor = Color.White,
                disabledContainerColor = Ink.Line,
                disabledContentColor = Ink.Ink3,
            ),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
        ) {
            Text(catalog.text("scan.link"), fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        }

        if (recent.isNotEmpty()) {
            Spacer(Modifier.height(24.dp))
            Text(
                text = catalog.text("ui.recent_activity"),
                color = Ink.Ink1,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            recent.forEach {
                RecentRow(it, catalog)
                Spacer(Modifier.height(6.dp))
            }
        }
        Spacer(Modifier.height(20.dp))
    }
}

/** The message scanner. */
@Composable
fun MessageScanScreen(
    catalog: Catalog,
    onBack: () -> Unit,
    onSubmit: (String) -> Unit,
    tick: Long,
) {
    val context = LocalContext.current
    var text by remember { mutableStateOf("") }
    val recent = remember(tick) {
        ScanStore.recent(context, limit = 5).filter { it.source != ScanStore.Source.LINK }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink.Canvas)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        TopBar(catalog.text("scan.message"), catalog, onBack = onBack)

        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(16.dp))
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(Ink.BrandSoft),
                contentAlignment = Alignment.Center,
            ) {
                Box(modifier = Modifier.size(34.dp)) { MessageIcon(Ink.Brand) }
            }
            Spacer(Modifier.height(14.dp))
            Text(
                text = catalog.text("scan.message"),
                color = Ink.Ink1,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = catalog.text("scan.message_sub"),
                color = Ink.Ink2,
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        Spacer(Modifier.height(22.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = Ink.Card),
            border = androidx.compose.foundation.BorderStroke(1.dp, Ink.Line),
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                BasicTextField(
                    value = text,
                    onValueChange = { if (it.length <= 1000) text = it },
                    textStyle = TextStyle(color = Ink.Ink1, fontSize = 15.sp, lineHeight = 22.sp),
                    cursorBrush = SolidColor(Ink.Brand),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    decorationBox = { inner ->
                        Box(contentAlignment = Alignment.TopStart) {
                            if (text.isEmpty()) {
                                Text(
                                    catalog.text("ui.paste_hint"),
                                    color = Ink.Ink3,
                                    fontSize = 15.sp,
                                )
                            }
                            inner()
                        }
                    },
                )
                Text(
                    text = "${text.length}/1000",
                    color = Ink.Ink3,
                    fontSize = 11.sp,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 6.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.End,
                )
            }
        }

        Spacer(Modifier.height(14.dp))
        Button(
            onClick = { if (text.isNotBlank()) onSubmit(text.trim()) },
            enabled = text.isNotBlank(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Ink.Navy,
                contentColor = Color.White,
                disabledContainerColor = Ink.Line,
                disabledContentColor = Ink.Ink3,
            ),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
        ) {
            Text(catalog.text("scan.message"), fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        }

        if (recent.isNotEmpty()) {
            Spacer(Modifier.height(24.dp))
            Text(
                text = catalog.text("ui.recent_activity"),
                color = Ink.Ink1,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            recent.forEach {
                RecentRow(it, catalog)
                Spacer(Modifier.height(6.dp))
            }
        }
        Spacer(Modifier.height(20.dp))
    }
}
