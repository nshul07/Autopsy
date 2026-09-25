package com.appautopsy

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
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
import com.appautopsy.analysis.model.Lang
import com.appautopsy.ui.AutopsyTheme
import com.appautopsy.ui.Disclaimer
import com.appautopsy.ui.LanguageToggle
import com.appautopsy.ui.MessageCheckCard
import com.appautopsy.ui.scan.LinkScanner
import com.appautopsy.ui.scan.ScanResult
import kotlinx.serialization.json.Json

/**
 * Single entry point. Two jobs only: make the app launch and prove the whole
 * offline pipeline works — assets → RulesLoader → Catalog → scoring engine.
 *
 * v1 scans what arrives to it: links (from a paste box, a shared intent, or the
 * http intent-filter) and message text. No file parsing, no network.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AutopsyTheme {
                AppNavHost(intent = intent)
            }
        }
    }
}

@Composable
fun AppNavHost(intent: Intent?) {
    val navController = rememberNavController()
    val container = AppAutopsyApp.container
    var lang by remember { mutableStateOf(container.lang) }
    var result by remember { mutableStateOf<ScanResult?>(null) }

    // A link arriving via VIEW/SEND intent (chooser "Open with AppAutopsy",
    // or share-sheet) is scanned immediately, then shown on the result screen.
    val incomingUrl: String? = when (intent?.action) {
        Intent.ACTION_VIEW -> intent.dataString
        Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
        else -> null
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AppAutopsy") },
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
                HomeScreen(
                    catalog = container.catalog,
                    onCheckMessage = { text ->
                        // Message checker lands with shared/message; for now
                        // routes whatever the user typed through the link
                        // scanner, which extracts URLs from the text itself.
                        result = LinkScanner.scan(container.rules, text)
                        navController.navigate("result")
                    },
                )
            }
            composable("result") {
                val scan = result
                if (scan == null) {
                    navController.navigate("home")
                } else {
                    ResultScreen(
                        catalog = container.catalog,
                        lang = lang,
                        result = scan,
                        onBack = { navController.navigate("home") },
                    )
                }
            }
        }
    }
}

@Composable
fun HomeScreen(
    catalog: com.appautopsy.analysis.catalog.Catalog,
    onCheckMessage: (String) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        MessageCheckCard(
            catalog = catalog,
            onSubmit = onCheckMessage,
        )
        Disclaimer(catalog = catalog)
        Text(
            text = "",
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp),
        )
    }
}
