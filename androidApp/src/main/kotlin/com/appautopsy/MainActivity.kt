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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Lang
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.ui.AutopsyTheme
import com.appautopsy.ui.DashboardScreen
import com.appautopsy.ui.Disclaimer
import com.appautopsy.ui.LanguageToggle
import com.appautopsy.ui.MessageCheckCard
import com.appautopsy.ui.ResultScreen
import com.appautopsy.ui.scan.LinkScanner
import com.appautopsy.ui.scan.ScanResult
import com.appautopsy.ui.scan.ScanStore
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

/**
 * Single activity. Four doors in, one screen out:
 *  1. launched normally  → paste box + Dashboard
 *  2. ACTION_VIEW (link tapped anywhere) / ACTION_SEND → auto-scanned
 *  3. tapped alert notification (EXTRA_PASTE) → auto-scanned
 *  4. link clicked while the app is already open → onNewIntent → auto-scanned
 * Every scan is recorded (verdict + score + source only — never the text).
 */
class MainActivity : ComponentActivity() {

    // Atomic slot: written from onNewIntent (main thread, but also from the
    // notification tap path), consumed inside the composition. The nonce
    // suffix makes two identical links arrive as two distinct values so the
    // LaunchedScan loop re-triggers instead of swallowing the repeat.
    private val pending = AtomicReference<String?>(null)
    private val nonce = AtomicLong(0)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        takeIncoming(intent)
        setContent {
            AutopsyTheme {
                AppNavHost(pending = pending)
            }
        }
    }

    // The app was already running (e.g. user opened it from the link chooser
    // earlier): ACTION_VIEW arrives here, not in onCreate. Without this the
    // "auto-detect on link click" promise silently breaks after first open.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        takeIncoming(intent)
    }

    private fun takeIncoming(intent: Intent?) {
        val text = when (intent?.action) {
            Intent.ACTION_VIEW -> intent.dataString ?: intent.getStringExtra(EXTRA_PASTE)
            Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
            else -> intent?.getStringExtra(EXTRA_PASTE)
        }
        if (!text.isNullOrBlank()) pending.set("$text\n#n${nonce.incrementAndGet()}")
    }

    companion object {
        const val EXTRA_PASTE = "com.appautopsy.extra.PASTE_TEXT"
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun AppNavHost(pending: AtomicReference<String?>) {
    val container = AppAutopsyApp.container
    val context = LocalContext.current
    val navController = rememberNavController()
    var lang by remember { mutableStateOf(container.lang) }
    val catalog = container.catalogs.getValue(lang)
    var result by remember { mutableStateOf<ScanResult?>(null) }
    var historyTick by remember { mutableLongStateOf(0L) }

    fun submit(text: String) {
        val clean = text.substringBeforeLast("\n#n") // strip the nonce marker
        val scan = LinkScanner.scan(container.rules, clean)
        ScanStore.record(
            context = context,
            verdict = if (scan is ScanResult.Rejected) Verdict.YELLOW else scan.verdict,
            score = if (scan is ScanResult.Rejected) 0 else scan.score,
            source = if (clean.any { it == ' ' || it == '\n' }) ScanStore.Source.MANUAL else ScanStore.Source.LINK,
        )
        result = scan
        historyTick++
        navController.navigate("result")
    }

    // A link or message arrived from outside the app: scan it immediately —
    // the result screen is the destination, this IS the auto-warning path.
    LaunchedScan(pending) { submit(it) }

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
                    DashboardScreen(catalog = catalog, tick = historyTick)
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
                        lang = lang,
                        result = scan,
                        onBack = { navController.navigate("home") },
                    )
                }
            }
        }
    }
}

/** Runs [onText] for every new value the pending slot takes on. */
@Composable
private fun LaunchedScan(
    pending: AtomicReference<String?>,
    onText: (String) -> Unit,
) {
    var tick by remember { mutableLongStateOf(0L) }
    LaunchedEffect(tick) {
        val text = pending.getAndSet(null)
        if (text != null) {
            onText(text)
            tick++
        }
    }
}
