package com.appautopsy

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Lang
import com.appautopsy.ui.AutopsyTheme
import com.appautopsy.ui.Disclaimer
import com.appautopsy.ui.LanguageToggle
import com.appautopsy.ui.MessageCheckCard
import com.appautopsy.ui.ResultScreen
import com.appautopsy.ui.scan.LinkScanner
import com.appautopsy.ui.scan.ScanResult

/**
 * Single activity. Three doors in, one screen out:
 *  1. launched normally  → paste box
 *  2. ACTION_VIEW (link) / ACTION_SEND (shared text) → auto-scanned
 *  3. tapped alert notification (EXTRA_PASTE) → auto-scanned
 * All three land on the same ResultScreen rendered from reason keys, so the
 * language toggle re-renders without re-running any analysis.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val incoming = when (intent?.action) {
            Intent.ACTION_VIEW -> intent.dataString ?: intent.getStringExtra(EXTRA_PASTE)
            Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
            else -> intent?.getStringExtra(EXTRA_PASTE)
        }
        setContent {
            AutopsyTheme {
                AppNavHost(incomingText = incoming)
            }
        }
    }

    companion object {
        const val EXTRA_PASTE = "com.appautopsy.extra.PASTE_TEXT"
    }
}

@Composable
fun AppNavHost(incomingText: String?) {
    val container = AppAutopsyApp.container
    val navController = rememberNavController()
    var lang by remember { mutableStateOf(container.lang) }
    val catalog = container.catalogs.getValue(lang)
    var result by remember { mutableStateOf<ScanResult?>(null) }

    fun submit(text: String) {
        result = LinkScanner.scan(container.rules, text)
        navController.navigate("result")
    }

    // A link or message arrived from outside the app: scan it before first
    // frame content matters — the result screen is the destination.
    LaunchedScan(incomingText) { submit(it) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AppAutopsy", color = MaterialTheme.colorScheme.onSurface) },
                actions = {
                    LanguageToggle(
                        current = lang,
                        onSelect = { newLang ->
                            container.lang = newLang
                            lang = newLang
                        },
                    )
                },
            )
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            composable("home") {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp),
                ) {
                    MessageCheckCard(catalog = catalog, onSubmit = ::submit)
                    Disclaimer(catalog = catalog)
                    Text("", modifier = Modifier.padding(bottom = 24.dp))
                }
            }
            composable("result") {
                val scan = result
                if (scan == null) {
                    navController.navigate("home")
                } else {
                    ResultScreen(
                        catalog = catalog,
                        result = scan,
                        onBack = { navController.navigate("home") },
                    )
                }
            }
        }
    }
}

/** Runs [onText] exactly once for a non-null incoming text. */
@Composable
private fun LaunchedScan(text: String?, onText: (String) -> Unit) {
    val done = remember { booleanArrayOf(false) }
    androidx.compose.runtime.LaunchedEffect(text) {
        if (text != null && !done[0]) {
            done[0] = true
            onText(text)
        }
    }
}
