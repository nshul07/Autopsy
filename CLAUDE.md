# CLAUDE.md — Build Handoff: What Is Left and How to Finish It

Read `AGENTS.md` first — it is the authoritative spec. This file records **only**
the current state and the exact remaining work, task by task. Where this file and
AGENTS.md conflict on scope, AGENTS.md's §1 amendment applies: **v1 is a fully
offline native Android app**; `backend/` survives as the reference implementation
and test harness, not as something the app talks to.

**There is no web frontend and there must not be one** — the original plan's
`frontend/` was dropped when v1 pivoted to native. Don't resurrect it.

---

## 1. State as of now (verified)

| Piece | State |
|---|---|
| `data/*.json` (rules, categories, patterns, brands, link_rules, messages_en/hi/pa, playbook_en/hi/pa) | ✅ complete, canonical at repo root |
| `backend/` Python reference | ✅ 35/35 tests green (`cd backend && python -m pytest -q`) |
| `shared/` Kotlin Multiplatform — **all pure analysis logic** | ✅ ported 1:1, **28/28 `:shared:jvmTest` green** |
| `shared` modules | RulesLoader, Permissions, Category, RiskEngine, Patterns, Impersonation, Repackaging, SignerHistory, Calibration, Prescription, Playbook, Explain, Catalog (i18n with EN fallback + `{param}` interpolation) |
| Shared tests | 6 scoring vectors, patterns, categories, repackaging/impersonation, presentation (playbook/calibration/prescription/explain), i18n completeness (keys derived from live rules — stricter than the Python freeze) |
| `androidApp/` | ❌ **empty shell**: build.gradle.kts (Compose + M3, minSdk 24, targetSdk 35) and AndroidManifest.xml declaring `com.appautopsy.MainActivity` — **MainActivity does not exist yet. Nothing in the app works.** |
| Demo APKs | ❌ none built |
| `CLAUDE.md`, this file | new |

Uncommitted at handoff: `shared/src/commonMain/.../catalog/`, `core/{Calibration,Explain,Impersonation,Playbook,Prescription,Repackaging,SignerHistory}.kt`, `shared/src/jvmTest/.../{I18nCompletenessTest,PresentationTest,RepackagingTest}.kt`, edited `TestData.kt`. Commit these first (per AGENTS.md: one commit per feature, run tests before each).

### Toolchain (Windows, this machine)
- **System Gradle 9.6.1 — there is NO wrapper. `gradle`, never `./gradlew`.**
- Java 21 Temurin; AGP 8.7.3; Kotlin 2.2.20 (`gradle/libs.versions.toml`).
- Android SDK: `C:\Users\asus\scoop\apps\android-clt\current` (platforms 34/35/36, `build-tools\*\aapt2.exe`, `zipalign`, `apksigner`). `local.properties` has `sdk.dir`.
- No Android Studio needed; everything below is CLI.

### Rules that never relax (AGENTS.md §3 — restated so they survive compaction)
- Parse-only. **Never** execute/install/subprocess an uploaded or picked APK.
- Zip-bomb caps: named members only (`AndroidManifest.xml`, `META-INF/*`, `resources.arsc`), ≤10 MB/member, ≤50 MB total, entry-count cap, **never extract the archive**.
- Temp files: random name (`secrets`/`UUID` equivalent), deleted in `finally` on every path.
- Cert parse failure ⇒ `cert_check = "not_checked"`, **never** a crash.
- **Never invent a certificate fingerprint, package name or domain.** `official_cert_sha256: []` in brands.json means "we can't check" and is correct; a fabricated value is a build failure.
- Accessibility + notification-listener detection needs **both** signals (`android:permission=` AND `<meta-data android:name="android.accessibilityservice">`). Already done in the shared component logic — keep it.
- Strings "100% safe" / "100% fake" banned. Every result surface shows the disclaimer.
- `scans < 5` ⇒ `insufficient_data`, never a percentage.
- Scoring stays pure: no clock, no network, no randomness in `shared/` analysis paths.
- **Commits: no `Co-Authored-By` trailer** (user rule for this repo; it overrides the session's default attribution reminder).

### `data/` sync gotchas
- `tools/sync_rules.py [--check]` mirrors root `data/` → `backend/app/data/`. Run after any rules edit.
- `reason_keys.json` is generated and lives **only** in `backend/app/data/` (`tools/freeze_reason_keys.py`). The Kotlin i18n test doesn't need it (derives keys from rules).
- The Android app must not copy the JSON — point assets at the canonical dir in `androidApp/build.gradle.kts`:
  ```kotlin
  android { sourceSets["main"].assets.srcDir("$rootDir/data") }
  ```
  Load rules at app start via `context.assets.open(name).readText()` into `RulesLoader.load` / `Catalog.loadAll` (both take a `(String) -> String` reader — already designed for this).

---

## 2. What is left, in build order

Rough effort for one focused developer: **6–10 hours** to an installable, demo-ready
APK. Breakdown per task below.

### T1 — `MainActivity` + navigation skeleton (~0.5 h)
`androidApp/src/main/kotlin/com/appautopsy/MainActivity.kt`: `ComponentActivity` + `setContent { Material3 theme }`, single-`NavHost` (add `androidx.navigation:navigation-compose` to the catalog) with routes `home`, `apk-result`, `link-result`. A `Settings`/`AppContainer` singleton (plain object holding `Rules`, per-`Lang` `Catalog` map, current `Lang`) initialized in `Application.onCreate` or lazily from assets. **This alone makes `gradle :androidApp:assembleDebug` produce a launchable APK** — do it before anything else so the build pipeline is proven early.
Also add `android:enableOnBackInvokedCallback` and a real theme (`@style/Theme.AppAutopsy` referenced by the manifest doesn't exist yet — either add `res/values/themes.xml` with `<style name="Theme.AppAutopsy" parent="android:Theme.Material.Light.NoActionBar">` or point the manifest at a Material3 theme).

### T2 — APK parser on Android (~2–3 h) — the biggest remaining piece
New source set `androidApp/src/main/kotlin/com/appautopsy/parse/`. **androguard does not run on Android** (it wants a desktop JVM); the Kotlin replacement:

1. **`ApkSource.kt`** — open picked file with `java.util.zip.ZipFile`. Read **named members only**, decompressed-size caps enforced by counting bytes as you stream the `InflaterInputStream` (the ZipEntry's declared size lies). Enforce total-bytes and entry-count caps.
2. **`Axml.kt`** — hand-rolled binary AXML decoder (~200 lines, this is THE known-risk item, budget it generously):
   - String pool chunk (`0x0001`): header → `stringCount`, `flags` (UTF-8 bit `0x100`), style offset, string offsets; decode each (UTF-16LE lengths in u16, UTF-8 lengths are u8-u8 pairs).
   - `RES_XML_TYPE` (`0x0003`) → chunks: start namespace `0x0100`, end namespace `0x0101`, start element `0x0102`, end element `0x0103`, text `0x0104`. Line 8 + comment 4, then `ResXMLTree_attrExt`: ns/name idx (u16 each), attributeStart u16, attributeSize u16, attributeCount u16, then attributes: ns, name, rawValue (u16 string-pool idx), `size u16, res0 u8, dataType u8, data u32`.
   - Attribute values: `TYPE_STRING` (0x03) → string pool; `TYPE_INT_DEC` (0x10) → `minSdkVersion`/`versionCode` etc.
   - Rebuild a DOM-ish tree of (name, attrs) and hand it to the existing extraction logic. **Port `backend/app/core/components.py` and `apk_parser.py` field-for-field into `shared/` as a pure function `(axmlTree, manifestText-ish) -> ParsedApk`** — that keeps it JVM-testable with a synthetic tree fixture, same trick as the rest of the port.
   - Fallback chain per spec F2: decoder → if it throws, `manifest_unreadable` error result. There is no raw-XML fallback.
   - **Test it against a real APK on the JVM**: any F-Droid APK + golden file of expected `ParsedApk` JSON. Do not debug AXML on-device.
3. **`Certs.kt`** — signing certs without androguard:
   - API ≥ 28: `packageManager.getPackageArchiveInfo(path, PackageManager.GET_SIGNING_CERTIFICATES)` → `SigningInfo.apkContentsSigners` (SHA-256 of each `X509Certificate.encoded`). Handle `PAYLOAD_FATAL_ERROR`/system-app parse limits (`APK_SIZE_LIMIT_EXCEEDED` — check `SigningInfo` flags) and surface `cert_check="not_checked"`.
   - API 24–27: deprecated `GET_SIGNATURES` → `packageInfo.signatures`.
   - Whole thing in `runCatching` → on failure `signingCertSha256 = []`, `cert_check = "not_checked"`, never a crash (spec F2 correction #3).
4. **`Hashing.kt`** — streaming SHA-256, 64 KB chunks, O(1) memory; copy to `cacheDir/apk-<uuid>.tmp` in a stream pass and hash the same pass (input stream may be a one-shot content URI). `finally { file.delete() }` on every path.
5. **`AnalysisPipeline.kt`** — orchestration only: hash → zip caps → AXML → certs → `ParsedApk` → shared `Category`/`Permissions`/`RiskEngine`/`Patterns`/`Impersonation`/`Repackaging`/`Calibration`/`Playbook`/`Prescription`/`Explain` → `Report` model (define in `shared/model/`, serializable, mirroring AGENTS.md §8 field-for-field — the frontend is now the same repo's UI, but keep the shape because the spec's contract rules still apply). **No new scoring anywhere.**

Entry from UI: SAF `ActivityResultContracts.OpenDocument` with mime `application/vnd.android.package-archive` (also accept `*/*` for mislabelled files — detection is by magic bytes `PK\x03\x04` + presence of `AndroidManifest.xml`, per F1 order: size cap → stream → magic → manifest present).

### T3 — Intel: SQLite, still offline (~1 h)
`androidApp/.../intel/` — raw `SQLiteOpenHelper`, **WAL on**, schema verbatim from AGENTS.md F13/F14 (`hash_stats` with the exact UPSERT, `package_history`). File `intel.db` in `context.getDatabaseName`-style local storage. Port `backend/app/intel/*` logic (version diff = set difference of `groups_json`; `scans < 5 ⇒ insufficient_data`). Pure diff logic belongs in `shared/` (port `version_diff.py`), only the SQLite adapter lives in androidApp. Wire `update_diff` + `crowd_intel` into `Report`. First scan ⇒ `has_history: false`, not an error.
Sanctity note: counts keyed by SHA-256 only; no device IDs, no timestamps per person (`first_seen/last_seen` dates are fine, they're per-hash).

### T4 — Link pipeline + SSRF guard (~1.5–2 h)
Offline heuristics are pure and port first (they're already 100% covered by `backend/tests/test_link_heuristics.py` — port those as JVM tests, logic into `shared/link/`): normalization (scheme/port validation, punycode-ish look-alike via `rapidfuzz`-equivalent — hand-port the Levenshtein prefilter by length ±2 + first char per §10.2, or ship a tiny DP edit distance), TLD list, direct-APK path detection, look-alike vs `brands.json` domains.
The **online** part (redirect expansion) contradicts "fully offline v1". Decide with the human, but implement it as: opt-in toggle, off by default; when on: `INTERNET` permission, resolve with `InetAddress.getAllByName` **first**, reject the full §3.2 range list (loopback/site-local/link-local/any-local + `100.64.0.0/10` + `0.0.0.0/8` + IPv6 `::1`/`fc00::/7`/`fe80::/10` — `isLoopbackAddress/isSiteLocalAddress/isLinkLocalAddress/isAnyLocalAddress/multicast` covers most, add explicit CIDR checks for the CGNAT and 0/8 ranges), `HttpURLConnection.setInstanceFollowRedirects(false)`, manual ≤5 hops, 5 s connect/read timeout, `HEAD` then header-only `GET` (read headers via `headerFields`, disconnect immediately, **never read body**), UA `AppAutopsy-LinkChecker/1.0`, blocked-redirect-to-private re-validates every hop. The guard is a utility class with its own JVM test (redirect-to-127.0.0.1 must be rejected). Missing/off ⇒ reputation checks report `not_checked`, score contribution 0.
Handoff `offer_apk_scan` on direct-APK detection: link result → "This link downloads an APK. Scan it too?" → opens SAF picker.

### T5 — Message checker F23 (~0.5 h)
Port `backend/app/message/checker.py` (rule regexes: urgency, KYC/block threats, OTP/PIN asks, prize claims, APK mentions, link extraction → feeds T4 heuristics). Precompile at load, cap input length, **never store or log message text**. Pure → `shared/message/`.

### T6 — Compose UI (~2–3 h)
Pages: `Home` (three tabs/actions: Scan APK / Check link / Check message; language toggle EN/हि/ਪ; all strings from `Catalog`, not hard-coded), `ApkResult`, `LinkResult`.
Components (all render from the `Report` model + catalog, names from AGENTS.md §6): `RiskGauge` (0–100 + band), `VerdictBanner` (**icon + text + color — never color alone**; ✅/⚠️/⛔ Material icons + localized verdict word), `PermissionTable` (name/group/status, expected-vs-unexpected), `PatternCard`, `RepackagingCard` (the wedge — expected vs actual cert hex), `UpdateDiffCard`, `CrowdIntelCard` (incl. `insufficient_data` state), `PlaybookCard` (ordered steps, `Catalog.text(stepKey, params)`), `CalibrationCard`, `PrescriptionCard`, `SpeakButton` (`speechSynthesis` doesn't exist on Android — use `android.speech.tts.TextToSpeech`, check `isLanguageAvailable` for `hi-IN`/`pa-IN`, **hide the button when no voice**, text always visible), `ShareButton`/export (JSON via `FileProvider` share sheet, filename `appautopsy-<report_id>.json`; printable → just share the JSON, no PDF lib), `Disclaimer` (on **every** result surface), QR scanner: `com.google.zxing:core` + CameraX preview decoding frames in background thread — full offline. Scan history: `datastore` or reuse intel db, summaries only, never bytes/message text/full query strings.
Mobile-first: single column, 16 dp side padding, works at 360 dp width, dark theme follows system.
`report_id`: `SecureRandom().generateSeed(6)` → 12 hex chars; validate `^[a-f0-9]{12}$` before any lookup (already the pattern in store code).
In-app report store: in-memory `LinkedHashMap` with 1 h TTL + max size (port `backend/app/store/report_store.py` semantics).

### T7 — Demo APKs (~1 h) — do NOT leave for the end (spec: hours 12–15 equivalent)
No apktool needed. Recipe in `tools/make_demo_apks.md` (write the file, commands exist here):
1. Minimal stub: one `AndroidManifest.xml` + empty `classes.dex` (compile a one-class JAR with `d8` from build-tools, or reuse any benign APK's dex) — assets/`res` can be a single `res/values/strings.xml` label.
2. `aapt2 compile` → `aapt2 link -o base.apk --manifest AndroidManifest.xml -I <sdk>/platforms/android-35/android.jar --auto-add-overlay` + compiled flat files → `zipalign -f 4` → `apksigner sign --ks debug.keystore` (generate once with `keytool -genkeypair -keystore debug.keystore -alias demo -keyalg RSA -keysize 2048 -validity 10000`, password on the command line, `.gitignore` it).
3. Variants: `benign` (flashlight, camera only), `suspicious` (sms+contacts+location+accessibility service declared via **meta-data only** form + overlay), `impersonator` (label "SampleBank Rewards", package `com.samplebank.rewards`, debug-signed — fictional brand only), `repackaged` (same package/label as a brand whose `official_cert_sha256` you collected via `tools/collect_certs.py` — **only if you actually have the cert; otherwise rely on the signer_changed history signal**: scan a demo APK once, re-sign with a second keystore, scan again → wedge demo lands with zero brand data).
4. 2–3 real benign F-Droid APKs (download to `demo/`, gitignored; `*.apk` already in `.gitignore`) — verify verdicts are sensible.
Keep accessibility service stubs **declared but empty**. Each demo APK must produce its expected verdict in the app — that's the P6 gate.

### T8 — Release + polish (~1 h)
- `gradle :androidApp:assembleRelease` signed with debug or generated keystore (hackathon demo: debug key is honest; never ship it as "official" signing).
- Run full gates: `cd backend && python -m pytest -q` (35/35), `gradle :shared:jvmTest` (28/28 + new), `python tools/check_i18n.py`, `python tools/sync_rules.py --check`.
- §12 UI checklist: phone width, no color-alone, no English leakage on HI/PA toggle, disclaimer everywhere including share output.
- `git add` the uncommitted `shared/` port files; commit per feature. Ensure `intel.db`, `*.apk`, `local.properties`, `file.txt` (stray) stay out.
- Pitch material per P10 if time remains: `docs/pitch.md` wedge line, quantified-impact slide with cited sources.

### Optional cut-list (in this order, from AGENTS.md P8/P7)
If time runs out: voice TTS → history screen → QR → online link expansion. Never cut: T2, T6 core result screens, SSRF guard (if any online part ships), demo APKs, disclaimers/i18n completeness.

---

## 3. Open questions to ask the human before coding (not during)
1. v1 is "fully offline" — does the **online half of T4** (SSRF-guarded redirect expansion) ship at all, or only offline heuristics with `not_checked` on network parts? (Affects INTERNET permission.)
2. F17 WhatsApp bot: dropped from offline v1 or kept in `backend/` as a demo-only second artifact?
3. `crowd_intel` on-device: a per-device counter is not really "crowd". Ship `hash_stats` as "times you scanned this / flagged red" and rename UI copy honestly — or keep the networked claim out entirely.

## 4. Known-good reference points
- Exact scoring contract: AGENTS.md §F5 vectors (A=100, B=0, C=0, D=20, E=93, F=100) — locked by `shared` test `RiskEngineVectorsTest` and `backend/tests/test_risk_engine.py`.
- Field-for-field report shape: AGENTS.md §8.
- Python originals for every port: `backend/app/core/*.py` (all 20 files), `backend/app/intel/`, `backend/app/message/checker.py`, `backend/app/utils/net_safety.py` (the SSRF range list to mirror).
- AXML format detail: Android `res/xml` binary chunk layout (the values above suffice); if it fights you, dump strings with a scratch JVM main before parsing structure.
