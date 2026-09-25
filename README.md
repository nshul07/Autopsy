# AppAutopsy

**An offline Android phishing guard.** No cloud, no accounts, no telemetry.
A link you tap, an SMS that arrives, a mail notification that pops up — all of
them get analyzed on-device, in milliseconds, and you get a verdict with
reasons.

> This tool flags risky patterns; it cannot guarantee any link or app is
> safe. Treat a green result as "nothing suspicious detected", never as a
> guarantee.

## Why

UPI/SMS phishing in India runs on two tricks: look-alike links
(`rnicrosoft.com`, `sbi-verify.top`) and homoglyph domains that *render* as a
brand but encode as garbage — `аpple.com` spelled with a Cyrillic "а" is
registered as `xn--pple-43d.com`. Browsers show the pretty fake; naive
blocklists see neither. AppAutopsy decodes the punycode, folds the confusable
letters back to ASCII, matches against a real brand registry, and shows you
the address **as it really spells**.

It also analyzes APK files without ever installing or executing them —
parse-only, zip-bomb hardened, cert-fingerprint checks against repackaging.

## What it does

| Feature | How |
|---|---|
| **Auto-detect on link click** | Registers as a handler for `ACTION_VIEW`/`ACTION_SEND`; tap a link → chooser → AppAutopsy warns before the browser does. Links clicked while the app is open arrive via `onNewIntent`. |
| **SMS scanning** | `RECEIVE_SMS` broadcast receiver reassembles multipart messages, scans the body, warns via notification. Green messages stay silent. |
| **Email scanning** | A `NotificationListenerService` reads Gmail/Outlook/Yahoo notification titles+previews. Nothing is fetched; the notification is already on the device. |
| **Punycode / homoglyph detection** | RFC 3492 decoder + Cyrillic/Greek confusable table. `xn--pple-43d.com` → `аpple` → `apple` → matches Apple → **forced RED**, and the result screen shows "it decodes to 'аpple.com', which is not what it appears to be". |
| **Brand look-alike** | 4 signals over ~40 real brands (banks, UPI apps, marketplaces, Microsoft/Google/Apple, government): wrong-TLD exact match, typo-squat (bounded Levenshtein), containment (`microsoft-secure-login.xyz`), subdomain-spoof (`microsoft.com.verify-login.xyz`). Official domains and their subdomains never flag themselves. |
| **Offline link heuristics** | no-HTTPS, IP host, `@` abuse, suspicious TLD, deep subdomains, shorteners, scam keywords, direct-APK download. Each contributes bounded points; online reputation checks honestly show `not_checked`. |
| **APK analysis** | Binary AXML manifest decoder, permission groups, risky-pattern engine, signature/cert history (repackaging wedge), signing cert SHA-256 via PackageManager. Never extracts files; strict zip-bomb caps. |
| **Message pattern checks** | urgency language, OTP/PIN asks, KYC/block threats, prize claims, APK mentions — rule regexes, precompiled, input-capped. |
| **Dashboard** | Total checked / flagged red / warned yellow / looked clean, plus a recent-activity feed with per-source attribution (Link / SMS / Email / Manual). |
| **i18n** | English, हिन्दी, ਪੰਜਾਬੀ for every string and every reason, switching instantly with no re-scan. |
| **Verdicts** | GREEN / YELLOW / RED with score + band, icon + word + color (never color alone), reason keys so every number on screen is explainable. |

## Architecture

```
data/                 canonical JSON: rules, categories, patterns, brands,
                      link_rules, messages_{en,hi,pa}, playbook_*
shared/               Kotlin Multiplatform — ALL pure analysis logic.
                      No clock, no network, no randomness: same input,
                      same output, forever. JVM-testable.
  analysis/link/      normalize, heuristics, punycode+confusables, scorer
  analysis/message/   message checker (regex rules, link extraction)
  analysis/core/      risk engine, category, permissions, impersonation,
                      repackaging, signer history, calibration
  analysis/catalog/   i18n with EN fallback + {param} interpolation
androidApp/           Compose UI + the Android-only edges
  MainActivity.kt     single activity, 4 entry doors, NavHost
  ui/                 ResultScreen, DashboardScreen, cards, theme
  ui/scan/            LinkScanner (one entry, one verdict), ScanStore
  watch/              SmsReceiver, MailNotificationListener
backend/              Python reference implementation + test harness
                      (35 tests). The app never talks to it.
tools/                rules sync, i18n completeness, cert collection
```

**Privacy model (hard rules, not aspirations):**
- Message text, URLs and APK bytes are scanned and discarded. Nothing user-
  generated is ever stored, logged, or leaves the device.
- Scan history stores **only** verdict, score, source and a timestamp —
  never the text or link behind it.
- No device ID, no analytics, no network permission needed for anything
  except (optionally) link redirect checks, which default off.
- No certificate fingerprint, package name or domain is ever invented.
  Empty `official_cert_sha256` means "we cannot verify" and is reported as
  `not_checked` — a fabricated value would be worse than none.

## Scoring

Flagged checks accumulate bounded points (e.g. brand look-alike 35,
direct-APK 30, IP host 25, punycode 20); score 0–100 maps to a band
(≥61 red, 26–60 yellow, ≤25 green). Overrides force RED regardless of
arithmetic when the pattern *is* the attack rather than merely suspicious:

- a punycode host that also matches a brand — homoglyph spoof by construction;
- a **strong** brand match — the brand's exact word on someone else's domain,
  a typo-squat, or a brand buried in a lure-word domain. These are separated
  from weak matches (bare containment) precisely so that a 35-point signal
  cannot downgrade a bank impersonation to a warning;
- any check marked `critical` in the rules (direct-APK download).

The exact scoring vectors are locked by tests in both Kotlin
(`RiskEngineVectorsTest`, `LinkDetectionTest`) and Python
(`test_risk_engine.py`) — rule edits that break the contract fail the build.

## Build & run

Toolchain: JDK 21, Android SDK (CLI tools + platform 35), system Gradle 9.x.
No wrapper in this repo — use `gradle`, not `./gradlew`.

```bash
# tests first (fast)
gradle :shared:jvmTest            # 36 JVM tests: scoring vectors, link engine, i18n
cd backend && python -m pytest -q # 35 Python tests against the same rules
python tools/check_i18n.py        # every key present in EN/HI/PA

# APK
gradle :androidApp:assembleDebug
# → androidApp/build/outputs/apk/debug/androidApp-debug.apk
adb install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
```

The app ships its rules as assets copied from the canonical `data/` dir
(`sourceSets["main"].assets.srcDir("$rootDir/data")`) — no JSON is
duplicated inside the module. Edit rules at the repo root, run
`python tools/sync_rules.py` to mirror into the backend harness.

### Enabling the automatic guards

1. **SMS**: grant SMS permission when prompted (Settings → Apps →
   AppAutopsy → Permissions). Incoming messages are then scanned silently.
2. **Email**: Settings → Notification access → enable AppAutopsy. Only
   mail-client notifications (Gmail/Outlook/Yahoo) are read.
3. **Link clicks**: tap any link → in the chooser pick AppAutopsy once, or
   set it as default for `http(s)` under Open by default.

## Try it (detection demos)

Paste these into the app:

| Input | Result |
|---|---|
| `http://xn--pple-43d.com/` | ⛔ RED (65) — decodes to `аpple.com` (Cyrillic а), matches Apple, forced red |
| `https://rnmicrosoft.com/signin` | ⛔ RED (35) — typo-squat of Microsoft, forced red |
| `https://sbi.verify-loan.xyz/ok` | ⛔ RED (55) — SBI label on someone else's domain |
| `http://paytm-verify.top/kyc` | ⛔ RED (65) — brand lure + scam TLD + no HTTPS |
| `http://193.44.55.66/paytm-verify` | ⚠️ YELLOW (45) — IP host + no HTTPS + scam keyword; no domain, so no brand signal |
| `https://login.microsoft.com/home` | ✅ GREEN (0) — brand's own domain, subdomain-safe |
| `https://www.swiggy.com/menu` | ✅ GREEN (0) |

Verified by `gradle :shared:jvmTest` — these verdicts are asserted in
`LinkDetectionTest`, so a rules edit that breaks one fails the build.

## Repo rules that shaped the code

- Parse-only: the app never installs, opens or executes an APK.
- Zip-bomb caps: named members only, per-member and total byte caps,
  entry-count cap, the archive is never extracted.
- Any cert parse failure ⇒ `not_checked`, never a crash.
- Accessibility detection requires *both* the permission attribute and the
  service meta-data.
- `scans < 5` ⇒ `insufficient_data`, never a fake percentage.
- No "100% safe / 100% fake" wording anywhere; a disclaimer sits on every
  result surface, in every language.

## Releases

- `releases/v1.apk` — first installable build.
- `releases/v2.apk` — homoglyph/punycode engine, ~40-brand registry,
  auto-scan dashboard (counts + recent activity), SMS/mail scans recorded,
  localized score row, full i18n (140 keys × 3 languages).
