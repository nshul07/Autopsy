package com.appautopsy.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Lang

/**
 * The language picker from the mockup: a bottom sheet with the three
 * languages, each written in its own script, current one checked.
 *
 * Switching is instant and re-renders every open screen — reports carry keys,
 * never prose, so no re-scan is needed (the i18n contract).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageSheet(catalog: Catalog, current: Lang, onSelect: (Lang) -> Unit, onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState()
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, containerColor = Ink.Card) {
        Column(modifier = Modifier.padding(bottom = 24.dp)) {
            Row(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(modifier = Modifier.size(20.dp)) { GlobeIcon(Ink.Ink2) }
                Spacer(Modifier.width(10.dp))
                Text(
                    text = catalog.text("lang.title"),
                    color = Ink.Ink1,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            Lang.entries.forEach { lang ->
                val name = when (lang) {
                    Lang.EN -> "English"
                    Lang.HI -> "हिन्दी"
                    Lang.PA -> "ਪੰਜਾਬੀ"
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelect(lang); onDismiss() }
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(modifier = Modifier.size(18.dp)) { GlobeIcon(Ink.Ink2) }
                    Spacer(Modifier.width(12.dp))
                    Text(
                        text = name,
                        color = Ink.Ink1,
                        fontSize = 15.sp,
                        modifier = Modifier.weight(1f),
                    )
                    if (lang == current) {
                        Text("✓", color = Ink.Brand, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
