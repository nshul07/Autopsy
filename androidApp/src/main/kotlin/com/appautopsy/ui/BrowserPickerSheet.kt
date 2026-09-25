package com.appautopsy.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.ui.scan.LinkHandoff

/**
 * "Which browser should AppAutopsy hand clean links to?"
 *
 * Deliberately our own dialog rather than the system chooser: the system list
 * includes AppAutopsy itself, and picking it would produce a redirect loop
 * instead of a navigation. Filtering ourselves out is why this exists.
 *
 * Shown once, then the answer is remembered — after that a clean link passes
 * through with no UI at all.
 */
@Composable
fun BrowserPickerDialog(
    catalog: Catalog,
    onPicked: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    // The candidate list is derived from installed packages, so it is read
    // once per dialog rather than on every recomposition.
    val browsers = remember(context) { LinkHandoff.installedBrowsers(context) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(catalog.text("ui.browser_pick_title")) },
        text = {
            if (browsers.isEmpty()) {
                // Honest failure: without the manifest <queries> block, or on a
                // device with no browser at all, this list is empty — say so
                // rather than show a blank sheet that looks broken.
                Text(catalog.text("ui.browser_none"))
            } else {
                Column {
                    Text(catalog.text("ui.browser_pick_body"))
                    for (info in browsers) {
                        val pkg = info.activityInfo?.packageName ?: continue
                        Text(
                            text = LinkHandoff.labelFor(context, pkg),
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onPicked(pkg) }
                                .padding(vertical = 12.dp),
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(catalog.text("ui.back"))
            }
        },
    )
}