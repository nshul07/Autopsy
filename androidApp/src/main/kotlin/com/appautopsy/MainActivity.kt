package com.appautopsy

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.appautopsy.analysis.model.Lang
import com.appautopsy.analysis.model.Verdict
import com.appautopsy.ui.AutopsyTheme
import com.appautopsy.ui.BrowserPickerDialog
import com.appautopsy.ui.HistoryScreen
import com.appautopsy.ui.HomeScreen
import com.appautopsy.ui.Ink
import com.appautopsy.ui.LanguageChip
import com.appautopsy.ui.LanguageSheet
import com.appautopsy.ui.LinkScanScreen
import com.appautopsy.ui.MessageScanScreen
import com.appautopsy.ui.OnboardingScreen
import com.appautopsy.ui.ResultScreen
import com.appautopsy.ui.ScanHubScreen
import com.appautopsy.ui.BottomBar
import com.appautopsy.ui.scan.GateDecision
import com.appautopsy.ui.scan.LinkGate
import com.appautopsy.ui.scan.LinkHandoff
import com.appautopsy.ui.scan.LinkScanner
import com.appautopsy.ui.scan.ScanOrigin
import com.appautopsy.ui.scan.ScanResult
import com.appautopsy.ui.scan.ScanStore
import com.appautopsy.ui.scan.scanReasonTexts
import com.appautopsy.ui.scan.toStoreSource
import com.appautopsy.watch.RiskNotifier
import java.net.URI
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

/**
 * Single activity. Five doors in, the v4 screen shell out:
 *  1. launched normally  → onboarding (first run) → Home
 *  2. ACTION_VIEW (link tapped in any app) → scanned, then either handed
 *     straight to the real browser (clean) or held with a warning (risky)
 *  3. ACTION_SEND (share sheet) → scanned, result shown
 *  4. ACTION_PROCESS_TEXT (text-selection menu in any app)
 *  5. tapped alert notification (EXTRA_PASTE) → scanned, result shown
 * A link clicked while the app is already open arrives via onNewIntent.
 *
 * Every scan is recorded (verdict + score + source + time + link host only —
 * never message text).
 */
class MainActivity : ComponentActivity() {

    // Atomic slot: written from onNewIntent (main thread, but also from the
    // notification tap path), consumed inside the composition. The nonce
    // suffix makes two identical links arrive as two distinct values so the
    // LaunchedScan loop re-triggers instead of swallowing the repeat.
    private val pending = AtomicReference<String?>(null)
    private val nonce = AtomicLong(0)

    // Which door the pending text came through. Kept beside the text rather
    // than encoded inside it: the origin decides whether the app may navigate
    // the user, and smuggling that through a string delimiter would be one
    // parsing bug away from auto-opening a link nobody tapped.
    private val pendingOrigin = AtomicReference(ScanOrigin.MANUAL)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        AppAutopsyApp.container.lang = persistedLang(this)
        takeIncoming(intent)
        setContent {
            AutopsyTheme {
                AppNavHost(pending = pending, pendingOrigin = pendingOrigin)
            }
        }
    }

    // The app was already running (e.g. the user opened it from the link
    // chooser earlier): ACTION_VIEW arrives here, not in onCreate. Without
    // this the "auto-detect on link click" promise silently breaks after the
    // first open.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        takeIncoming(intent)
    }

    private fun takeIncoming(intent: Intent?) {
        if (intent == null) return

        val text: String?
        val origin: ScanOrigin
        when (intent.action) {
            Intent.ACTION_VIEW -> {
                // A tapped link, or a tap on one of our own notifications
                // (which carries EXTRA_PASTE and no data URI).
                val data = intent.dataString
                if (data != null) {
                    text = data
                    origin = ScanOrigin.LINK
                } else {
                    text = intent.getStringExtra(EXTRA_PASTE)
                    origin = ScanOrigin.NOTIFICATION
                }
            }

            Intent.ACTION_SEND -> {
                // Some apps put the link in EXTRA_SUBJECT; take whichever is
                // present so a share from a mail client still gets scanned.
                text = intent.getStringExtra(Intent.EXTRA_TEXT)
                    ?: intent.getStringExtra(Intent.EXTRA_SUBJECT)
                origin = ScanOrigin.SHARE
            }

            Intent.ACTION_PROCESS_TEXT -> {
                // EXTRA_PROCESS_TEXT holds the user's selection.
                // EXTRA_PROCESS_TEXT_READONLY is a boolean flag, not payload.
                text = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
                origin = ScanOrigin.SHARE
            }

            else -> {
                text = intent.getStringExtra(EXTRA_PASTE)
                origin = ScanOrigin.NOTIFICATION
            }
        }

        if (!text.isNullOrBlank()) {
            pendingOrigin.set(origin)
            pending.set("$text\n#n${nonce.incrementAndGet()}")
        }
    }

    companion object {
        const val EXTRA_PASTE = "com.appautopsy.extra.PASTE_TEXT"
        private const val PREFS = "app_state"
        private const val KEY_ONBOARDED = "onboarded"
        private const val KEY_LANG = "lang"

        fun isFirstRun(context: android.content.Context): Boolean =
            !context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
                .getBoolean(KEY_ONBOARDED, false)

        fun markOnboarded(context: android.content.Context) {
            context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
                .edit().putBoolean(KEY_ONBOARDED, true).apply()
        }

        fun persistedLang(context: android.content.Context): Lang =
            context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
                .getString(KEY_LANG, null)
                ?.let { runCatching { Lang.valueOf(it) }.getOrNull() }
                ?: Lang.EN

        fun persistLang(context: android.content.Context, lang: Lang) {
            context.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)
                .edit().putString(KEY_LANG, lang.name).apply()
        }
    }
}

/**
 * In-memory LRU of finished scans, so a history row opened in the same
 * session shows the full report. Deliberately memory-only: the privacy
 * contract keeps verdicts at rest but never stores report content, and this
 * cache dies with the process exactly like the text it holds.
 */
private object RecentResults {
    private const val MAX = 20
    private val map = object : LinkedHashMap<Long, Pair<ScanResult, String?>>(MAX, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<Long, Pair<ScanResult, String?>>) = size > MAX
    }

    @Synchronized fun put(atMillis: Long, result: ScanResult, text: String?) { map[atMillis] = result to text }
    @Synchronized fun get(atMillis: Long): Pair<ScanResult, String?>? = map[atMillis]
}

@Composable
fun AppNavHost(
    pending: AtomicReference<String?>,
    pendingOrigin: AtomicReference<ScanOrigin>,
) {
    val container = AppAutopsyApp.container
    val context = LocalContext.current
    val navController = rememberNavController()
    var lang by remember { mutableStateOf(container.lang) }
    val catalog = container.catalogs.getValue(lang)
    var result by remember { mutableStateOf<ScanResult?>(null) }
    var resultText by remember { mutableStateOf<String?>(null) }
    var resultAt by remember { mutableStateOf<Long?>(null) }
    var historyTick by remember { mutableLongStateOf(0L) }
    var askBrowserFor by remember { mutableStateOf<String?>(null) }
    var showLangSheet by remember { mutableStateOf(false) }
    var showOnboarding by remember { mutableStateOf(MainActivity.isFirstRun(context)) }

    val backStackEntry by navController.currentBackStackEntryAsState()
    val route = backStackEntry?.destination?.route ?: "home"
    val showBar = route in setOf("home", "scan", "history")

    /**
     * A finished tap-scan: decide between passing through and holding.
     *
     * The three outcomes are the whole product promise:
     *  - clean + browser known → hand off **without showing a screen**; a
     *    guard that interrupts every clean link gets uninstalled;
     *  - clean + no browser yet → ask once, then hand off;
     *  - risky → stay on the verdict screen with the reasons, and raise a
     *    notification so the warning outlives the screen.
     */
    fun applyGate(scan: ScanResult, origin: ScanOrigin, url: String?) {
        val decision = LinkGate.decide(scan, origin, LinkHandoff.chosenBrowser(context) != null)
        when (decision) {
            GateDecision.HandOff -> {
                if (url != null) LinkHandoff.open(context, url)
                navController.navigate("home") { popUpTo("home") { inclusive = true } }
            }

            GateDecision.AskBrowserThenHandOff -> askBrowserFor = url

            GateDecision.HoldAndWarn -> {
                if (url != null) {
                    RiskNotifier.show(
                        context = context,
                        notificationId = RiskNotifier.idFor(LinkScanner.KEY_HELD_LINK, url),
                        content = RiskNotifier.Content(
                            sourceLabel = catalog.text("ui.source_link"),
                            verdict = scan.verdict,
                            verdictWord = catalog.text("verdict.${scan.verdict.id}"),
                            score = scan.score,
                            reasons = scanReasonTexts(scan, catalog),
                            openAnywayLabel = catalog.text("ui.open_anyway"),
                            openAnywayUrl = url,
                        ),
                        contentIntent = PendingIntent.getActivity(
                            context,
                            url.hashCode(),
                            Intent(context, MainActivity::class.java).apply {
                                action = Intent.ACTION_VIEW
                                data = Uri.parse(url)
                            },
                            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
                        ),
                    )
                }
                navController.navigate("result")
            }

            GateDecision.ShowResult -> navController.navigate("result")
        }
    }

    fun submit(text: String, origin: ScanOrigin = ScanOrigin.MANUAL) {
        val clean = text.substringBeforeLast("\n#n") // strip the nonce marker
        val scan = LinkScanner.scan(container.rules, clean)
        val at = System.currentTimeMillis()
        val label = (scan as? ScanResult.Link)?.report?.normalizedUrl?.let { hostOf(it) }
        ScanStore.record(
            context = context,
            verdict = if (scan is ScanResult.Rejected) Verdict.YELLOW else scan.verdict,
            score = if (scan is ScanResult.Rejected) 0 else scan.score,
            source = origin.toStoreSource(),
            atMillis = at,
            label = label,
        )
        RecentResults.put(at, scan, clean.takeIf { origin != ScanOrigin.LINK })
        result = scan
        resultText = clean
        resultAt = at
        historyTick++

        // A URL only exists when the scan really was a single link *and* it
        // arrived as a tap. A message body must never reach a browser.
        val url = (scan as? ScanResult.Link)
            ?.report?.inputUrl
            ?.takeIf { origin == ScanOrigin.LINK }
        applyGate(scan, origin, url)
    }

    // A link or message arrived from outside the app: scan it immediately.
    // This IS the auto-warning path, and the only caller that can pass a LINK
    // origin — the scan screens below are always MANUAL.
    LaunchedScan(pending) { submit(it, pendingOrigin.get()) }

    if (showOnboarding) {
        OnboardingScreen(
            catalog = catalog,
            onDone = {
                MainActivity.markOnboarded(context)
                showOnboarding = false
            },
        )
        return
    }

    askBrowserFor?.let { url ->
        BrowserPickerDialog(
            catalog = catalog,
            onPicked = { pkg ->
                LinkHandoff.rememberBrowser(context, pkg)
                askBrowserFor = null
                // Open the link the user tapped, in the browser they just
                // chose. If that fails, fall through to the result screen
                // rather than stranding them on a blank page.
                val opened = LinkHandoff.openIn(context, url, pkg)
                navController.navigate(if (opened) "home" else "result")
            },
            onDismiss = {
                askBrowserFor = null
                // Declining the picker is not a verdict: still show what we
                // found, so the scan was not wasted.
                navController.navigate("result")
            },
        )
    }

    if (showLangSheet) {
        LanguageSheet(
            catalog = catalog,
            current = lang,
            onSelect = { newLang ->
                container.lang = newLang
                MainActivity.persistLang(context, newLang)
                lang = newLang
            },
            onDismiss = { showLangSheet = false },
        )
    }

    androidx.compose.material3.Scaffold(
        containerColor = Ink.Canvas,
        bottomBar = {
            if (showBar) {
                BottomBar(
                    selected = when (route) {
                        "home" -> 0
                        "scan" -> 1
                        else -> 2
                    },
                    onSelect = { idx ->
                        val dest = when (idx) {
                            0 -> "home"
                            1 -> "scan"
                            else -> "history"
                        }
                        if (route != dest) navController.navigate(dest) {
                            popUpTo("home")
                            launchSingleTop = true
                        }
                    },
                    catalog = catalog,
                )
            }
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
                    catalog = catalog,
                    tick = historyTick,
                    onScanLink = { navController.navigate("link") },
                    onScanMessage = { navController.navigate("message") },
                    onScanApk = {
                        Toast.makeText(context, catalog.text("scan.apk_soon"), Toast.LENGTH_SHORT).show()
                    },
                    onOpenHistory = { navController.navigate("history") },
                    onOpenReport = { rec -> openRecord(rec, navController) { r, t, at ->
                        result = r; resultText = t; resultAt = at
                    } },
                    onLanguage = { showLangSheet = true },
                )
            }
            composable("scan") {
                ScanHubScreen(
                    catalog = catalog,
                    onScanLink = { navController.navigate("link") },
                    onScanMessage = { navController.navigate("message") },
                    onScanApk = {
                        Toast.makeText(context, catalog.text("scan.apk_soon"), Toast.LENGTH_SHORT).show()
                    },
                    tick = historyTick,
                )
            }
            composable("link") {
                LinkScanScreen(
                    catalog = catalog,
                    onBack = { navController.popBackStack() },
                    onSubmit = { submit(it, ScanOrigin.MANUAL) },
                    tick = historyTick,
                )
            }
            composable("message") {
                MessageScanScreen(
                    catalog = catalog,
                    onBack = { navController.popBackStack() },
                    onSubmit = { submit(it, ScanOrigin.MANUAL) },
                    tick = historyTick,
                )
            }
            composable("history") {
                HistoryScreen(
                    catalog = catalog,
                    tick = historyTick,
                    onOpenReport = { rec -> openRecord(rec, navController) { r, t, at ->
                        result = r; resultText = t; resultAt = at
                    } },
                )
            }
            composable("result") {
                val scan = result
                if (scan == null) {
                    navController.navigate("home")
                } else {
                    ResultScreen(
                        catalog = catalog,
                        result = scan,
                        originalText = resultText,
                        onBack = { navController.navigate("home") },
                    )
                }
            }
        }
    }
}

/** Opens a stored record's full report when it is still in the memory cache. */
private fun openRecord(
    rec: ScanStore.Record,
    navController: NavHostController,
    show: (ScanResult, String?, Long) -> Unit,
) {
    val hit = RecentResults.get(rec.atMillis)
    if (hit != null) {
        show(hit.first, hit.second, rec.atMillis)
        navController.navigate("result")
    }
}

private fun hostOf(url: String): String? = runCatching { URI(url).host }.getOrNull()

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
