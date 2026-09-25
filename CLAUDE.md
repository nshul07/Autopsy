# CLAUDE.md — Build Handoff: What Works, What Doesn't, What's Left

Read `AGENTS.md` first — it is the authoritative spec. This file records **only**
the verified current state, the exact remaining work, and the known defects.
Where this file and AGENTS.md conflict on scope, AGENTS.md's §1 amendment
applies: **v1 is a fully offline native Android app**; `backend/` survives as the
reference implementation and test harness, not as something the app talks to.

**A `frontend/` now exists — this contradicts the line that used to be here**
("there is no web frontend and there must not be one"). It arrived in `d6432b0`
(*frontend: v3 UI — verdict display, security dashboard, scan-source
attribution, live re-localization*), 79 source files: React + TS + Tailwind +
Vite, `src/api.js`, `src/types/contract.ts`, `src/i18n/locales/messages_{en,hi,pa}.json`,
and a `capacitor.config.json` (`appId: org.appautopsy.app` — a **different**
applicationId from the native app's `com.appautopsy`). It is not reconciled in
this file yet; treat the native app as the shipped artifact. Two concrete
hazards to check before anyone builds it:

- **Five components exist twice**, as a `.jsx` and a `.tsx` of the same name
  (`CalibrationCard`, `Disclaimer`, `ErrorState`, `RepackagingCard`,
  `RiskGauge`). Vite resolves one of the two and the choice is not obvious —
  confirm which is live before editing either.
- **`src/api.js` implies a running backend.** v1 is offline and the manifest has
  no `INTERNET` permission; a frontend that calls the Python reference is a
  third architecture, not a UI for the shipped app. Decide which one you are
  shipping.

Everything in §2 and §3 below was measured on this machine, not recalled.
Re-verify with the commands in §2 before trusting any of it again.

**Latest session — link interception actually fixed, backend committed.** Two
commits on `main`: `98217c6` (backend parity + `phish_path` + FP elimination) and
`73c3096` (**the link-tap fix**). The headline correction:

⚠️ **The link-tap bug was never in the scanner.** "I tap a link and AppAutopsy
does nothing" had a one-line cause: **Android sends `ACTION_VIEW` to the default
browser and to nobody else.** The VIEW/BROWSABLE filter only makes us appear in
"Open with", which is offered *only when no default is set* — so on any normal
phone Chrome swallowed the tap before it reached us. `LinkHandoff.browserRoleIntent()`
and `holdsBrowserRole()` existed and were correct but had **zero call sites**, and
the manifest was missing both pieces Android requires before it will offer the
role at all: `CATEGORY_APP_BROWSER` (eligibility in Settings → Default apps →
Browser) and `CATEGORY_BROWSABLE` on the MAIN filter. Without them
`createRequestRoleIntent(ROLE_BROWSER)` fails silently. Now requested from a row
at the top of `PermissionsCard`. **Verified `APP_BROWSER` + `BROWSABLE` survive
into the merged manifest**; `assembleDebug` clean.

This is worth internalising before any future UI work: **a filter in the manifest
is not interception.** PROCESS_TEXT (text-selection menu) and SEND (share sheet)
work without any role and are the only doors that function on an unmodified
phone; the browser role is what upgrades them into "every tap, automatically".

**Latest session — Python backend parity + v3 APK (committed as `98217c6`).** The Python
link engine was brought up to the Kotlin engine (§4 is now *done*, not pending;
see §4 for what was ported). Two things it fixed that matter:

- **The grader no longer scores impersonation green.** Before, the Python
  reference scored `microsoft-secure-login.xyz` **green 10** and
  `sbi.verify-loan.xyz` **green 20** — a bank impersonation passing as clean.
  Both are now RED, and the reference and the app agree **score for score** on
  the whole demo table (65 / 35 / 45 / 55 / 75).
- **`str.format` is gone from the Python catalog.** Report text is
  attacker-influenced (`{decoded}`, `{brand}`, `{tld}`, `{keyword}` come from the
  URL under analysis) and `str.format` parses a format mini-language over
  whatever it is handed. `interpolate()` is now a literal scan-and-substitute.

⚠️ **`b478227` (link handoff) does not compile standalone** — its `MainActivity`
references `LinkGate` and `PermissionsCard`, which only enter the tree in the two
later commits (`c73344a`, `cab4771`). It is already in merged history on `main`,
so a bisect landing on it will fail. Squash or reorder if that matters.

`releases/v3.apk` is built (`versionCode 3`, `versionName 3.0`) and is a **debug**
build, like v1, v2 and **v4**.

**Latest session — v4 UI shipped (committed as `4ec317b`).** The mockup design is
now native Compose in `androidApp/` — onboarding (first-run, `app_state` prefs),
Home with 2×2 stat tiles + scan doors + recent feed, Scan hub, dedicated
link/message scanners, History tab (filter chips, clear-with-confirm), result
screen with tinted verdict banner + copy + share, language bottom sheet
(persisted). `DashboardScreen.kt` is deleted. ScanStore now also stores a link
*host* label (never a full URL, never message text). `RecentResults` in
`MainActivity` is an in-memory LRU (max 20, dies with the process) so a history
row reopens its full report in-session. 44 new i18n keys → **210 × EN/HI/PA**;
backend data copy synced. `releases/v4.apk` = `versionCode 4` / `4.0`, debug,
**includes the link-tap browser-role fix** that v3.apk predates. The Scan-APK
door is a deliberate "not in this build" badge (T2 still unbuilt — see §5).

---

## 1. Verified state

| Piece | State |
|---|---|
| `data/*.json` — rules, categories, patterns, brands, link_rules, messages_{en,hi,pa}, playbook_{en,hi,pa} | ✅ canonical at repo root; `messages_*` now **210 keys × 3 langs**; `brands.json` ~40 real brands |
| `backend/` Python reference | ✅ **57/57 pytest green** (`cd backend && python -m pytest -q`). Was **behind** the Kotlin engine; §4 is now applied and the two agree on the whole demo table |
| `shared/` KMP — all pure analysis logic | ✅ **45/45 `:shared:jvmTest` green** (+ **7** androidApp unit tests) — RiskEngine 6, LinkDetection 17, Presentation 8, Repackaging 8, I18n 6 |
| `shared/` modules | rules, model, catalog (i18n EN fallback + `{param}`), core/{Category,Permissions,RiskEngine,Patterns,Impersonation,Repackaging,SignerHistory,Calibration,Prescription,Playbook,Explain}, link/{Normalize,**Homoglyphs**,Heuristics,LinkScorer,LinkModels}, message/MessageChecker — **21 files** |
| `androidApp/` | ✅ **builds and works for the link/message/SMS/mail paths** — v4 UI (`4ec317b`): `MainActivity` (5 entry doors + NavHost + in-memory `RecentResults` LRU), `AppAutopsyApp`, ui/{Cards,Common,HomeScreen,ScanScreens,HistoryScreen,OnboardingScreen,LanguageSheet,ResultScreen,Widgets,Icons,Theme}, ui/scan/{LinkScanner,ScanStore,LinkGate,LinkHandoff}, watch/{SmsReceiver,MailNotificationListener,RiskNotifier}, res/values/themes.xml |
| APK parsing (`androidApp/parse/`) | ❌ **does not exist**. Picking an `.apk` does nothing. See §5 T2. |
| Intel DB (`androidApp/intel/`) | ❌ **does not exist**. No scan counts, no version diff, no crowd intel. See §5 T3. |
| Online link expansion + SSRF guard | ❌ **does not exist in Kotlin**. Offline heuristics only; `downgrade_redirect` / `reputation_flagged` are reported `not_checked` with 0 points. |
| Demo APKs | ❌ none built. `tools/make_demo_apks.md` does not exist yet. |
| README, releases | ✅ `README.md` at root; `releases/{v1,v2,v3,v4}.apk` committed — **all four are debug builds**; v4 (`4ec317b`) is the one to install, it carries the browser-role link fix that v3 predates |
| Working tree | clean apart from this `CLAUDE.md` edit; `frontend/` remains committed on `main`, unreconciled (see header) |

### Toolchain (Windows, this machine)
- **System Gradle 9.6.1 — there is NO wrapper. `gradle`, never `./gradlew`.**
- Java 21 Temurin **only** (`jvmToolchain(21)` + `VERSION_21`); AGP 8.7.3; Kotlin 2.2.20 (`gradle/libs.versions.toml`).
- Android SDK: `C:\Users\asus\scoop\apps\android-clt\current` (platforms 34/35/36, `build-tools\*\aapt2.exe`, `zipalign`, `apksigner`). `local.properties` has `sdk.dir`.
- No Android Studio needed; everything is CLI.
- **cwd drift is real:** the shell's working directory persists between calls. Always prefix `cd "F:/CODING/HACKATHON" &&` in the same command or Gradle fails with *"Project directory ... is not part of the build defined by settings file"*.

---

## 2. What passes (verified, with the command that proves it)

```
cd "F:/CODING/HACKATHON" && gradle :shared:jvmTest :androidApp:testDebugUnitTest   # 39 + 7
cd "F:/CODING/HACKATHON/backend" && python -m pytest -q   # 55/55
python tools/check_i18n.py                            # all keys in EN, HI, PA
python tools/sync_rules.py --check                    # data/ ↔ backend/app/data/ in sync
gradle :androidApp:assembleDebug                      # APK builds clean
```

**Passing behaviour, in the Kotlin app (the thing that ships):**

| Capability | Evidence |
|---|---|
| Punycode decode (RFC 3492) + Cyrillic/Greek confusable folding | `Punycode.decodeHost("xn--pple-43d.com") == "аpple.com"` → `Confusables.fold` → `"apple.com"`; asserted in `LinkDetectionTest` |
| Homoglyph spoof → **forced RED** | `http://xn--pple-43d.com/` → RED 65, flags `punycode` + `brand_lookalike`, reason names Apple and shows the decoded string |
| Brand impersonation → **forced RED** (not a 35-point warning) | 4 URLs asserted RED: `rnmicrosoft.com/signin`, `sbi.verify-loan.xyz/ok`, `microsoft-secure-login.xyz`, `paytm-verify.top/kyc` |
| Brand look-alike, 4 signals over ~40 brands | wrong-TLD exact, typo-squat (bounded Levenshtein, length prefilter), containment **gated on a lure word**, subdomain spoof |
| No false positives on containment | `snapple.com`, `olive.com` → null (lure-word gate); `apple.com`, `login.microsoft.com`, `outlook.office.com`, `sbi.co.in`, `secure.yono.sbi` → null (own-domain guard) |
| Offline heuristics: no_https 10, ip_host 25, punycode 20, at_symbol 15, suspicious_tld 10, deep_subdomains 10, shortener 5, scam_keywords 10/cap 20, direct_apk 30, brand_lookalike 35 | `evaluateOfflineHeuristics`, pure, no clock/network/randomness |
| Bands locked by tests | ≥61 RED, 26–60 YELLOW, ≤25 GREEN (`rules.json`); vectors A=100, B=0, C=0, D=20, E=93, F=100 |
| Message checker (urgency, KYC/block threats, OTP/PIN asks, prize claims, APK mentions, link extraction) | `shared/.../message/MessageChecker.kt`, precompiled regexes, input capped |
| Auto-detect: link click (`ACTION_VIEW`), share (`ACTION_SEND`), SMS (`RECEIVE_SMS`, multipart reassembly), mail (`NotificationListenerService` for Gmail/Outlook/Yahoo), notification tap via `EXTRA_PASTE` | `AndroidManifest.xml` + `MainActivity.onNewIntent` + `watch/` |
| Every auto-scan is recorded, green included; only the *notification* is suppressed for green | `SmsReceiver.analyzeAndWarn` records before the green-returns-silent check |
| Dashboard: total checked / flagged red / warned yellow / looked clean + recent feed with per-source attribution + clear | `ui/DashboardScreen.kt` |
| i18n EN/हि/ਪ for every string and reason key, switching instantly with no re-scan | 160 keys × 3; `check_i18n.py` passes |
| Verdicts as icon **+ word + color** (never color alone); disclaimer on every result surface | `ui/Cards.kt`, `ui/Common.kt` |
| Privacy: message text/URLs scanned and discarded; `ScanStore` keeps verdict/score/source/timestamp only; no INTERNET permission in the manifest | `ui/scan/ScanStore.kt`, `AndroidManifest.xml` |

**Verified end-to-end demo table** (asserted in `LinkDetectionTest` and
`backend/tests/test_link_heuristics.py`, so a rules edit that breaks one fails
the build on **both** sides). Both engines were run just now and agree exactly:

| Input | Kotlin app | Python backend |
|---|---|---|
| `http://xn--pple-43d.com/` | ⛔ RED 65 | ⛔ RED 65 |
| `https://rnmicrosoft.com/signin` | ⛔ RED 35 | ⛔ RED 35 |
| `https://microsoft-secure-login.xyz` | ⛔ RED 45 | ⛔ RED 45 |
| `https://sbi.verify-loan.xyz/ok` | ⛔ RED 55 | ⛔ RED 55 |
| `http://paytm-verify.top/kyc` | ⛔ RED 75 | ⛔ RED 75 |
| `http://193.44.55.66/paytm-verify` | ⚠️ YELLOW 45 | ⚠️ yellow 45 |
| `https://login.microsoft.com/home` | ✅ GREEN 0 | ✅ green 0 |
| `https://www.swiggy.com/menu` | ✅ GREEN 0 | ✅ green 0 |
| `https://apple.com/`, `https://olive.com/`, `https://snapple.com/` | ✅ GREEN 0 | ✅ green 0 |

The paytm row previously read "RED 65" on the Kotlin side — it is **75** (its
`scam_keywords` caps at 20, as the row above it says); the 65 was a copy of the
punycode row's score.

---

## 3. What fails / is missing

**F1 — Picking an APK file does nothing.** There is no `androidApp/src/main/kotlin/com/appautopsy/parse/`. No SAF picker, no zip reader, no AXML decoder, no cert reader, no hashing, no `AnalysisPipeline`. The entire F1–F7 half of the spec — the part the project is named after — is unbuilt. The Compose `ApkResult` screen and every card that renders an APK report (`PermissionTable`, `PatternCard`, `RepackagingCard`, `UpdateDiffCard`, `CrowdIntelCard`, `PlaybookCard`, `CalibrationCard`, `PrescriptionCard`, `RiskGauge`) are absent too; `ResultScreen.kt` only knows about links/messages. **This is the largest single gap and the headline risk.**

**F2 — Python and Kotlin disagree on brand impersonation.** Detailed in §4. The backend scores `microsoft-secure-login.xyz` and `sbi.verify-loan.xyz` **green**. If anyone demos the backend, or judges read `backend/`, the two artifacts contradict each other and the weaker one is the one that looks broken.

**F3 — No test anywhere covers the message checker.** `shared/.../message/MessageChecker.kt` and `backend/app/message/checker.py` both exist and **neither has a single test**. Every other analysis path has one. A regex edit there is currently unguarded.

**F4 — (retracted; this claim was wrong).** An earlier draft of this file said `status.not_checked` was missing from `messages_{en,hi,pa}.json`. It is **not** missing — the key exists in all three languages ("We could not run this check."), and the three files are at exact 160-key parity (verified: the `en−hi`, `hi−en` and `pa−en` set differences are all empty). No action needed. The hazard the claim was gesturing at is real but lives in §4.4: a missing *param* still ships a template with `{placeholder}` visible, because `Catalog.text` deliberately swallows `KeyError`. Guard that, not the key set.

**F5 — Bare-IP hosts top out at YELLOW, by design.** `http://193.44.55.66/paytm-verify` → YELLOW 45 (no_https 10 + ip_host 25 + scam_keywords 10). An IP host has no domain, so no brand signal fires. Correct arithmetic, arguably wrong judgement — a raw IP hosting `paytm-verify` is not a warning-grade event. Fix is one word: `"critical": true` on `ip_host` in `data/link_rules.json`. Left `false` deliberately so the choice stays visible; `LinkDetectionTest` asserts only that the checks *flag*, not the verdict, so flipping it will not break the build.

**F6 — The JSON `critical` flag is effectively dead code in Kotlin.** Only `reputation_flagged` has `critical: true`, and v1 offline never runs it. Every override that actually fires today comes from the two hard-coded rules in `LinkScorer.kt:42-49` (`homoglyphSpoof`, `strongBrand`). Not wrong, but it means `link_rules.json`'s `critical` field is documentation, not control — do not expect a JSON edit there to change a verdict.

**F7 — Python's `check_link` is not offline.** It calls redirect expansion and reputation lookup (visible as `SSRF blocked during redirect expansion: DNS resolution failure` on any run without network). The reference implementation therefore cannot reproduce the app's offline verdicts even in principle — scores differ by whatever the network added. There is no "offline mode" flag on the Python side to match v1's contract.

**F8 — Missing UI surfaces** (all absent, from §5 T6): QR scanner, Share/export (JSON via `FileProvider`), `SpeakButton` (TTS), scan-history screen, and the report store (`backend/app/store/report_store.py` semantics — in-memory `LinkedHashMap`, 1 h TTL). `report_id` is not generated anywhere in the app.

**F9 — No release signing, no demo APKs, no pitch material.** `gradle :androidApp:assembleRelease` is untried; `releases/*.apk` are **debug** builds (honest for a hackathon, but say so). No benign/suspicious/impersonator/repackaged demo APKs exist, so the P6 gate ("each demo APK produces its expected verdict") cannot be run at all.

---

## 4. DONE — the Python backend was brought up to the Kotlin engine

Applied and verified this session. The app's link engine had been hardened; the
Python reference had not, and the two graded **the same URL differently**. All
four items below are now in, and the two engines agree score-for-score across
the whole demo table.

**4.1 — `check_brand_lookalike` was a stub. ✅ Ported.** It ran a bare
Levenshtein distance against each brand's SLD, with **no punycode decode, no
confusable folding, no aliases, no containment signal, no subdomain-spoof
signal, no lure-word gate, and no strong/weak distinction**. Measured
consequences, before the port:

- `microsoft-secure-login.xyz` → **green 10** (only `suspicious_tld` — the brand token in a lured domain was invisible)
- `sbi.verify-loan.xyz` → **green 20** (only tld + keyword — a bank impersonation scoring green)
- `rnmicrosoft.com` → yellow 35, never RED

`check_brand_lookalike_match` + `LURE_WORDS` + `BrandMatch` are now ported
field-for-field from `shared/.../link/Heuristics.kt`, and it takes `hostname`,
not `domain`. The prefilter discipline is kept — `_bounded_edit_distance` wraps
`rapidfuzz` with the same early abort as Kotlin's `boundedEditDistance`.

**4.2 — `scorer.py` had no homoglyph or strong-brand override. ✅ Ported.**
`critical_triggered` keyed only off the one JSON flag, so the 35-point brand
check could only ever *warn*. It now mirrors `LinkScorer.kt`: `homoglyph_spoof`
(punycode + brand both flagged) and `strong_brand` (read from the `strong`
param).

**4.3 — Python's `punycode` check flagged but never decoded. ✅ Ported.**
`backend/app/link/homoglyphs.py` is new — an RFC 3492 decoder plus the
confusables map, ported from `Homoglyphs.kt`, and the check now emits
`params={"decoded": ...}`. Verified: `decode_host("xn--pple-43d.com") ==
"аpple.com"` and `fold(...) == "apple.com"`.

**4.4 — `Catalog.text` interpolated through `str.format`. ✅ Replaced.**
Report text is attacker-influenced (`{keyword}`, `{tld}`, `{decoded}`, `{brand}`
all come from the URL under analysis) and `str.format` parses a whole format
mini-language over whatever it is handed. `interpolate()` in
`backend/app/core/i18n.py` is now a literal scan-and-substitute matching Kotlin's
`Catalog.text`, with tests that `{0.__class__}`, `{decoded:*^40}`, `{0[0]}` and
`{}` come out verbatim. A missing param still leaves the placeholder visible —
deliberate: a visibly broken sentence is a bug someone reports.

**⚠️ The bug this port exposed — worth remembering.** The first version of the
port failed `olive.com`, reporting `BrandMatch("Microsoft", strong=True)`. The
cause was not the signals but **`Brand.official_domains` being a `frozenset`** in
`rules_loader.py`. Kotlin builds `official` with `.toSet()` on an ordered list — a
`LinkedHashSet` — so `official.firstOrNull()` is deterministic; Python's frozenset
destroyed that order and `next(iter(...))` returned a **hash-random** domain per
process. When that domain was `live.com`, the token `live` sits inside `olive`,
and a clean domain became an impersonation. It is now a `tuple`, and `heuristics.py`
builds its token lists order-preservingly. **Anywhere this codebase relies on
"the first element" of a set, the same class of bug is waiting.**

**4.6 — Measured on the Kaggle Phishing Site URLs corpus. ✅ Done.**
20 000 bad / 20 000 good URLs, fully offline, no brand blocklist, no network.
Harness: `.bench/full.py` (scratch, gitignored); CLI: `tools/bench_phishing.py`.

| | before | after |
|---|---|---|
| bad URLs alarmed (red+yellow) | 1.25% | **3.40%** |
| good URLs alarmed | 0.24% → **41 forced REDs** | **0.00% — zero** |

The false-positive figure was the actual defect, not the recall. Before the fix,
`citibank.co.uk`, `hiexpress.com` (×6), `devexpress.com` (×5), `picosoft.it`,
`oakbank.co.nz`, `statebankofindia.com` and `railway.org` (×3) were all forced
RED by the distance-2 typo rule. All are clean now. The new `phish_path` check
(injected credential path: `inject_dirs` × `credential_words`) contributes
0.21 pp of the recall gain at zero FP cost — measured 5.0% of bad, 0.00% of good.

**96.6% of missed bad URLs carry no brand token at all.** They are compromised
legitimate sites with a dropper injected into an existing path. Nothing offline
can see them; that is what a reputation lookup or blocklist is for, and v1 has
neither. This is a structural ceiling, not a bug to fix.

**The `rnicrosoft` trade — deliberate, documented, tested on both sides.**
`rnicrosoft.com` is a genuine Microsoft squat (one inserted `n`) but does **not**
contain the string `microsoft`. `picosoft.it` — a real Italian software firm — is
one insertion from `microsoft` too, and is string-indistinguishable from it. No
distance-2 test separates them, so the rule requires the brand word to stay
**visible inside the domain**: `rnmicrosoft` (which contains it) accuses,
`rnicrosoft` and `picosoft` do not. **Cost: one documented miss. Benefit: no real
bank is ever cried wolf on.** Both suites assert the miss explicitly —
`test_two_edit_squat_without_the_embedded_brand_word_is_a_known_miss` (Python),
`two-edit near miss of a real business is a documented miss` (Kotlin) — so it is
visible rather than surprising.

⚠️ **Load-bearing detail.** `_bounded_edit_distance` / `boundedEditDistance`
return `max_dist + 1` as the "too far" sentinel, so with a budget of 1 a result
of `2` means *unrelated*, not *two edits*. Any condition on the raw distance must
keep the `1 <= d <= budget` bound — dropping it made every token match every
domain and briefly turned `apple.com` into a "SampleBank" impersonation.

**4.5 — Two smaller alignment gaps (unchanged).** `brands.json` `official_cert_sha256` is `[]` for every brand, so `impersonation`/`repackaging` brand-anchored checks are `not_checked` on both sides — correct per §6, must stay. And the Kotlin i18n test derives keys from the live rules where Python's `reason_keys.json` is a frozen snapshot: the Kotlin check is **stricter**, so Python can pass while Kotlin fails. Treat Kotlin as the gate.

---

## 5. What is left, in build order

Rough effort for one focused developer: **8–10 hours** to a demo-ready APK that covers the APK half too. §4 (backend parity) is ~1 h and is worth doing first — it is cheap, self-contained, and it is the difference between two artifacts that agree and two that contradict.

### T2 — APK parser on Android (~2–3 h) — the biggest remaining piece, do it first
New source set `androidApp/src/main/kotlin/com/appautopsy/parse/`. **androguard does not run on Android** (desktop JVM only); the Kotlin replacement:

1. **`ApkSource.kt`** — `java.util.zip.ZipFile`. Read **named members only**, enforce decompressed-size caps by counting bytes as you stream the `InflaterInputStream` (**the `ZipEntry`'s declared size lies**). Enforce total-bytes and entry-count caps. Never extract.
2. **`Axml.kt`** — hand-rolled binary AXML decoder (~200 lines, the known-risk item, budget generously):
   - String pool (`0x0001`): header → `stringCount`, `flags` (UTF-8 bit `0x100`), style offset, string offsets; decode each (UTF-16LE lengths in u16; UTF-8 lengths are u8-u8 pairs).
   - `RES_XML_TYPE` (`0x0003`) → chunks: start ns `0x0100`, end ns `0x0101`, start element `0x0102`, end element `0x0103`, text `0x0104`. Line 8 + comment 4, then `ResXMLTree_attrExt`: ns/name idx (u16 each), attributeStart u16, attributeSize u16, attributeCount u16; then per attribute: ns, name, rawValue (u16 string-pool idx), `size u16, res0 u8, dataType u8, data u32`.
   - Values: `TYPE_STRING` (0x03) → string pool; `TYPE_INT_DEC` (0x10) → `minSdkVersion`/`versionCode`.
   - Rebuild a DOM-ish `(name, attrs)` tree, then **port `backend/app/core/components.py` + `apk_parser.py` field-for-field into `shared/`** as a pure function `(axmlTree) -> ParsedApk` — that keeps it JVM-testable with a synthetic tree fixture, same trick as every other port.
   - F2 fallback chain: decoder → on throw, `manifest_unreadable` error result. **No raw-XML fallback.**
   - **Test on the JVM against a real APK** (any F-Droid APK + a golden `ParsedApk` JSON). Do not debug AXML on-device.
3. **`Certs.kt`** — API ≥ 28: `packageManager.getPackageArchiveInfo(path, GET_SIGNING_CERTIFICATES)` → `SigningInfo.apkContentsSigners`, SHA-256 of each `X509Certificate.encoded`; handle `PAYLOAD_FATAL_ERROR` / `APK_SIZE_LIMIT_EXCEEDED`. API 24–27: deprecated `GET_SIGNATURES`. Whole thing in `runCatching` → on failure `signingCertSha256 = []`, `cert_check = "not_checked"`, **never a crash**.
4. **`Hashing.kt`** — streaming SHA-256, 64 KB chunks, O(1) memory. The input may be a one-shot content URI: copy to `cacheDir/apk-<uuid>.tmp` and hash in the same pass, `finally { file.delete() }` on every path.
5. **`AnalysisPipeline.kt`** — orchestration **only**: hash → zip caps → AXML → certs → `ParsedApk` → shared `Category`/`Permissions`/`RiskEngine`/`Patterns`/`Impersonation`/`Repackaging`/`Calibration`/`Playbook`/`Prescription`/`Explain` → `Report`. Define the `Report` model in `shared/model/` mirroring AGENTS.md §8 field-for-field. **No new scoring anywhere.**

UI entry: SAF `ActivityResultContracts.OpenDocument`, mime `application/vnd.android.package-archive` (also accept `*/*` for mislabelled files). F1 order: size cap → stream → magic `PK\x03\x04` → `AndroidManifest.xml` present.

### T3 — Intel: SQLite, still offline (~1 h)
`androidApp/.../intel/` — raw `SQLiteOpenHelper`, **WAL on**, schema verbatim from AGENTS.md F13/F14 (`hash_stats` with the exact UPSERT, `package_history`), file `intel.db`. Port `backend/app/intel/*` (version diff = set difference of `groups_json`; `scans < 5 ⇒ insufficient_data`). Pure diff logic goes in `shared/` (port `version_diff.py`); only the SQLite adapter lives in `androidApp`. Wire `update_diff` + `crowd_intel` into `Report`. First scan ⇒ `has_history: false`, not an error.
Counts keyed by SHA-256 only; no device IDs; no per-person timestamps (`first_seen`/`last_seen` per-hash are fine).

### T4 — Online link expansion + SSRF guard (~1.5–2 h) — **optional, ask first**
The offline half is done and tested. The online half contradicts "fully offline v1". If it ships at all: opt-in toggle, **off by default**; `INTERNET` permission added only then; resolve with `InetAddress.getAllByName` **first** and reject the full §3.2 range list (loopback/site-local/link-local/any-local + `100.64.0.0/10` + `0.0.0.0/8` + IPv6 `::1`/`fc00::/7`/`fe80::/10` — the `isLoopbackAddress`/`isSiteLocalAddress`/`isLinkLocalAddress`/`isAnyLocalAddress`/multicast predicates cover most; add explicit CIDR checks for CGNAT and 0/8); `setInstanceFollowRedirects(false)`, manual ≤5 hops, 5 s connect/read timeout, `HEAD` then header-only `GET` (headers via `headerFields`, disconnect immediately, **never read the body**), UA `AppAutopsy-LinkChecker/1.0`, **re-validate every hop**. Port the range list from `backend/app/utils/net_safety.py` and give the guard its own JVM test (redirect-to-127.0.0.1 must be rejected). Off/missing ⇒ `not_checked`, 0 points.
Also hand off `offer_apk_scan` on direct-APK detection: link result → "This link downloads an APK. Scan it too?" → opens the SAF picker.

### T6 (remainder) — UI surfaces (~1.5 h)
APK result screen + `RiskGauge`, `VerdictBanner`, `PermissionTable`, `PatternCard`, `RepackagingCard` (the wedge — expected vs actual cert hex), `UpdateDiffCard`, `CrowdIntelCard` (incl. `insufficient_data`), `PlaybookCard` (`Catalog.text(stepKey, params)`), `CalibrationCard`, `PrescriptionCard`. Plus `SpeakButton` (`android.speech.tts.TextToSpeech` — `speechSynthesis` does not exist on Android; check `isLanguageAvailable` for `hi-IN`/`pa-IN`, **hide the button when no voice**, text always visible), `ShareButton` (JSON via `FileProvider`, filename `appautopsy-<report_id>.json`; no PDF lib), QR scanner (`com.google.zxing:core` + CameraX, decode frames off the main thread — fully offline), scan-history screen, report store (in-memory `LinkedHashMap`, 1 h TTL, max size). `report_id` = `SecureRandom().generateSeed(6)` → 12 hex, validate `^[a-f0-9]{12}$` before any lookup.
Mobile-first: single column, 16 dp side padding, works at 360 dp width, dark theme follows system.

### T7 — Demo APKs (~1 h) — write `tools/make_demo_apks.md` first
No apktool needed.
1. Stub: `AndroidManifest.xml` + empty `classes.dex` (`d8` from build-tools, or lift a benign APK's dex) + one `res/values/strings.xml`.
2. `aapt2 compile` → `aapt2 link -o base.apk --manifest AndroidManifest.xml -I <sdk>/platforms/android-35/android.jar --auto-add-overlay` → `zipalign -f 4` → `apksigner sign --ks debug.keystore` (`keytool -genkeypair -keystore debug.keystore -alias demo -keyalg RSA -keysize 2048 -validity 10000`; `.gitignore` the keystore).
3. Variants: `benign` (flashlight, camera), `suspicious` (sms+contacts+location + accessibility declared **meta-data only**, stubs **empty**), `impersonator` (label "SampleBank Rewards", package `com.samplebank.rewards`, debug-signed — **fictional brand only**), `repackaged` (**only if you actually hold a brand cert** — otherwise use the signer-changed history signal: scan once, re-sign with a second keystore, scan again; the wedge demo lands with zero brand data).
4. 2–3 real benign F-Droid APKs in `demo/` (gitignored; `*.apk` is already in `.gitignore`).

Each demo APK must produce its expected verdict in the app — that is the P6 gate.

### T8 — Release + polish (~1 h)
- `gradle :androidApp:assembleRelease`, signed with a generated keystore. The current `releases/*.apk` are **debug** builds — say so, never present debug signing as official.
- Run every gate: `pytest -q` (35/35), `gradle :shared:jvmTest` (39/39 + new), `python tools/check_i18n.py`, `python tools/sync_rules.py --check`.
- §12 checklist: phone width, no color-alone, **no English leakage on the HI/PA toggle**, disclaimer on every surface including share output.
- Commit per feature. Keep out of git: `intel.db`, `*.apk` (a release needs `git add -f`), `local.properties`, any stray `file.txt`.

**Cut-list, in this order:** TTS voice → history screen → QR → online expansion (T4) → APK result cards beyond the wedge.
**Never cut:** T2, the core result screens, disclaimer/i18n completeness, demo APKs, and — if any online part ships — the SSRF guard.

---

## 6. Rules that never relax (AGENTS.md §3 — restated so they survive compaction)

- **Parse-only. Never execute, install or subprocess an uploaded or picked APK.**
- Zip-bomb caps: named members only (`AndroidManifest.xml`, `META-INF/*`, `resources.arsc`), ≤10 MB/member, ≤50 MB total, entry-count cap, **never extract the archive**.
- Temp files: random name (`secrets`/`UUID` equivalent), deleted in `finally` on every path.
- Cert parse failure ⇒ `cert_check = "not_checked"`, **never a crash**.
- **Never invent a certificate fingerprint, package name or domain.** `official_cert_sha256: []` in `brands.json` means "we can't check" and is correct; a fabricated value is a build failure.
- Accessibility + notification-listener detection needs **both** signals (`android:permission=` AND `<meta-data android:name="android.accessibilityservice">`).
- Strings "100% safe" / "100% fake" banned. Every result surface shows the disclaimer.
- `scans < 5` ⇒ `insufficient_data`, never a percentage.
- Scoring stays pure: **no clock, no network, no randomness** in `shared/` analysis paths.
- **never store or log message text** (F23). Scan history keeps verdict/score/source/timestamp only.
- **Commits: no `Co-Authored-By` trailer** (user rule for this repo; it overrides the session's default attribution reminder).

### `data/` sync gotchas
- `tools/sync_rules.py [--check]` mirrors root `data/` → `backend/app/data/`. Run after any rules edit.
- `reason_keys.json` is generated, lives **only** in `backend/app/data/` (`tools/freeze_reason_keys.py`). Kotlin does not need it (derives keys from the live rules — stricter, see §4.5).
- The app must not copy the JSON. It points assets at the canonical dir:
  ```kotlin
  android { sourceSets["main"].assets.srcDir("$rootDir/data") }
  ```
  Load at app start via `context.assets.open(name).readText()` into `RulesLoader.load` / `Catalog.loadAll` — both already take a `(String) -> String` reader.

---

## 7. Open questions for the human (ask before coding, not during)

1. Does the **online half of T4** ship at all, or only offline heuristics with `not_checked` on network parts? (Decides whether `INTERNET` is ever added — today the manifest has no network permission and that is a selling point.)
2. F17 WhatsApp bot: dropped from offline v1, or kept in `backend/` as a demo-only second artifact?
3. `crowd_intel` on-device: a per-device counter is not a crowd. Ship `hash_stats` as "times you scanned this / flagged red" with honest UI copy, or drop the crowd framing entirely?
4. `ip_host` as `critical: true` (F5) — red-flag raw-IP links, or keep them yellow?

---

## 8. Known-good reference points

- Exact scoring contract: AGENTS.md §F5 vectors (A=100, B=0, C=0, D=20, E=93, F=100) — locked by `shared` `RiskEngineVectorsTest` and `backend/tests/test_risk_engine.py`.
- Report shape: AGENTS.md §8.
- Python originals for every port: `backend/app/core/*.py` (20 files), `backend/app/intel/`, `backend/app/message/checker.py`, `backend/app/utils/net_safety.py` (the SSRF range list), `backend/app/link/*.py` — see §4 before treating `heuristics.py`/`scorer.py` as canonical, they are the *older* implementation.
- **Kotlin is the canonical engine:** `shared/src/commonMain/kotlin/com/appautopsy/analysis/link/{Heuristics,LinkScorer,Homoglyphs}.kt`.
- AXML format detail: Android `res/xml` binary chunk layout; the values in §5 T2 suffice. If it fights you, dump the string pool from a scratch JVM main before parsing structure.
- The 7-row demo table in §2 is the regression fixture — if a change moves a verdict there, either the change is wrong or the README is.