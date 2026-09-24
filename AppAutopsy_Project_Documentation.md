# AppAutopsy: Project Documentation and AI Build Playbook

**Version:** 1.0  |  **Type:** 24-hour hackathon project  |  **Language of this file:** English (so any AI tool understands it best)

> **Tagline:** Know what an app can do before it does it.

## How to use this file

1. **Humans:** read Sections 1 to 14 to understand the project, rules, team plan and demo.
2. **AI tools (Claude, ChatGPT, Gemini, Cursor, Copilot, Claude Code):**
   - Easiest way: paste this **entire file** into the tool, then send a short task message such as: `Execute Prompt 3 from Section 15.`
   - If the tool has a small context window: paste only **Prompt 0** (the compact master context in Section 15) and then the prompt you want.
3. Run prompts **one at a time, in order**. Run the tests after each one, and commit to Git before moving on.
4. Everything is a **rules-based, explainable system**. Do not add machine learning in the first version.

## Table of contents

1. Overview
2. Scope (MVP, stretch, non-goals)
3. Feature specification
4. Architecture and data flow
5. Project structure
6. Tech stack and dependencies
7. API contract
8. Rules and scoring (the core logic)
9. Link checker specification
10. Localization (English, Hindi, Punjabi)
11. Demo assets and demo script
12. Security, privacy and limitations
13. Team roles and timeline
14. Testing checklist
15. AI build prompts
16. Pitch and judge Q&A
17. Pre-hackathon checklist
18. Glossary

---

## 1. Overview

### 1.1 One-line idea
AppAutopsy checks an Android APK (and a download link) **before installation** and explains, in simple language, whether the app's permissions match its real purpose.

### 1.2 The real-world problem
People receive APK files and download links through WhatsApp, Telegram, unknown websites, mod-APK sites and file-sharing links. A typical scam looks like "SBI Reward Points APK" or "PM Yojana APK". Android asks for permissions (SMS, contacts, microphone, accessibility, overlay), but most people cannot judge what those permissions mean and simply tap "Allow".

Possible consequences of a malicious app: stolen bank OTPs, leaked contacts and photos, spying, and unauthorized transactions.

### 1.3 Target users
- Ordinary Android users, especially parents and grandparents.
- People who use Hindi or Punjabi more comfortably than English.
- Anyone who receives APKs or links from unknown senders.

### 1.4 The solution
The user uploads an APK, pastes a link, or (stretch) pastes a suspicious message. AppAutopsy then:
1. Reads the APK manifest and extracts permissions, services, receivers and package details.
2. Guesses the app's category (for example flashlight, calculator, navigation).
3. Asks: **"Does this app need these permissions for its advertised job?"**
4. Detects dangerous permission combinations (scam patterns) and impersonation of well-known apps.
5. Produces a 0 to 100 risk score, a green/yellow/red verdict, and plain-language reasons in English, Hindi or Punjabi.
6. Checks links for look-alike domains, direct APK downloads, redirects and known-bad reputation.

Example output:
> **Flashlight app. Risk 88/100 (Red).** It asks for SMS, contacts, location and accessibility access. A flashlight app does not normally need these. Do not install.

### 1.5 The unique angle (differentiation)
Similar tools already exist, so do **not** claim "nothing like this exists".

| Existing tool | What it does | Gap AppAutopsy fills |
|---|---|---|
| APK Analyzer (open source, Google Play) | Shows manifest, permissions, certificate details, even before install | Output is technical; no verdict on whether permissions fit the app's purpose |
| MobSF (open source, from India) | Full static and dynamic analysis for security experts | Built for professionals, not ordinary users |
| DDriveMode APK Analyzer (browser tool) | Local APK inspection with risk scoring and report export | Closest competitor; review it before your pitch. No purpose-vs-permission logic, no Hindi/Punjabi voice, no link-to-APK flow that we know of |
| VirusTotal | Multi-engine malware scan | Answers "is it known malware?", not "why is this suspicious, in plain words?" |

**Positioning line:** Technical tools exist, but they are built for experts. AppAutopsy is built for ordinary Hindi and Punjabi speaking users and explains, in their language, whether an app asks for more than its job requires.

---

## 2. Scope

### 2.1 MVP (must be demo-ready)
| # | Feature |
|---|---|
| 1 | APK upload (file picker or drag and drop) |
| 2 | Extract app name, package name, version, SHA-256 |
| 3 | Extract permissions, services, receivers, activities from `AndroidManifest.xml` |
| 4 | Dangerous-permission classification (permission groups) |
| 5 | Category selection with automatic suggestion |
| 6 | Purpose-vs-permission mismatch engine |
| 7 | Scam-pattern detection (OTP stealer, banking trojan, spyware, and others) |
| 8 | Risk score 0 to 100 with a written reason for every point |
| 9 | Green / yellow / red result screen with a recommendation |
| 10 | English and Hindi explanations (Punjabi if time allows) |
| 11 | Link checker: expand short links, detect direct APK, look-alike domains |
| 12 | Link-to-APK flow: "This link downloads an APK. Scan it too?" |

### 2.2 Stretch features (only after the MVP works)
- Voice explanation using browser text-to-speech (Hindi, Punjabi, English).
- Impersonation check against a small list of well-known brands.
- Reputation lookups: VirusTotal (hash-only), Google Safe Browsing, URLhaus.
- Message scam checker (paste an SMS or WhatsApp text).
- QR code scanner that feeds the link checker.
- Exportable report (print to PDF, JSON) and "share with family" WhatsApp button.
- Scan history stored in the browser (localStorage), never the APK itself.
- Update comparison (new APK version vs old: "this update added SMS access").
- Android wrapper app with "Share to AppAutopsy" support.
- Signing-certificate analysis (debug or self-signed certificates, package reuse with a different signer).
- Suspicious string extraction (hard-coded IPs, Telegram bot URLs).

### 2.3 Non-goals and claims policy
Never claim any of these anywhere (slides, UI, pitch):
- "We detect every virus."
- "We guarantee an APK is safe."
- "We monitor every app on the phone."
- "We analyze runtime behavior."

Always show this limitation line on every report:
> Static analysis only. This is not a guarantee of safety.

Never output the words "100% safe" or "100% fake". Use "No major red flags found in the checks we ran" instead.

---

## 3. Feature specification

### 3.1 APK analyzer
- **Input:** `.apk` file up to `MAX_APK_MB` (default 100).
- **Reads:** app label, package name, version name/code, min and target SDK, permissions, services (with their `android:permission`), receivers, activities, launcher activity presence, signing certificate SHA-256.
- **Never executes** the APK. Static parsing only.
- **Deletes** the uploaded file right after analysis (in a `finally` block).

### 3.2 Purpose-vs-permission engine
- Each category has a list of **expected** sensitive permission groups (Section 8.3).
- Sensitive permissions that are **expected** score 0 and are labelled "Expected for this type of app".
- Sensitive permissions that are **not expected** score their normal points and are labelled "Unexpected".
- One extra mismatch penalty (+20) is applied once if any unexpected sensitive permission exists.
- If the category is `unknown`, no mismatch penalty is applied, all sensitive permissions score normally, and the report shows a "low confidence" badge.

### 3.3 Scam-pattern detection
Combinations that match known attack styles (Section 8.4). Each pattern has a plain-language consequence such as: "If this app is malicious, it could read your bank OTPs."

### 3.4 Link checker
See Section 9. Output uses the same green/yellow/red bands and the same reason list style.

### 3.5 Impersonation check (stretch)
If the app label, package name or link domain contains a known brand name (for example "sbi", "paytm") but the package name, signing certificate or domain is **not** on that brand's official list, flag it as possible impersonation.

### 3.6 Localization and voice
All user-facing text comes from message files (`messages_en.json`, `messages_hi.json`, `messages_pa.json`). The result screen has a language toggle and a "Speak" button using the browser's `speechSynthesis` API. Voice availability for Hindi and Punjabi depends on the user's device, so always show the text as well.

### 3.7 Report
Report JSON contains: input summary, verdict, score, score breakdown, reasons, permissions table, patterns, limitations, timestamp. The frontend renders it as a printable page (browser "Save as PDF") and a JSON download.

### 3.8 Message scam checker (stretch)
Rules-based: urgency phrases, KYC or account-block threats, requests for OTP/PIN/CVV, prize or reward claims, links, and APK mentions. Extracted links go through the link checker. The message text is never stored.

---

## 4. Architecture and data flow

### 4.1 High-level diagram

```text
                    +---------------------------+
                    |           USER            |
                    | uploads APK / pastes link |
                    | / pastes message          |
                    +-------------+-------------+
                                  |
                                  v
                    +---------------------------+
                    |  FRONTEND (React + Vite)  |
                    |  EN / Hindi / Punjabi UI  |
                    |  Result screen, voice     |
                    +-------------+-------------+
                                  | REST (JSON / multipart)
                                  v
                    +---------------------------+
                    |    BACKEND (FastAPI)      |
                    +---+---------+---------+---+
                        |         |         |
          +-------------+   +-----+-----+   +--------------+
          v                 v           v                  v
   +--------------+  +-------------+  +----------------+  +--------------+
   | APK PIPELINE |  | LINK        |  | MESSAGE        |  | REPORT STORE |
   |              |  | PIPELINE    |  | PIPELINE       |  | (in-memory,  |
   |              |  |             |  | (stretch)      |  |  TTL 1 hour) |
   +--------------+  +-------------+  +----------------+  +--------------+
```

### 4.2 APK pipeline

```text
Upload
  -> validate (size, ZIP magic bytes, contains AndroidManifest.xml)
  -> save to temp dir with random name
  -> compute SHA-256
  -> parse with Androguard (fallback: raw manifest XML)
  -> normalize into ParsedApk
  -> detect category (keywords, or user choice)
  -> risk engine
       1. map permissions to permission groups
       2. split into expected / unexpected for the category
       3. add points for unexpected groups
       4. count check (> 5 unexpected groups)
       5. mismatch penalty
       6. scam patterns
       7. impersonation check
       8. cap score at 100, choose band, apply "critical" override
  -> explanation builder (language templates)
  -> report JSON
  -> delete temp file (always)
```

### 4.3 Link pipeline

```text
URL input
  -> normalize and validate (http/https only)
  -> local heuristics (no network): IP host, punycode, TLD, subdomains,
     keywords, look-alike brand, missing HTTPS, "@" trick
  -> safe redirect expansion (SSRF-guarded, max 5 hops, 5 s timeout, no body download)
  -> direct-APK detection (extension or content-type)
  -> optional: domain age (WHOIS)
  -> optional: reputation (Safe Browsing, VirusTotal, URLhaus)
  -> score, band, reasons
  -> if direct APK: return flag "offer_apk_scan": true
```

### 4.4 Design principles
- **Deterministic and explainable:** the same input always gives the same score, and every point maps to a reason.
- **Rules live in JSON files**, not in code, so the team can tune them without a rewrite.
- **Graceful degradation:** if an API key is missing or a service is down, skip that check and mark it "not checked" in the report. Never crash.
- **Privacy first:** APKs are deleted after analysis; only report JSON is kept briefly.

---

## 5. Project structure

```text
appautopsy/
├── README.md
├── CONTEXT.md                      # paste of this doc's Sections 1-14 for AI tools
├── .gitignore
├── .env.example
├── Makefile                        # make dev, make test, make lint
├── docker-compose.yml              # optional
│
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app, CORS, router registration
│   │   ├── config.py               # settings from env (MAX_APK_MB, API keys, TTL)
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes_apk.py       # POST /api/v1/apk/analyze
│   │   │   ├── routes_link.py      # POST /api/v1/link/check
│   │   │   ├── routes_message.py   # POST /api/v1/message/check (stretch)
│   │   │   └── routes_report.py    # GET  /api/v1/report/{id}
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── apk_parser.py       # Androguard wrapper -> ParsedApk
│   │   │   ├── hasher.py           # SHA-256
│   │   │   ├── category.py         # category detection
│   │   │   ├── risk_engine.py      # scoring (pure functions)
│   │   │   ├── patterns.py         # scam-pattern matching
│   │   │   ├── impersonation.py    # brand look-alike checks (APK + domain)
│   │   │   ├── explain.py          # builds localized reasons and recommendation
│   │   │   └── report_store.py     # in-memory TTL store
│   │   ├── link/
│   │   │   ├── __init__.py
│   │   │   ├── normalize.py        # URL cleaning and validation
│   │   │   ├── heuristics.py       # offline checks
│   │   │   ├── expander.py         # SSRF-safe redirect follower
│   │   │   ├── reputation.py       # Safe Browsing / VirusTotal / URLhaus adapters
│   │   │   └── scorer.py           # link score and band
│   │   ├── message/
│   │   │   └── checker.py          # message rules (stretch)
│   │   ├── data/
│   │   │   ├── rules.json          # permission groups, points, bands
│   │   │   ├── categories.json     # category keywords + expected groups
│   │   │   ├── patterns.json       # scam patterns
│   │   │   ├── brands.json         # brand aliases + official domains/packages
│   │   │   ├── link_rules.json     # link heuristic weights, TLD list, keywords
│   │   │   ├── messages_en.json
│   │   │   ├── messages_hi.json
│   │   │   └── messages_pa.json
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py          # Pydantic models (ParsedApk, Report, LinkReport)
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── file_safety.py      # upload validation, temp file handling
│   │       └── net_safety.py       # SSRF guard (block private/loopback/link-local)
│   └── tests/
│       ├── conftest.py
│       ├── test_risk_engine.py
│       ├── test_patterns.py
│       ├── test_category.py
│       ├── test_link_heuristics.py
│       ├── test_net_safety.py
│       ├── test_api.py
│       └── fixtures/               # JSON-built ParsedApk samples
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js                  # fetch wrappers
│       ├── i18n/
│       │   ├── index.js
│       │   ├── en.json
│       │   ├── hi.json
│       │   └── pa.json
│       ├── pages/
│       │   ├── Home.jsx            # tabs: Scan APK | Check Link | Check Message
│       │   ├── ApkResult.jsx
│       │   └── LinkResult.jsx
│       ├── components/
│       │   ├── RiskGauge.jsx
│       │   ├── VerdictBanner.jsx   # green / yellow / red + icon + text
│       │   ├── PermissionTable.jsx
│       │   ├── PatternCard.jsx
│       │   ├── LanguageToggle.jsx
│       │   ├── SpeakButton.jsx     # speechSynthesis
│       │   ├── ShareButton.jsx     # WhatsApp share link
│       │   └── Disclaimer.jsx
│       └── styles/
│
├── demo/
│   ├── README.md                   # how to build and use demo APKs
│   ├── android-demo-apps/          # Gradle project, product flavors
│   └── sample-links.txt            # safe example links for demo (no live malware)
│
├── android-app/                    # OPTIONAL wrapper with share/open-with support
│
└── docs/
    ├── pitch.md
    ├── competitor-comparison.md
    └── rules-notes.md
```

---

## 6. Tech stack and dependencies

| Layer | Choice | Why |
|---|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn | Fast to build, automatic OpenAPI docs |
| APK parsing | Androguard 4.x (fallback: read raw manifest XML) | Reads manifest without installing |
| HTTP client | httpx | Async, timeouts, redirect control |
| URL parsing | tldextract | Correct domain/subdomain split |
| Similarity | rapidfuzz | Edit distance for look-alike domains |
| Domain age | python-whois (optional, may be slow or blocked) | Newly registered domains are a signal |
| Validation | Pydantic v2 | Typed request/response models |
| Tests | pytest, pytest-asyncio | Table-driven rule tests |
| Frontend | React + Vite + Tailwind CSS | Mobile-first UI quickly |
| Voice | Web `speechSynthesis` | No server cost |
| Storage | In-memory TTL dict (MVP), SQLite (stretch) | Keep it simple |
| Reputation (optional) | VirusTotal (hash-only), Google Safe Browsing, URLhaus | Check each provider's current terms and key requirements before relying on them |

`requirements.txt` starting point:

```text
fastapi
uvicorn[standard]
python-multipart
pydantic>=2
androguard>=4
httpx
tldextract
rapidfuzz
python-whois
pytest
pytest-asyncio
slowapi
```

`.env.example`:

```text
MAX_APK_MB=100
REPORT_TTL_SECONDS=3600
CORS_ORIGINS=http://localhost:5173
VIRUSTOTAL_API_KEY=
SAFE_BROWSING_API_KEY=
URLHAUS_AUTH_KEY=
ENABLE_WHOIS=false
LLM_CATEGORY_HINT=false
```

---

## 7. API contract

Base path: `/api/v1`. All responses are JSON. Errors use `{"error": {"code": "...", "message": "..."}}`.

### 7.1 `GET /health`
Returns `{"status": "ok", "version": "1.0"}`.

### 7.2 `POST /apk/analyze`
Multipart form fields:
- `file` (required): the APK
- `category` (optional): user-selected category id, overrides detection
- `lang` (optional): `en`, `hi` or `pa` (default `en`)

Response (`200`):

```json
{
  "report_id": "a1b2c3d4",
  "type": "apk",
  "created_at": "2026-01-01T10:00:00Z",
  "app": {
    "label": "Super Flashlight",
    "package": "com.example.flash",
    "version_name": "1.0",
    "version_code": 1,
    "min_sdk": 21,
    "target_sdk": 33,
    "sha256": "<hex>",
    "signing_cert_sha256": ["<hex>"]
  },
  "category": {
    "id": "flashlight",
    "confidence": "medium",
    "method": "keyword"
  },
  "score": 88,
  "band": "high",
  "verdict": "red",
  "recommendation": "do_not_install",
  "critical_pattern_triggered": false,
  "breakdown": [
    {"rule": "group:sms", "points": 20, "reason_key": "perm.sms.unexpected"},
    {"rule": "group:contacts", "points": 15, "reason_key": "perm.contacts.unexpected"},
    {"rule": "group:location", "points": 8, "reason_key": "perm.location.unexpected"},
    {"rule": "group:accessibility", "points": 25, "reason_key": "perm.accessibility.unexpected"},
    {"rule": "mismatch", "points": 20, "reason_key": "mismatch.generic"}
  ],
  "permissions": [
    {"name": "android.permission.READ_SMS", "group": "sms", "status": "unexpected"},
    {"name": "android.permission.CAMERA", "group": "camera", "status": "expected"}
  ],
  "patterns": [],
  "impersonation": null,
  "reasons": ["A flashlight app does not normally need SMS access. ..."],
  "summary": "This flashlight app asks for more access than it needs. Do not install.",
  "limitations": "Static analysis only. This is not a guarantee of safety.",
  "lang": "en"
}
```

### 7.3 `POST /link/check`
Request: `{"url": "https://example.com/x", "lang": "en"}`

Response (`200`):

```json
{
  "report_id": "e5f6",
  "type": "link",
  "input_url": "https://bit.ly/abc",
  "final_url": "https://sbi-rewards-claim.xyz/app.apk",
  "redirect_chain": ["https://bit.ly/abc", "https://sbi-rewards-claim.xyz/app.apk"],
  "score": 85,
  "band": "high",
  "verdict": "red",
  "is_direct_apk": true,
  "offer_apk_scan": true,
  "checks": [
    {"id": "direct_apk", "status": "flagged", "points": 30},
    {"id": "brand_lookalike", "status": "flagged", "points": 35},
    {"id": "domain_age", "status": "not_checked", "points": 0},
    {"id": "safe_browsing", "status": "not_checked", "points": 0}
  ],
  "reasons": ["..."],
  "limitations": "This is an automated check, not a guarantee.",
  "lang": "en"
}
```

### 7.4 `POST /message/check` (stretch)
Request: `{"text": "...", "lang": "hi"}`. Response includes score, band, matched signals, and `links_found` with their link reports.

### 7.5 `GET /report/{report_id}`
Returns a stored report (1 hour TTL) or `404`.

---

## 8. Rules and scoring (the core logic)

All values below are **defaults**. Store them in `rules.json`, `categories.json`, `patterns.json` and load them at startup. Do not hard-code them in Python.

### 8.1 Permission groups and points

| Group id | Detected by | Points |
|---|---|---|
| `sms` | `READ_SMS`, `RECEIVE_SMS`, `SEND_SMS`, `RECEIVE_MMS`, `RECEIVE_WAP_PUSH` | 20 |
| `contacts` | `READ_CONTACTS`, `WRITE_CONTACTS` | 15 |
| `call_log` | `READ_CALL_LOG`, `WRITE_CALL_LOG`, `PROCESS_OUTGOING_CALLS` | 20 |
| `microphone` | `RECORD_AUDIO` | 10 |
| `camera` | `CAMERA` | 8 |
| `location` | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION` | 8 |
| `accessibility` | a `<service>` that declares `android.permission.BIND_ACCESSIBILITY_SERVICE` | 25 |
| `overlay` | `SYSTEM_ALERT_WINDOW` | 20 |
| `install_packages` | `REQUEST_INSTALL_PACKAGES`, `INSTALL_PACKAGES` | 25 |
| `notification_listener` | a `<service>` that declares `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE` | 15 |
| `device_admin` | a `<receiver>` that declares `android.permission.BIND_DEVICE_ADMIN` | 20 |
| `calls` | `CALL_PHONE`, `ANSWER_PHONE_CALLS` | 10 |
| `all_files` | `MANAGE_EXTERNAL_STORAGE` | 10 |
| `boot` | `RECEIVE_BOOT_COMPLETED` | 0 (used by patterns only) |

Notes:
- Each **group** scores once, no matter how many of its permissions are declared.
- Accessibility, notification listener and device admin are **not** ordinary `uses-permission` entries. They are detected from `<service>` and `<receiver>` declarations, so the parser must read components.
- `REQUEST_INSTALL_PACKAGES` (lets an app ask to install other apps) and `INSTALL_PACKAGES` (privileged) are different permissions. Treat both as `install_packages`.

### 8.2 Score calculation

```text
score = 0
for each sensitive group present in the manifest:
    if group is EXPECTED for the app's category:  points = 0, status = "expected"
    else:                                          points = group.points, status = "unexpected"
    score += points

if (number of UNEXPECTED sensitive groups) > 5:    score += 10   (rule "many_sensitive")
if category != "unknown" and (any UNEXPECTED sensitive group):  score += 20   (rule "mismatch")

for each matched scam pattern:                     score += pattern.bonus
if impersonation detected:                         score += 30

score = min(score, 100)

band:  0-25  -> low    -> green  -> "safe_to_proceed"  (wording: "No major red flags found")
       26-60 -> medium -> yellow -> "review_carefully"
       61-100-> high   -> red    -> "do_not_install"

critical override: if any pattern with critical=true matched, or impersonation detected,
                   force verdict = red / do_not_install, even if score < 61.
```

Test vectors (must pass):

| Case | Category | Permission groups | Expected score |
|---|---|---|---|
| A | flashlight | sms, contacts, location, accessibility | 88 (20+15+8+25+20 mismatch) |
| B | flashlight | camera | 0 |
| C | navigation | location | 0 |
| D | unknown | sms | 20 (no mismatch penalty; low confidence) |
| E | flashlight | sms, contacts, location, microphone, overlay | 93 (20+15+8+10+20+20 mismatch) |
| F | flashlight | sms, overlay, accessibility | 20+20+25+20 mismatch = 85, plus banking_trojan 25 and otp_stealer 15 = 125, capped at 100; verdict red via critical override |

### 8.3 Category allowlists (`categories.json`)

Each category has `keywords` (matched against the app label and package name, case-insensitive) and `expected_groups`.

| Category id | Example keywords | Expected sensitive groups |
|---|---|---|
| `flashlight` | flashlight, torch, flash light | camera |
| `calculator` | calculator, calc | (none) |
| `wallpaper` | wallpaper, theme, launcher | (none) |
| `navigation` | maps, navigation, gps, route | location |
| `video_calling` | video call, meet, zoom, call | camera, microphone, contacts |
| `messaging` | chat, messenger, whatsapp, telegram | contacts, camera, microphone, location, calls |
| `sms_app` | sms, messages | sms, contacts |
| `dialer` | dialer, phone, caller | contacts, call_log, calls, microphone |
| `camera` | camera, photo, selfie | camera, microphone, location |
| `photo_editor` | editor, filter, collage | camera |
| `music_player` | music, player, mp3, radio | (none) |
| `browser` | browser, web | location, camera, microphone |
| `game` | game, puzzle, racing, ludo | (none) |
| `payments_upi` | pay, upi, wallet, bank | sms, camera, location, contacts |
| `file_manager` | file manager, files, explorer, cleaner | all_files |
| `screen_recorder` | screen record, recorder | microphone, overlay |
| `accessibility_tool` | accessibility, screen reader | accessibility, overlay |
| `food_or_ride` | food, delivery, taxi, ride, cab | location, calls |
| `social` | social, video, reels, shorts | camera, microphone, contacts, location |
| `unknown` | (fallback) | (none; mismatch penalty disabled) |

Important: `install_packages` and `device_admin` are expected **only** for app-store or device-management style apps. Add categories `app_store` and `device_management` for them if you need those cases, and keep them out of everything else.

Category detection order:
1. If the user chose a category, use it (`method = "user"`).
2. Else keyword match on app label, then package name (`method = "keyword"`, confidence medium).
3. Else `unknown` (`confidence = "low"`).
4. Optional (off by default): send label, package name and permission names to an LLM for a category guess (`method = "llm"`). Always label the result as an estimate.

### 8.4 Scam patterns (`patterns.json`)

| Pattern id | Condition | Bonus | Critical | Plain-language consequence |
|---|---|---|---|---|
| `otp_stealer` | `sms` AND (`notification_listener` OR `accessibility`) | +15 | yes | If this app is malicious, it could read your bank OTPs. |
| `banking_trojan` | `overlay` AND `accessibility` AND `sms` | +25 | yes | If this app is malicious, it could show fake bank screens and read your OTPs. |
| `spyware_profile` | `microphone` AND `camera` AND `location` AND `boot` | +15 | yes if the app has no launcher activity | If this app is malicious, it could record and track you in the background. |
| `dropper` | `install_packages` AND category not in (`app_store`, `file_manager`) | +10 | no | This app can ask to install other apps on your phone. |
| `device_admin_lock` | `device_admin` AND category not `device_management` | +15 | no | This app may be hard to uninstall. |
| `call_intercept` | `call_log` AND `calls` AND `microphone` | +10 | no | This app could see and record your calls. |

Always phrase consequences conditionally ("could", "if malicious"). The permissions alone do not prove bad intent.

### 8.5 Impersonation (`brands.json`)

Schema per brand:

```json
{
  "brand": "SampleBank",
  "aliases": ["samplebank", "sample bank"],
  "official_domains": ["samplebank.example"],
  "official_packages": ["com.samplebank.official"],
  "official_cert_sha256": []
}
```

- For the hackathon demo, use a **fictional** brand ("SampleBank") so no real logo or trademark is misused.
- To add real banks or government apps, take the official domains, package names and certificate fingerprints from the official Play Store listings and websites yourself. **Do not guess or copy values from memory.** Leave a field empty rather than invent it.
- Rule: if the label or package or domain contains an alias, but the package is not in `official_packages` (or the domain is not in `official_domains`), flag impersonation.

### 8.6 Explainability rule
Every point in `breakdown` must have a `reason_key` that exists in all message files. If a key is missing, the test suite must fail.

---

## 9. Link checker specification

### 9.1 Checks and points (`link_rules.json`)

| Check id | What it looks at | Points |
|---|---|---|
| `direct_apk` | Final URL ends with `.apk` or content-type is `application/vnd.android.package-archive` | 30 |
| `brand_lookalike` | Domain contains a brand alias (or edit distance to an official domain is 2 or less) but is not an official domain | 35 |
| `ip_host` | Host is a raw IP address | 25 |
| `punycode` | Domain contains `xn--` (possible look-alike characters) | 20 |
| `new_domain` | Domain registered less than 30 days ago (only if WHOIS is enabled and succeeds) | 25 |
| `suspicious_tld` | TLD in a configurable list (for example `.xyz`, `.top`, `.click`, `.icu`) | 10 |
| `no_https` | Scheme is `http` | 10 |
| `deep_subdomains` | More than 3 subdomain levels | 10 |
| `at_symbol` | `@` in the URL authority part | 15 |
| `scam_keywords` | Words like kyc, reward, claim, verify, update, gift, free, mod in domain or path | 10 per keyword, max 20 |
| `shortener` | Known URL shortener (informational) | 5 |
| `reputation_flagged` | Flagged by Safe Browsing, VirusTotal or URLhaus | 60 and critical |

Bands and the critical override work exactly as in Section 8.2.

### 9.2 Safe redirect expansion (mandatory security rules)
The backend fetches unknown URLs, so it must protect itself (SSRF protection):
- Allow only `http` and `https`, on ports 80 and 443.
- Resolve DNS **before** connecting and reject private, loopback, link-local, multicast and cloud-metadata addresses (for example `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`).
- Re-validate **every redirect hop**, not only the first URL.
- Maximum 5 redirects, 5 second timeout per request.
- Use a HEAD request first; if needed, a streamed GET that reads only headers and closes the connection. **Never download or store the body.**
- Send an honest User-Agent (for example `AppAutopsy-LinkChecker/1.0`).
- Rate limit the endpoint per IP.

### 9.3 Link-to-APK flow
If `is_direct_apk` is true, the result includes `offer_apk_scan: true`. The frontend shows a button "This link downloads an APK. Scan it too?". For the demo, let the user upload the APK manually (the backend does not auto-download APKs from the internet in the MVP).

### 9.4 Result wording
Use "Looks dangerous", "Some warning signs", "No red flags found in the checks we ran". Never "fake" or "real".

---

## 10. Localization (English, Hindi, Punjabi)

All text lives in `messages_*.json` and `src/i18n/*.json`. Use `{placeholders}` and keep the same keys in every file.

| Key | English | Hindi | Punjabi |
|---|---|---|---|
| `verdict.red` | Do not install | इंस्टॉल न करें | ਇੰਸਟਾਲ ਨਾ ਕਰੋ |
| `verdict.yellow` | Review carefully | ध्यान से जांचें | ਧਿਆਨ ਨਾਲ ਜਾਂਚੋ |
| `verdict.green` | No major red flags found | कोई बड़ा खतरा नहीं मिला | ਕੋਈ ਵੱਡਾ ਖ਼ਤਰਾ ਨਹੀਂ ਮਿਲਿਆ |
| `mismatch.generic` | A {category} app does not normally need {permission_label}. | एक {category} ऐप को आमतौर पर {permission_label} की ज़रूरत नहीं होती। | ਇੱਕ {category} ਐਪ ਨੂੰ ਆਮ ਤੌਰ 'ਤੇ {permission_label} ਦੀ ਲੋੜ ਨਹੀਂ ਹੁੰਦੀ। |
| `perm.sms` | Can read your text messages, including bank OTPs. | आपके SMS पढ़ सकता है, बैंक के OTP भी। | ਤੁਹਾਡੇ SMS ਪੜ੍ਹ ਸਕਦਾ ਹੈ, ਬੈਂਕ ਦੇ OTP ਵੀ। |
| `perm.contacts` | Can see your saved contacts. | आपके सेव किए हुए कॉन्टैक्ट देख सकता है। | ਤੁਹਾਡੇ ਸੇਵ ਕੀਤੇ ਸੰਪਰਕ ਵੇਖ ਸਕਦਾ ਹੈ। |
| `perm.accessibility` | Can see and control your screen and tap buttons for you. | आपकी स्क्रीन देख और कंट्रोल कर सकता है। | ਤੁਹਾਡੀ ਸਕ੍ਰੀਨ ਵੇਖ ਅਤੇ ਕੰਟਰੋਲ ਕਰ ਸਕਦਾ ਹੈ। |
| `perm.overlay` | Can draw over other apps, which can be used to fake bank screens. | दूसरे ऐप्स के ऊपर स्क्रीन दिखा सकता है, जिससे नकली बैंक स्क्रीन बन सकती है। | ਦੂਜੀਆਂ ਐਪਾਂ ਦੇ ਉੱਪਰ ਸਕ੍ਰੀਨ ਦਿਖਾ ਸਕਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਨਕਲੀ ਬੈਂਕ ਸਕ੍ਰੀਨ ਬਣ ਸਕਦੀ ਹੈ। |
| `pattern.otp_stealer` | If this app is malicious, it could read your bank OTPs. | अगर यह ऐप खतरनाक निकला, तो यह आपके बैंक के OTP पढ़ सकता है। | ਜੇ ਇਹ ਐਪ ਖ਼ਤਰਨਾਕ ਹੋਈ, ਤਾਂ ਇਹ ਤੁਹਾਡੇ ਬੈਂਕ ਦੇ OTP ਪੜ੍ਹ ਸਕਦੀ ਹੈ। |
| `link.brand_lookalike` | This link uses a name that looks like a bank, but it is not the bank's official website. | इस लिंक का नाम बैंक जैसा दिखता है, लेकिन यह बैंक की असली वेबसाइट नहीं है। | ਇਸ ਲਿੰਕ ਦਾ ਨਾਮ ਬੈਂਕ ਵਰਗਾ ਲੱਗਦਾ ਹੈ, ਪਰ ਇਹ ਬੈਂਕ ਦੀ ਅਸਲੀ ਵੈੱਬਸਾਈਟ ਨਹੀਂ ਹੈ। |
| `disclaimer` | Static analysis only. This is not a guarantee of safety. | यह सिर्फ़ एक स्टैटिक जांच है। यह सुरक्षा की गारंटी नहीं है। | ਇਹ ਸਿਰਫ਼ ਇੱਕ ਸਟੈਟਿਕ ਜਾਂਚ ਹੈ। ਇਹ ਸੁਰੱਖਿਆ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ ਹੈ। |

Have a native speaker review the Hindi and Punjabi text before the demo. Keep sentences short and avoid technical words.

Voice: `speechSynthesis` with `lang` set to `en-IN`, `hi-IN` or `pa-IN`. If no matching voice exists on the device, hide the Speak button for that language and show only text.

UI accessibility rules: never rely on color alone (use icon plus text label with the green/yellow/red banner), use large font sizes, and keep high contrast.

---

## 11. Demo assets and demo script

### 11.1 Demo APKs (safe, self-made)
Build **your own dummy apps**. Never use real malware. They only declare permissions; they contain no network code and do nothing harmful.

| Demo APK | Label | Declared permissions | Expected result |
|---|---|---|---|
| `flashlight_normal` | Super Flashlight (DEMO) | CAMERA, FLASHLIGHT | Green, score 0 |
| `flashlight_suspicious` | Super Flashlight (DEMO) | READ_CONTACTS, READ_SMS, ACCESS_FINE_LOCATION, RECORD_AUDIO, SYSTEM_ALERT_WINDOW, plus an empty accessibility service stub | Red, score 100, patterns matched |
| `maps_demo` | Maps Demo | ACCESS_FINE_LOCATION | Green, score 0 |
| `samplebank_rewards` | SampleBank Rewards (DEMO) | READ_SMS, SYSTEM_ALERT_WINDOW, package `com.fake.samplebank.rewards` | Red, impersonation flagged |

Rules for the demo apps:
- Put "DEMO" in the app label.
- The accessibility service stub is declared but has empty logic. Never enable it on a phone.
- Install only on a test device or emulator with no personal accounts.
- Do not distribute these APKs outside the team.

### 11.2 Demo flow for judges (about 3 minutes)
1. **Problem (30 s):** show a WhatsApp-style message: "SBI Reward Points APK, download now". Say: most people just tap Allow.
2. **Link check (30 s):** paste a demo look-alike link. Show the red result and the "Scan the APK too?" button.
3. **Suspicious APK (60 s):** upload `flashlight_suspicious`. Show the extracted permissions, the mismatch reasons and the red score. Toggle to Hindi and press Speak.
4. **Normal APK (30 s):** upload `flashlight_normal`. Show green and score 0 because permissions match the purpose.
5. **Report (15 s):** export or share the report.
6. **Honest close (15 s):** show the limitation line and say what is next (dynamic sandbox, on-device scanning).

Prepare a **screen recording** of the whole flow as a backup in case Wi-Fi or an API fails.

---

## 12. Security, privacy and limitations

### 12.1 Privacy
- APK files are stored only in a temp folder, with a random file name, and deleted immediately after analysis.
- Only the report JSON is kept, in memory, for a short time (default 1 hour). Message text is never stored.
- Reputation lookups for APKs use the **hash only**. The APK itself is never sent to third parties.
- Say clearly in the UI: "Your file is deleted after the check."
- Future work: on-device scanning so nothing leaves the phone.

### 12.2 Backend hardening
- Enforce max upload size and check ZIP magic bytes (`PK`) and presence of `AndroidManifest.xml`.
- Parse only; never run or install uploaded files.
- Set timeouts on parsing. Limit concurrent analyses.
- Enable CORS only for known origins. Add rate limiting.
- Apply the SSRF rules in Section 9.2 to every outbound fetch.
- Never log full URLs with tokens or message contents.

### 12.3 Honest limitations
- Static analysis only. It reads what the app **declares**, not what it does at runtime.
- A permission listed in the manifest shows what the app *can request*. Sensitive permissions must still be granted by the user on modern Android, and the tool does not know whether the user will grant them.
- Category detection is an estimate and can be wrong. Allowlists cause false positives (a legitimate app with unusual needs) and false negatives (malware that stays within a category's allowed set).
- A green result means "no major red flags found in these checks". It does not mean "safe".
- The tool cannot inspect code loaded dynamically after installation.

### 12.4 Ethics
- Do not build or distribute anything that behaves maliciously, even for demos.
- Do not present brand logos or real bank names as "fake" examples in ways that could mislead. Use fictional brands.
- In India, users can report cyber fraud at the national portal (cybercrime.gov.in) or by calling 1930. Include this in the report footer for red results.

---

## 13. Team roles and timeline

### 13.1 Roles
| Role | Owns |
|---|---|
| Frontend developer | Home, result screens, language toggle, voice, share/export |
| Backend developer | APK parser, API, upload safety, report store |
| Security/rules developer | Rules JSON, scoring, patterns, link heuristics, tests |
| Design and pitch lead | Wireframes, message text (EN/HI/PA), slides, demo script, research, competitor table |

### 13.2 Before the event (only if the hackathon rules allow pre-work; ask the organizers)
Safe categories of preparation that usually do not count as "pre-built code":
- Research, competitor comparison, problem statistics from credible sources (CERT-In, news).
- Wireframes, logo, color scheme, slide deck.
- This document, the rules design, the message text and the demo script.
- Environment setup practice, obtaining API keys, learning the libraries.
- Planning the demo APK design.

If code written before the event is **not** allowed, write it during the event and use this document plus the prompts in Section 15 to speed it up.

### 13.3 24-hour plan
| Hours | Goal | Owner |
|---|---|---|
| 0-2 | Repo, scaffold (Prompt 1), rules JSON (Prompt 2), task split | All |
| 2-6 | APK parser and upload endpoint (Prompts 3, 7) | Backend |
| 2-6 | Category, risk engine, patterns with tests (Prompts 4, 5) | Rules |
| 2-8 | Frontend home and result screens (Prompt 10) | Frontend |
| 6-10 | Explanations and localization (Prompt 6) | Rules + Design |
| 8-14 | Link checker (Prompt 8) | Backend + Rules |
| 10-15 | Demo APKs (Prompt 13) and integration | Design + Backend |
| 14-18 | Voice, report export, link-to-APK flow (Prompt 11) | Frontend |
| 18-21 | End-to-end testing, bug fixing, freeze features | All |
| 21-24 | Pitch practice, backup recording, sleep in shifts | All |

Rule: **feature freeze at hour 18.** After that, only fix bugs and polish.

---

## 14. Testing checklist

- [ ] All six scoring test vectors in Section 8.2 pass.
- [ ] Every `reason_key` exists in `messages_en.json`, `messages_hi.json` and `messages_pa.json`.
- [ ] Accessibility, notification listener and device admin are detected from components, not only `uses-permission`.
- [ ] Uploading a non-APK file (for example a renamed `.txt`) returns a clean error.
- [ ] Uploading an oversized file returns a clean error.
- [ ] The temp file is deleted even when parsing fails.
- [ ] SSRF tests: `http://127.0.0.1`, `http://169.254.169.254`, `http://localhost`, and a redirect to a private IP are all blocked.
- [ ] A short link expands correctly and the redirect chain is shown.
- [ ] Missing API keys produce `not_checked`, not a crash.
- [ ] The UI works on a phone-sized screen and never relies on color alone.
- [ ] The disclaimer appears on every result.
- [ ] Demo flow works offline or from the backup recording.

---
