# AGENTS.md — Build Contract for AI Coding Agents

**Project:** AppAutopsy
**Type:** 24-hour hackathon build
**Audience:** Any AI coding agent (Claude Code, Cursor, Copilot, Codex, Windsurf) and every human on the team.
**Status of this file:** This is the **authoritative build spec**. Where it disagrees with `AppAutopsy_Project_Documentation.md`, **this file wins**.

> **AMENDMENT 2026-09-24 — v1 ships as an offline native Android app (Kotlin/Compose), not a web app.**
>
> The team decision: the user we are building for receives an APK *on a phone*
> and will never open a laptop website to check it. v1 therefore runs the whole
> pipeline **on-device, offline**: Kotlin/Compose app + the pure analysis engine
> in `shared/` (Kotlin Multiplatform). Rules stay in the same JSON, the same
> scoring algorithm is ported 1:1 (`shared/src/commonMain/.../core/RiskEngine.kt`
> ≡ `backend/app/core/risk_engine.py`), and the same test vectors guard both.
>
> Consequences for this file (the sections below are already reconciled):
> - §5 "one scoring implementation" now means **one scoring *algorithm* with
>   one canonical JSON, mirrored by one pure Kotlin engine**; the Python engine
>   becomes a reference implementation + test harness, not the shipped product.
> - §7 the Android app replaces React/Vite as the v1 frontend.
> - The **link checker and reputation lookups are network features**: on-device
>   they run only when the user opts in per scan; every analysis of an APK
>   remains 100% offline, and SSRF rules (§3.2) apply unchanged to the opt-in
>   fetches. No WhatsApp bot, no server component in v1.
> - F14 crowd intel + F13 version diff live in the app's **local SQLite**
>   (same schemas, same `insufficient_data` guard). No cloud, so "people who
>   scanned this" is honestly labelled *on this device*.
> - APK parsing uses `PackageManager` archive inspection + a binary-AXML
>   decoder in `androidMain` (§F2's androguard guidance applies to the Python
>   reference path only; the cert-extraction and component-scan requirements,
>   including the dual accessibility signal, are unchanged).
> - **Vector A (flashlight + sms,contacts,location,accessibility) scores 100**,
>   not 88: sms+accessibility fires the critical `otp_stealer` pattern (+15) on
>   top of the 88, and the rules cap 103 → 100 red. The spec's 88 was a
>   pattern-blind subtotal; the Python suite already accepted [88, 100].
>   Nothing in §3.4 or §9 points was changed.
>
> Everything in **§3 (Non-Negotiable Rules), §9 (rules data) and §12
> (checklist)** still applies exactly as written, including: parse-only, no
> auto-download, zip-bomb caps, SSRF guard, `not_checked` honesty, banned
> strings, reason-key freeze. This amendment changes *where the code runs*,
> never *what is allowed*.

---

## 0. How an agent must use this file

1. Read this whole file before writing any code.
2. Work in the order given in **Section 11 (Implementation Plan)**. Do not jump ahead.
3. After every task: run `make test`, then commit to Git. Never batch multiple features into one commit.
4. If a requirement here is ambiguous, **ask the human before inventing a design**. Do not silently improvise architecture.
5. Never delete or weaken a rule in **Section 3 (Non-Negotiable Rules)** to make a test pass.
6. If a task looks impossible, say so plainly and stop, rather than shipping something that only appears to work.

**Agent anti-patterns to avoid:** building stretch features before MVP works; adding machine learning; adding a database where a dict suffices; rewriting rules in Python instead of JSON; "fixing" a failing security test by loosening the check; writing code that downloads or executes an APK.

---

## 1. The project idea

### 1.1 One line
AppAutopsy checks an Android APK — or a download link, or a scam message — **before installation**, and explains in plain Hindi, Punjabi or English whether the app's permissions match its real purpose.

**Tagline:** Know what an app can do before it does it.

### 1.2 Problem
People in India receive APK files and links over WhatsApp and Telegram: "SBI Reward Points APK", "PM Yojana APK", "Modded Instagram". Android asks for SMS, contacts, accessibility and overlay permissions. Most users cannot judge what those mean, so they tap **Allow**. Consequences: stolen bank OTPs, leaked contacts and photos, silent spying, unauthorized transactions.

### 1.3 Users
- Ordinary Android users, especially parents and grandparents.
- Users more comfortable in Hindi or Punjabi than English.
- Anyone who receives an APK or link from an unknown sender.

### 1.4 What it does
1. Parses the APK manifest — permissions, services, receivers, activities, signing certificate.
2. Guesses the app's category (flashlight, calculator, dialer, payments...).
3. Asks the core question: **does this app need these permissions for its advertised job?**
4. Detects dangerous permission combinations and known attack patterns.
5. Detects **repackaging** — a real app name with someone else's signature.
6. Produces a 0–100 risk score, a green/yellow/red verdict, and plain-language reasons.
7. Checks links: look-alike domains, direct APK downloads, redirects, reputation.
8. Gives an **action playbook**: what to do right now if it's dangerous.

### 1.5 Why this wins (the pitch wedge — use ONE, not three)
> **"The mod-APK and repackaging detector — in your language."**

India's dominant real-world distribution channel for malicious Android apps is **repackaged/mod APKs**: a genuine app name, rebuilt with a stranger's signature, carrying extra permissions. Everyone scans for "is it a virus". Almost nobody answers *"is this the app it claims to be, and does it need what it asks for"* — and no consumer tool answers it in Hindi or Punjabi.

**Secondary strengths** (mention after the wedge, never as the lead):
- **Every point traces to a readable rule.** No ML, no black box. Auditable by a non-programmer. This is a real differentiator against ML-based scanners.
- Explainability in three languages, with voice.
- Honest calibration: the tool says when it is unsure.

### 1.6 Positioning — never claim these
Say **"technical tools exist, but they're built for experts"**. Never say "nothing like this exists".

| Existing tool | What it does | Gap AppAutopsy fills |
|---|---|---|
| APK Analyzer (open source) | Shows manifest, permissions, certs | Technical output, no purpose-vs-permission verdict |
| MobSF (India) | Full static + dynamic analysis for experts | Built for professionals, not ordinary users |
| DDriveMode APK Analyzer | Local APK inspection, risk score, report export | Closest competitor. No purpose-vs-permission logic, no repackaging check, no local languages, no messaging flow |
| VirusTotal | Multi-engine malware scan | Answers "is it known bad", not "why, in plain words" |

### 1.7 Forbidden claims (in UI, slides, code comments, commit messages, README)
- "We detect every virus." / "We guarantee an APK is safe."
- "We analyze runtime behaviour." / "We monitor every app on the phone."
- The strings **"100% safe"** and **"100% fake"** — ever, anywhere.
- Any claim that static analysis proves intent.

Every report surface must carry: `Static analysis only. This is not a guarantee of safety.`

---

## 2. Scope

### 2.1 MVP — must work end to end before anything else
APK upload → parse → category → purpose-vs-permission engine → patterns → score → verdict → localized reasons → report. Plus link checker with SSRF guard, and the link-to-APK handoff.

### 2.2 Committed feature set (MVP + the additions that make it win)

| # | Feature | Tier |
|---|---|---|
| F1 | APK upload and safe handling | MVP |
| F2 | Manifest extraction (perms, components, cert) | MVP |
| F3 | Dangerous-permission classification | MVP |
| F4 | Category detection with confidence | MVP |
| F5 | Purpose-vs-permission mismatch engine | MVP |
| F6 | Scam-pattern detection | MVP |
| F7 | Risk score with per-point reasons | MVP |
| F8 | Green/yellow/red verdict + recommendation | MVP |
| F9 | EN / HI / PA explanations | MVP |
| F10 | Link checker (look-alike, direct APK, redirects) | MVP |
| F11 | Link-to-APK handoff | MVP |
| F12 | **Repackaging / signer-mismatch detection** | **Wedge** |
| F13 | **Version-diff tracker** (what an update added) | Committed |
| F14 | **Crowd-hash intelligence** | Committed |
| F15 | **Action playbook on red results** | Committed |
| F16 | **Calibration card ("reasons this might be wrong")** | Committed |
| F17 | **WhatsApp Guardian bot** | Committed |
| F18 | QR code scanner (frontend decode) | Cheap win |
| F19 | Minimum-permission prescription | Cheap win |
| F20 | Voice read-out (speechSynthesis) | Stretch |
| F21 | Report export (PDF/JSON) + share | Stretch |
| F22 | Scan history in localStorage | Stretch |
| F23 | Message scam checker | Stretch |
| F24 | DEX string extraction (hard-coded IPs, bot URLs) | Optional |

### 2.3 Explicit non-goals for v1
- **No machine learning. No LLM in the scoring path.** Rules only. (An LLM may *suggest* a category behind a flag, clearly labelled an estimate, never affecting score.)
- No dynamic analysis, no sandbox, no emulator.
- No auto-downloading of APKs from the internet in MVP or committed tiers.
- No user accounts, no cloud storage of APKs.
- No iOS, no desktop.

---

## 3. Non-Negotiable Rules (agents must not breach these)

These are correctness and safety requirements, not preferences. Weakening any of them is a build failure.

### 3.1 Safety
1. **Never execute, install, unpack-and-run, or `subprocess` an uploaded file.** Parse only.
2. **Never auto-download an APK from a URL** in MVP/committed tiers. The link checker reads headers only, never bodies.
3. **SSRF guard is mandatory and must never be bypassed, disabled, or short-circuited** — not "temporarily for the demo", not behind an env flag. See 3.2.
4. **Zip-bomb guard:** read only named zip members (`AndroidManifest.xml`, `META-INF/*`, `resources.arsc`). Cap each member's decompressed size (default 10 MB) and total decompressed across members (default 50 MB). Cap entry count. Never extract the archive to disk.
5. **APK bytes are never sent to a third party.** Reputation lookups send the **SHA-256 hash only**.
6. **Temp files are deleted in a `finally` block**, on every path including exceptions and timeouts.
7. **Never log** file contents, message text, full URLs containing query tokens or query strings that may hold personal data, or API keys.
8. No `eval`, no `exec`, no `pickle` on untrusted data, no shell string interpolation. Query parameters are never concatenated into shell commands.
9. Report IDs are opaque, generated from a CSPRNG, and validated against `^[a-f0-9]{12}$` before any lookup (prevents path/format injection).
10. Uploaded filenames are never used on disk. Generate a random name with `secrets.token_hex`.

### 3.2 SSRF rules (apply to every outbound fetch, every redirect hop)
- Only `http` and `https`; only ports 80 and 443.
- Resolve DNS **first**, then **reject** private, loopback, link-local, multicast, reserved and cloud-metadata ranges: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `100.64.0.0/10`, `0.0.0.0/8`, `::1`, `fc00::/7`, `fe80::/10`, `::ffff:0:0/96`.
- **Re-validate every redirect hop**, not just the first URL. Follow redirects manually, not via the HTTP client's auto-follow.
- Max 5 redirects, 5 s timeout per request, max response header size capped.
- `HEAD` first; if needed a streamed `GET` that reads headers only and closes. **Never read the body.**
- Honest User-Agent: `AppAutopsy-LinkChecker/1.0`.
- Rate-limit the endpoint per IP.

### 3.3 Data and secrets
- Secrets live in `.env` only. `.env` is in `.gitignore` and **never** committed. Ship `.env.example` with empty values.
- No API key, token or password appears in source, tests, fixtures, logs or error messages.
- Missing API key ⇒ the check returns `status: "not_checked"`, score contribution 0, **no crash**. Never fail a request because an optional provider is unavailable.
- The in-memory report store holds only report JSON. Never APK bytes, never message text.
- Crowd-hash intelligence stores **aggregate counts keyed by SHA-256** only. No IPs, no device IDs, no user identifiers, no timestamps tied to a person.

### 3.4 Honesty (this is a rule, not a tone preference)
- Every report says it is static analysis and not a guarantee.
- Pattern consequences are phrased conditionally: "if this app is malicious, it **could**...".
- `unknown` category ⇒ **no** mismatch penalty, low-confidence badge, and an explicit note that the category could not be determined.
- When a check did not run, say `not_checked` in the report. Never silently skip a check and imply it passed.
- Never assert a package, domain or certificate fingerprint you have not sourced. **Leave a field empty rather than invent it.**

### 3.5 Content
- Demo apps are self-made, carry `DEMO` in the label, and contain no harmful code.
- Impersonation demos use a **fictional** brand (`SampleBank`). Never real bank or government logos.
- Never ship, fetch or link real malware, even as a test fixture.

---

## 4. Feature specifications — how each one works

### F1. APK upload and safe handling
**How it works.** Multipart POST. Validate in this order, cheapest first, so a bad request dies fast:
1. `Content-Length` ≤ `MAX_APK_MB` (default 100) — reject before reading the body.
2. Stream to a temp file in chunks (64 KB). **Do not read the upload into memory** — a 100 MB APK should cost O(chunk) RAM, not O(file).
3. Check ZIP magic bytes `PK\x03\x04`.
4. Confirm the archive contains `AndroidManifest.xml`.
5. Compute SHA-256 in the same streaming pass — one read, two outputs.

**Implementation.** `utils/file_safety.py`, `core/hasher.py`. Temp file via `tempfile.NamedTemporaryFile(delete=False)` inside a `try/finally`. Wrap the whole handler so the `finally` always unlinks the path.

**Complexity.** Time O(n) in file size for hashing and copying. Space O(1) — chunk buffer only.

**Failure modes to handle.** Empty file, renamed `.txt`, oversized, truncated zip, not-a-zip. Each returns a clean 4xx with an error code, never a 500.

---

### F2. Manifest extraction
**How it works.** Read the compiled manifest and normalize it into a `ParsedApk` Pydantic model.

> **Correction to the original doc — read this carefully.** `AndroidManifest.xml` inside an APK is **compiled binary AXML**, not text XML. There is **no "just read it raw" fallback.** The fallback chain must be:
> 1. `androguard` — `APK.get_android_manifest_axml()` → decode to XML → parse with `ElementTree`.
> 2. Fallback decoder — `androguard.core.axml.AXMLPrinter`, or `pyaxmlparser`, or `apkutils2`.
> 3. Only if all decoders fail: return a clean `manifest_unreadable` error.
>
> Anyone who plans to "fall back to reading raw XML" will lose an hour. This is the single most important correction in this file.

**Performance, and this matters a lot.** Androguard's `APK` class lazily analyzes DEX — that path costs **20–40 seconds** on a large APK. You do **not** need it for MVP. Use only:
- `APK.get_android_manifest_axml()` — manifest
- `APK.get_app_name()` — label
- `APK.get_certificates_der_v3()` / `get_certificates_der_v2()` / `get_certificates()` — certs
- `APK.get_files()` — zip member names only

**Never call** `APK.get_dex()`, `dvm`, or the analysis object on the hot path. Manifest-only parsing is sub-second. If you accidentally pull in full DEX analysis, you will wonder why scanning takes a minute.

**Extract:** label, package name, version name/code, min/target SDK, `uses-permission` and `uses-permission-sdk-*`, `uses-feature`, services (with `android:permission` **and** `<meta-data android:name="android.accessibilityservice">` / `...notificationlistener`), receivers (with `BIND_DEVICE_ADMIN`), activities, launcher-activity presence, signing-cert SHA-256 list.

> **Second correction.** Do **not** detect accessibility only via `android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"`. Real banking trojans frequently declare the service with a `<meta-data android:name="android.accessibilityservice" android:resource="@xml/accessibility_config"/>` instead. **Check both signals.** This is the highest-value detection in the whole system — it is what enables OTP theft — so a miss here is expensive. Apply the same dual check to notification listeners.

> **Third correction.** Signing-certificate extraction is the **#1 source of unhandled exceptions** in APK parsers (missing `META-INF` signature files, v1-only vs v2/v3-only APKs, malformed `CERT.RSA` blocks). Wrap it individually: on any failure set `signing_cert_sha256: []` and mark `cert_check: "not_checked"`. **Never let cert parsing 500 the request.**

**Complexity.** Time O(e) in manifest element count; space O(e). Certs O(1) per signature block.

---

### F3. Permission classification
Map each declared permission to a **group**. Groups, not individual permissions, carry points — so an app declaring `READ_SMS` + `RECEIVE_SMS` + `SEND_SMS` pays the `sms` cost **once**.

**Implementation.** `rules.json` holds `{"group_id": {"permissions": [...], "points": N, "label_key": "..."}}`. Build a single flat `dict[str, str]` (permission → group) **once at startup**, not per request. Then classification is a single pass:

```python
present_groups = {PERM_TO_GROUP[p] for p in declared if p in PERM_TO_GROUP}
```

That is **O(P)** time and O(P) space, versus the O(P × G) nested loop that appears naturally if you write it naively. With ~300 permissions and ~15 groups the naive version is 4500 comparisons per scan; the dict version is 300 lookups. Same answer, 15× less work. Do it the dict way.

**Component-derived groups** (`accessibility`, `notification_listener`, `device_admin`) come from the component scan in F2 and are unioned into the same set — they are not `uses-permission` entries and will never appear in the permission list.

---

### F4. Category detection with confidence
**How it works.** Resolve category in strict priority order:
1. User-selected → `method: "user"`, `confidence: "high"`.
2. Keyword match on **label** → `method: "keyword"`, `confidence: "medium"`.
3. Keyword match on **package name** → `method: "keyword"`, `confidence: "low"` (package names are noisier than labels).
4. Otherwise `unknown`, `confidence: "low"`, `mismatch_penalty_disabled: true`.

> The original doc gives step 2 and 3 the same confidence. Separate them — label matching is materially more trustworthy and the calibration card (F16) depends on this being honest.

**Performance.** Pre-lowercase the input once. Precompute the keyword index at startup as `dict[str, str]` (keyword → category). Match by tokenizing the label and testing membership — **O(T)** in token count, not O(C × K) over every category's every keyword. Never run `rapidfuzz` on the category path; it is O(n×m) per candidate and unnecessary for this job.

---

### F5. Purpose-vs-permission engine (the core)
```
score = 0
unexpected = present_sensitive_groups - category.expected_groups

for g in present_sensitive_groups:
    points = 0 if g in category.expected_groups else GROUP_POINTS[g]
    breakdown.append(rule=f"group:{g}", points=points, status=...)
    score += points

if len(unexpected) > 5:                       score += 10   # "many_sensitive"
if category != "unknown" and unexpected:      score += 20   # "mismatch"
```
- Expected sensitive permission ⇒ 0 points, labelled `Expected for this type of app`.
- Unexpected ⇒ full points, labelled `Unexpected`.
- Mismatch penalty fires **once**, regardless of how many unexpected groups exist.
- `unknown` category ⇒ no mismatch penalty at all, low-confidence badge.

**Implementation.** `core/risk_engine.py` must be **pure functions**: `(ParsedApk, Category, Rules) -> ScoreResult`. No I/O, no clock, no globals, no network. This is what makes it testable and makes rule changes safe.

**Complexity.** Time O(G) set operations. Space O(G). Constant with respect to APK size — the engine only ever sees the group set, never the file.

**Verified test vectors (must pass exactly):**

| Case | Category | Groups present | Score | Notes |
|---|---|---|---|---|
| A | flashlight | sms, contacts, location, accessibility | **100** | 20+15+8+25 +20 mismatch = 88 pattern-blind; +15 `otp_stealer` (critical) = 103 → capped 100, red |
| B | flashlight | camera | **0** | expected ⇒ 0 |
| C | navigation | location | **0** | expected ⇒ 0 |
| D | unknown | sms | **20** | no mismatch penalty; low confidence |
| E | flashlight | sms, contacts, location, microphone, overlay | **93** | 20+15+8+10+20, +20 mismatch |
| F | flashlight | sms, overlay, accessibility | **100** | 20+20+25+20=85; +25 banking_trojan +15 otp_stealer = 125 → capped 100, red via critical override |

---

### F6. Scam patterns
Matched against the `present_groups` set. Each pattern is a set of group ids; a match is a subset test.

```
for pattern in PATTERNS:            # precompiled at startup
    if pattern.requires <= present_groups:
        matched.append(pattern)
```

**Complexity.** O(K × G) with tiny constants, and you can drop it to O(K) by precomputing `frozenset` intersections. Do the simple version; it is microseconds either way. The point is that pattern matching **never touches the APK bytes** — it operates on an already-extracted set.

| Pattern | Condition | Bonus | Critical |
|---|---|---|---|
| `otp_stealer` | sms ∧ (notification_listener ∨ accessibility) | +15 | yes |
| `banking_trojan` | overlay ∧ accessibility ∧ sms | +25 | yes |
| `spyware_profile` | microphone ∧ camera ∧ location ∧ boot | +15 | yes *if no launcher activity* |
| `dropper` | install_packages ∧ category ∉ {app_store, file_manager} | +10 | no |
| `device_admin_lock` | device_admin ∧ category ≠ device_management | +15 | no |
| `call_intercept` | call_log ∧ calls ∧ microphone | +10 | no |

---

### F7/F8. Score, band, verdict
```
score = min(score, 100)

band:  0–25    low     green    safe_to_proceed    "No major red flags found in the checks we ran"
       26–60   medium  yellow   review_carefully
       61–100  high    red      do_not_install

critical override: any critical pattern OR impersonation OR signer mismatch
                   ⇒ force red / do_not_install regardless of score
```
**Every** entry in `breakdown` carries a `reason_key` that exists in all three message files. This is test-enforced (Section 12).

---

### F12. Repackaging / signer-mismatch detection ← **the wedge**

**Why it matters.** A repackaged app keeps a trusted name (`com.whatsapp`, "Instagram") but is rebuilt and re-signed by an attacker, with extra permissions added. This is how mod APKs and most Indian Android scams actually ship.

**How it works — three independent signals:**

1. **Known-brand signer mismatch.** Same logic shape as impersonation, but keyed on the signing certificate:
   ```
   if brand alias appears in label/package AND official_packages known:
       if package NOT in official_packages:            → impersonation (existing rule)
       elif cert_sha256 NOT in official_cert_sha256:   → repackaged  ← new
   ```
2. **Package-name collision.** If a package name exists in `packages.json` for a *different* app label than the one declared, that is a repackaging signal.
3. **Signer changed since last scan.** If `package_history` holds a prior cert for this package and it differs now — same app, new signer — that is the strongest signal available and requires no brand data at all.

**Criticality.** `repackaged_signer` is a **critical** pattern ⇒ forces red.

**Implementation.**
- Extend `brands.json` with `official_cert_sha256: []`.
- Ship `tools/collect_certs.py`. The team runs it **against APKs they obtain themselves from official sources** (the Play Store listing of the real app, the vendor's own download page). It prints fingerprints to paste into `brands.json`.

> **Hard rule for agents:** **Never invent, guess, or recall a certificate fingerprint from memory.** Do not fill `official_cert_sha256` with a plausible-looking hex string. An empty list means "we cannot check this brand yet" — which is correct and honest. A fabricated fingerprint means every legitimate app of that brand gets flagged as malware, which is worse than no check at all. Leave it empty.

**Demo value.** Scan a benign APK, rename the package to a known brand, sign it with a debug key → instant red: *"This claims to be SampleBank but it was signed by a different developer."* Ten seconds, undeniable, and no competitor in your comparison table does it.

**Complexity.** O(1) dict/set lookups after cert extraction. Parse cost unchanged.

---

### F13. Version-diff tracker
**How it works.** Store a manifest snapshot per package name and diff on the next scan of the same package.

**Store schema (SQLite, `intel.db`):**
```sql
CREATE TABLE package_history (
  package      TEXT PRIMARY KEY,
  label        TEXT,
  version_code INTEGER,
  cert_sha256  TEXT,
  groups_json  TEXT,        -- JSON array of present group ids
  seen_at      TEXT
);
```

**Diff output:** groups **added**, groups **removed**, version-code change, and **cert change**.

**Why cert-change-across-versions belongs here.** "Same package name, different signer than last time" is a textbook repackaging indicator, and it is the same underlying signal as F12 signal 3. Implement it once in a shared helper `core/signer_history.py` and consume it from both features. Do not write it twice.

**Demo line:** *"Last week this app could only use the camera. This update added SMS access. That's worth asking about."*

**Complexity.** O(G) set difference. Space O(1) per package — store group ids, never the manifest.

**Edge cases.** First scan of a package ⇒ `no_history`, not an error. Version code missing ⇒ skip the version check, keep the group diff.

---

### F14. Crowd-hash intelligence
**How it works.** Aggregate, privacy-preserving counter keyed on SHA-256.

```sql
CREATE TABLE hash_stats (
  sha256    TEXT PRIMARY KEY,
  label     TEXT,
  scans     INTEGER DEFAULT 1,
  red_count INTEGER DEFAULT 0,
  first_seen TEXT,
  last_seen  TEXT
);
-- UPSERT:
INSERT INTO hash_stats (sha256, label, scans, red_count, first_seen, last_seen)
VALUES (?, ?, 1, ?, ?, ?)
ON CONFLICT(sha256) DO UPDATE SET
  scans = scans + 1,
  red_count = red_count + excluded.red_count,
  last_seen = excluded.last_seen;
```

Report gains: `"people_who_scanned_this": 412, "percent_told_never_install": 89`.

**Why it wins.** Turns a one-shot tool into something with a network effect, and produces the most memorable demo line you can get: *"412 people scanned this exact file today. 89% were told not to install it."*

**Privacy.** Counts only. No IPs, no device IDs, no per-user rows. A hash is not personal data; an aggregate count is not either. Keep it that way.

**Complexity.** O(1) indexed lookup. Space O(distinct hashes) — tiny rows.

**Honesty guard.** If `scans < 5`, return `insufficient_data` rather than a misleading percentage. A "100% dangerous" reading off one scan is noise, and a judge will catch it.

---

### F15. Action playbook
**How it works.** Static, localized JSON keyed by verdict band and by which patterns matched. Not a wall of red text — a short, ordered, actionable list.

Red + `otp_stealer`:
1. Do not install this app.
2. If you already installed it, remove it now (Settings → Apps → *name* → Uninstall).
3. If you shared an OTP with anyone, tell your bank immediately.
4. Report the fraud: call **1930** or visit **cybercrime.gov.in**.

**Implementation.** `guidance/playbook.py` + `playbook_en/hi/pa.json`. Purely presentational; contributes **0 points** and never changes the verdict.

**Why it belongs in the build.** A verdict doesn't change behaviour; an instruction does. It is one hour of work and it is also your ethics section made visible to judges.

---

### F16. Calibration card — "reasons this might be wrong"
**How it works.** Derive a list of genuine uncertainty sources and print them next to the verdict:
- Category `unknown` or `confidence: low` ⇒ "we could not confidently identify what kind of app this is"
- Any check with `status: "not_checked"` ⇒ name it
- No launcher activity ⇒ "the purpose of this app is unclear"
- Category allowlist was used ⇒ "some legitimate apps need unusual permissions; this can produce false alarms"

**Implementation.** `core/calibration.py`, pure function over the report. **0 points, never changes the verdict.**

**Why it wins.** Calibrated honesty is rare in hackathon projects and extremely rare in security tools. It lands hard with judges who know the domain, and it is consistent with everything in Section 3.4.

---

### F17. WhatsApp Guardian bot
**How it works.** The person who needs this most is a parent who will never open a website — but will forward a suspicious link to a number.

Flow:
```
User forwards link/APK → WhatsApp → webhook → existing pipeline → reply in their language
```

**Implementation.** `bot/whatsapp.py`.
- `GET /api/v1/bot/whatsapp` — webhook verification (`hub.challenge` echo).
- `POST /api/v1/bot/whatsapp` — receive message.
- **Verify `X-Hub-Signature-256` HMAC-SHA256 against the app secret before parsing the body.** Reject on mismatch. This is a security requirement, not a nicety — an unverified webhook is an open door.
- Text ⇒ detect and extract URLs ⇒ `link/` pipeline.
- Media (`document` with `mime_type: application/vnd.android.package-archive`) ⇒ resolve media ID via Graph API, download with a token, enforce the **same** size cap, feed the **same** `core/` pipeline, delete immediately.
- Reply via template message, in the sender's language where detectable, else English.

**Reuse rule.** The bot must call the *existing* pipeline functions. Do **not** fork the risk engine for the bot — one scoring implementation, one set of rules.

**Cost.** WhatsApp Cloud API free tier / Twilio sandbox is sufficient for a demo. The bot is **demo-critical path optional** — if it is not working by hour 20, cut it and keep the recording.

**Complexity.** Same as the web pipeline; the bot adds no new analysis cost. Per-message cost O(pipeline), no state.

---

### F18. QR scanner
**How it works.** Fake exam-result and scheme posters with QR codes are a major Indian distribution channel. Decode in the browser with `jsQR` from a `<video>` frame, then POST the decoded URL to the existing `/link/check`. **No backend work at all.**

**Implementation.** `components/QrScanner.jsx`. Handle camera-permission denial with a clear message and a manual-URL fallback.

---

### F19. Minimum-permission prescription
**How it works.** From the category's `expected_groups`, state the minimum the app needs: *"A flashlight app can do its job with only: Camera."* Novel framing — the tool doesn't just diagnose, it prescribes.

**Implementation.** Pure function over `Category`. **0 points.** Copy in `messages_*.json` under `prescription.*`.

---

### Remaining features
- **F20 Voice.** `speechSynthesis`, `lang` = `en-IN` / `hi-IN` / `pa-IN`. If no matching voice exists, **hide the button** for that language and show text only. Always show text regardless.
- **F21 Export.** Printable report (`window.print()` → Save as PDF) plus JSON download. Filename: `appautopsy-<report_id>.json`.
- **F22 History.** `localStorage`, report summaries only. **Never** store APK bytes, message text or full query strings.
- **F23 Message checker.** Rule-based: urgency phrases, KYC/account-block threats, OTP/PIN/CVV requests, prize claims, links, APK mentions. Extracted links go through the link checker. Message text is **never stored or logged**.
- **F24 DEX strings.** Only if time remains. Expensive — cap at N strings and stream, do not materialize the whole DEX string pool.

---

## 5. Architecture and data flow

**v1 (post-amendment 2026-09-24): offline native Android app.** The web layout
is kept below for the Python reference implementation, which remains the test
harness and the fallback pitch demo if the build target changes.

```text
                 USER (on an Android phone, no network required)
   picks APK / pastes link / pastes message
                              |
                              v
        ANDROID APP (Kotlin + Jetpack Compose)  —  androidApp/
        EN / HI / PA UI, voice, QR, playbook — everything client-side
                              |  in-process calls
                              v
        SHARED ENGINE (Kotlin Multiplatform, PURE)  —  shared/
      +----------------+-------------+--------------+----------------+
      v                v             v              v                v
  APK PIPELINE     LINK PIPELINE  MESSAGE      INTEL (local      CALIBRATION
  (AXML decode,    (SSRF guard,   CHECKER      SQLite:            + PLAYBOOK
   cert, groups)    opt-in net)   (F23)        hash_stats,
                                               package_history)
      \________ all share core/RiskEngine.kt — one scoring algorithm ________/

   REFERENCE IMPLEMENTATION (not shipped in v1):
   backend/ FastAPI + core/risk_engine.py — mirrors the Kotlin engine,
   runs the shared JSON rule vectors, powers pytest + tools/check_i18n.py.
   Canonical rules live in /data; tools/sync_rules.py mirrors them to
   backend/app/data and androidApp assets — never hand-edit a copy.
```

```text
   (reference / fallback web deployment — pre-amendment layout)
                 USER uploads APK / pastes link (browser)
                              v
              FRONTEND (React + Vite + Tailwind)
                              v  REST JSON / multipart
                   BACKEND (FastAPI) → APK/LINK/MESSAGE pipelines + INTEL
      \___________ all share core/risk_engine.py ___________/
```

**The one architectural rule that matters:** there is exactly **one scoring algorithm**, expressed once per runtime (Kotlin `shared/core/RiskEngine.kt` ≡ Python `backend/app/core/risk_engine.py`), driven by **one canonical set of rules** (`/data/*.json`, mirrored by `tools/sync_rules.py --check`), with **one explanation builder**. The two implementations are kept equal by the shared test vectors — if a vector fails in either language, the rule change is wrong until both agree. The moment a *third* scoring path appears, or a rules file is hand-edited on one side, results stop being reproducible — which destroys the project's core claim.

**APK pipeline:**
```
Upload → validate (size → magic → manifest present) → temp file (random name)
  → SHA-256 (streaming, same pass) → parse manifest + components + cert
  → normalize to ParsedApk → category detect → group mapping
  → risk engine (pure) → patterns → impersonation → repackaging
  → [intel: hash_stats upsert, package_history diff]
  → calibration + playbook → explanation builder (i18n)
  → report JSON → store (TTL 1h) → DELETE TEMP FILE (finally)
```

**Link pipeline:**
```
URL → normalize/validate (http/https only) → offline heuristics
  → SSRF-guarded redirect expansion (max 5 hops, 5 s, headers only)
  → direct-APK detection → optional reputation (hash/URL only)
  → score + band + reasons → if direct APK: offer_apk_scan = true
```

**Design principles:**
- **Deterministic.** Same input ⇒ same score, forever. No randomness, no clock in scoring, no network in scoring.
- **Rules in JSON, not code.** Tuning must never require a Python edit.
- **Graceful degradation.** Optional provider down ⇒ `not_checked`, score 0, no crash.
- **Fail closed on security, fail open on intel.** SSRF guard fails closed. A missing VirusTotal key fails open with `not_checked`.
- **Privacy by default.** APKs die immediately; only report JSON survives, briefly.

---

## 6. Directory structure

```text
appautopsy/
├── AGENTS.md                        # this file — authoritative spec
├── README.md
├── CONTEXT.md                       # condensed project context for AI tools
├── Makefile                         # make dev / test / lint / freeze-check
├── .gitignore                       # includes .env, *.apk, intel.db, __pycache__
├── .env.example                     # empty values only
├── docker-compose.yml               # optional
│
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, router registration, startup load of rules
│   │   ├── config.py                # env-driven settings (Pydantic BaseSettings)
│   │   │
│   │   ├── api/
│   │   │   ├── routes_apk.py        # POST /api/v1/apk/analyze
│   │   │   ├── routes_link.py       # POST /api/v1/link/check
│   │   │   ├── routes_message.py    # POST /api/v1/message/check
│   │   │   ├── routes_report.py     # GET  /api/v1/report/{id}
│   │   │   ├── routes_intel.py      # GET  /api/v1/intel/hash/{sha256}
│   │   │   └── routes_bot.py        # GET/POST /api/v1/bot/whatsapp
│   │   │
│   │   ├── core/                    # ← PURE. No I/O. No network. No clock.
│   │   │   ├── apk_parser.py        # androguard wrapper → ParsedApk (manifest-only path)
│   │   │   ├── axml.py              # binary AXML decode + decoder fallback chain
│   │   │   ├── components.py        # services/receivers incl. meta-data accessibility signal
│   │   │   ├── hasher.py            # streaming SHA-256
│   │   │   ├── category.py          # detection + confidence
│   │   │   ├── risk_engine.py       # scoring — pure functions, the heart of the system
│   │   │   ├── patterns.py          # scam-pattern matching
│   │   │   ├── impersonation.py     # brand look-alike (APK + domain)
│   │   │   ├── repackaging.py       # F12: signer mismatch + package collision
│   │   │   ├── signer_history.py    # shared cert-change helper (F12 signal 3 + F13)
│   │   │   ├── calibration.py       # F16
│   │   │   ├── explain.py           # builds localized reasons + recommendation
│   │   │   ├── playbook.py          # F15
│   │   │   ├── prescription.py      # F19
│   │   │   └── rules_loader.py      # loads + validates JSON at startup, builds indices
│   │   │
│   │   ├── link/
│   │   │   ├── normalize.py
│   │   │   ├── heuristics.py        # offline checks
│   │   │   ├── expander.py          # SSRF-safe manual redirect follower
│   │   │   ├── reputation.py        # Safe Browsing / VirusTotal / URLhaus adapters
│   │   │   └── scorer.py
│   │   │
│   │   ├── message/
│   │   │   └── checker.py           # F23
│   │   │
│   │   ├── intel/                   # SQLite-backed, aggregate-only
│   │   │   ├── db.py                # connection, schema migration, WAL
│   │   │   ├── hash_stats.py        # F14
│   │   │   ├── package_history.py   # F13
│   │   │   └── version_diff.py      # F13 diff logic
│   │   │
│   │   ├── bot/
│   │   │   ├── whatsapp.py          # F17 webhook + HMAC verification
│   │   │   └── reply.py             # localized reply templates
│   │   │
│   │   ├── data/                    # ← ALL tunables. Agents edit JSON, not Python.
│   │   │   ├── rules.json           # permission groups, points, bands
│   │   │   ├── categories.json      # keywords + expected_groups
│   │   │   ├── patterns.json        # scam patterns
│   │   │   ├── brands.json          # aliases, official domains/packages/certs (may be empty)
│   │   │   ├── link_rules.json      # link weights, TLD list, keywords
│   │   │   ├── playbook_en.json / playbook_hi.json / playbook_pa.json
│   │   │   ├── messages_en.json / messages_hi.json / messages_pa.json
│   │   │   └── reason_keys.json     # FROZEN list of every reason_key (generated)
│   │   │
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic: ParsedApk, Report, LinkReport, ErrorEnvelope
│   │   │
│   │   ├── utils/
│   │   │   ├── file_safety.py       # upload validation, temp handling, zip-bomb caps
│   │   │   ├── net_safety.py        # SSRF guard
│   │   │   └── ratelimit.py
│   │   │
│   │   └── store/
│   │       └── report_store.py      # in-memory TTL dict
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_risk_engine.py      # all 6 vectors, table-driven
│       ├── test_patterns.py
│       ├── test_category.py
│       ├── test_axml.py             # binary manifest decode + fallback chain
│       ├── test_components.py       # meta-data accessibility signal
│       ├── test_repackaging.py
│       ├── test_version_diff.py
│       ├── test_link_heuristics.py
│       ├── test_net_safety.py       # SSRF: 127.0.0.1, 169.254.169.254, localhost, redirect-to-private
│       ├── test_file_safety.py      # non-APK, oversized, zip bomb, temp deletion on failure
│       ├── test_i18n_completeness.py# every reason_key in all 3 languages
│       └── fixtures/                # JSON-built ParsedApk samples (no real APKs in git)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── i18n/{index.js,en.json,hi.json,pa.json}
│       ├── pages/{Home.jsx,ApkResult.jsx,LinkResult.jsx}
│       └── components/
│           ├── RiskGauge.jsx
│           ├── VerdictBanner.jsx    # icon + text + color (never color alone)
│           ├── PermissionTable.jsx
│           ├── PatternCard.jsx
│           ├── RepackagingCard.jsx  # F12
│           ├── UpdateDiffCard.jsx   # F13
│           ├── CrowdIntelCard.jsx   # F14
│           ├── PlaybookCard.jsx     # F15
│           ├── CalibrationCard.jsx  # F16
│           ├── PrescriptionCard.jsx # F19
│           ├── QrScanner.jsx        # F18
│           ├── LanguageToggle.jsx
│           ├── SpeakButton.jsx
│           ├── ShareButton.jsx
│           └── Disclaimer.jsx
│
├── tools/
│   ├── collect_certs.py             # F12: extract official cert fingerprints (team-run, manual)
│   ├── freeze_reason_keys.py        # generates reason_keys.json from rules/patterns
│   ├── check_i18n.py                # fails if any key is missing in any language
│   └── make_demo_apks.md            # apktool-based demo APK build recipe
│
├── demo/
│   ├── README.md
│   ├── sample-links.txt             # safe look-alike examples (no live malware)
│   └── recording/                   # backup screen recording
│
└── docs/
    ├── pitch.md
    ├── competitor-comparison.md
    └── rules-notes.md
```

**`.gitignore` must include:** `.env`, `intel.db`, `*.apk`, `*.dex`, `__pycache__/`, `node_modules/`, `dist/`, `.pytest_cache/`, `demo/android-demo-apps/build/`.

---

## 7. Tech stack

**v1 (native) rows first; Python rows remain true for the reference implementation.**

| Layer | Choice | Notes |
|---|---|---|
| App (v1) | Kotlin + Jetpack Compose, Material 3, minSdk 24 / targetSdk 35 | `androidApp/` — offline, mobile-first, no server |
| Shared engine (v1) | Kotlin Multiplatform (`shared/`), kotlinx-serialization | Pure scoring; JVM tests run the exact same vectors as pytest |
| APK parsing (v1) | `java.util.zip.ZipFile` named members + `PackageManager.getPackageArchiveInfo` (certs) + own binary-AXML decoder | Read-only; same size caps as §3.1; cert path wrapped → `not_checked` |
| Storage (v1) | SQLite WAL in-app (`intel.db` schema identical to §F13/F14); reports in memory | No cloud |
| Network (v1, optional) | `HttpURLConnection`/OkHttp manual redirects for link check only, per user opt-in | §3.2 SSRF rules unchanged |
| Reference backend | Python 3.11+, FastAPI, Uvicorn | Auto OpenAPI docs at `/docs` — useful in the pitch |
| APK parsing | androguard 4.x (**manifest-only path**) | See F2 — do not touch the DEX analyzer on the hot path |
| AXML fallback | AXMLPrinter / pyaxmlparser / apkutils2 | Binary decoder — **not** "raw XML" |
| HTTP | httpx | Explicit timeouts, manual redirect handling for SSRF |
| URL parsing | tldextract | Correct public-suffix handling |
| Similarity | rapidfuzz | Look-alike domains **only** — never on the category path |
| Validation | Pydantic v2 | Boundary types |
| Storage | dict + TTL (reports), SQLite WAL (intel) | No external DB service |
| Frontend | React + Vite + Tailwind | Mobile-first |
| Voice | Web `speechSynthesis` | Zero server cost |
| QR | `jsQR` | Frontend only |
| Tests | pytest, pytest-asyncio | Table-driven |

**Dropped from the original plan:** `python-whois`. It is slow, frequently blocked, unreliable in a demo environment, and the original doc already defaults it off. Removing it removes a failure mode and an `ENABLE_WHOIS` branch. If you want domain age later, add it behind a flag *after* the event.

`requirements.txt` starting point: `fastapi`, `uvicorn[standard]`, `python-multipart`, `pydantic>=2`, `pydantic-settings`, `androguard>=4`, `httpx`, `tldextract`, `rapidfuzz`, `pytest`, `pytest-asyncio`, `slowapi`.

---

## 8. API contract

Base: `/api/v1`. Errors: `{"error": {"code": "...", "message": "..."}}`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `{"status":"ok","version":"1.0"}` |
| POST | `/apk/analyze` | multipart: `file`, `category?`, `lang?` |
| POST | `/link/check` | `{url, lang}` |
| POST | `/message/check` | `{text, lang}` |
| GET | `/report/{id}` | stored report, 1 h TTL |
| GET | `/intel/hash/{sha256}` | F14 aggregate counts |
| GET/POST | `/bot/whatsapp` | F17 webhook |

`POST /apk/analyze` response — extended with the new features:

```json
{
  "report_id": "a1b2c3d4e5f6",
  "type": "apk",
  "created_at": "2026-09-22T10:00:00Z",
  "app": {
    "label": "Super Flashlight (DEMO)",
    "package": "com.example.flash",
    "version_name": "1.0", "version_code": 1,
    "min_sdk": 21, "target_sdk": 33,
    "sha256": "<hex>",
    "signing_cert_sha256": ["<hex>"],
    "cert_check": "ok"
  },
  "category": {"id": "flashlight", "confidence": "medium", "method": "keyword"},
  "score": 100, "band": "high", "verdict": "red",
  "recommendation": "do_not_install",
  "critical_pattern_triggered": true,
  "breakdown": [
    {"rule": "group:sms", "points": 20, "reason_key": "perm.sms.unexpected", "status": "unexpected"},
    {"rule": "mismatch", "points": 20, "reason_key": "mismatch.generic"}
  ],
  "permissions": [
    {"name": "android.permission.READ_SMS", "group": "sms", "status": "unexpected"}
  ],
  "patterns": [{"id": "otp_stealer", "bonus": 15, "critical": true}],
  "impersonation": null,
  "repackaging": {
    "detected": true,
    "signal": "signer_mismatch",
    "expected_cert_sha256": "<hex>",
    "actual_cert_sha256": "<hex>"
  },
  "update_diff": {
    "has_history": true,
    "groups_added": ["sms"],
    "groups_removed": [],
    "version_changed": true,
    "cert_changed": false
  },
  "crowd_intel": {"people_who_scanned_this": 412, "percent_told_never_install": 89},
  "calibration": [
    "Some legitimate apps need unusual permissions. This can produce false alarms."
  ],
  "playbook": [{"step_key": "playbook.remove", "params": {"app": "Super Flashlight (DEMO)"}}],
  "prescription": {"minimal_groups": ["camera"]},
  "reasons": ["..."],
  "summary": "This flashlight app asks for more access than it needs. Do not install.",
  "limitations": "Static analysis only. This is not a guarantee of safety.",
  "lang": "en"
}
```

**Contract rules for agents:**
- Additive changes only during the event. Never rename or remove a field after hour 12 — the frontend is built against this shape.
- Every response includes `limitations`.
- Every `breakdown` entry includes a `reason_key` present in all three message files.
- `not_checked` is a valid status everywhere; `null` is not a substitute.
- Errors: `{"error": {"code": "file_too_large", "message": "..."}}`. Never leak a stack trace.

---

## 9. Rules data (all tunables live here)

### Permission groups and points
| Group | Points | Detected by |
|---|---|---|
| `sms` | 20 | READ_SMS, RECEIVE_SMS, SEND_SMS, RECEIVE_MMS, RECEIVE_WAP_PUSH |
| `contacts` | 15 | READ_CONTACTS, WRITE_CONTACTS |
| `call_log` | 20 | READ_CALL_LOG, WRITE_CALL_LOG, PROCESS_OUTGOING_CALLS |
| `microphone` | 10 | RECORD_AUDIO |
| `camera` | 8 | CAMERA |
| `location` | 8 | ACCESS_FINE/COARSE/BACKGROUND_LOCATION |
| `accessibility` | 25 | **component:** `BIND_ACCESSIBILITY_SERVICE` **or** `<meta-data android:name="android.accessibilityservice">` |
| `overlay` | 20 | SYSTEM_ALERT_WINDOW |
| `install_packages` | 25 | REQUEST_INSTALL_PACKAGES, INSTALL_PACKAGES |
| `notification_listener` | 15 | **component:** `BIND_NOTIFICATION_LISTENER_SERVICE` **or** the listener `<meta-data>` |
| `device_admin` | 20 | **component:** receiver with `BIND_DEVICE_ADMIN` |
| `calls` | 10 | CALL_PHONE, ANSWER_PHONE_CALLS |
| `all_files` | 10 | MANAGE_EXTERNAL_STORAGE |
| `boot` | 0 | RECEIVE_BOOT_COMPLETED (patterns only) |

Each group scores **once** regardless of how many of its permissions are declared.

### Categories and expected groups
`flashlight`→camera · `calculator`→none · `wallpaper`→none · `navigation`→location · `video_calling`→camera,microphone,contacts · `messaging`→contacts,camera,microphone,location,calls · `sms_app`→sms,contacts · `dialer`→contacts,call_log,calls,microphone · `camera`→camera,microphone,location · `photo_editor`→camera · `music_player`→none · `browser`→location,camera,microphone · `game`→none · `payments_upi`→sms,camera,location,contacts · `file_manager`→all_files · `screen_recorder`→microphone,overlay · `accessibility_tool`→accessibility,overlay · `food_or_ride`→location,calls · `social`→camera,microphone,contacts,location · `unknown`→none (penalty disabled)

**Add** `app_store` and `device_management` — these are the **only** categories where `install_packages` and `device_admin` are expected. Keep them out of every other category, or the `dropper` and `device_admin_lock` patterns can never fire correctly.

---

## 10. Code quality standards

The hackathon is 24 hours, but sloppy code costs more time than it saves here — this project's whole pitch is *"every point traces to a readable rule."* Code quality **is** the product.

### 10.1 Clean code rules
- **Type hints on every function signature.** Pydantic models at every boundary (HTTP in/out, JSON files loaded).
- **`core/` is pure.** No I/O, no network, no `datetime.now()`, no globals. `risk_engine.py` takes data in and returns data out. This is what makes the 6 test vectors trivially testable and rule changes safe.
- **Small functions, one job.** If a function needs a paragraph to describe, split it.
- **Descriptive names over comments.** Comment only the non-obvious *why*: the AXML binary detail, why cert parsing is wrapped, why a check is skipped. Never comment the *what*.
- **No dead code, no commented-out blocks, no `TODO` without an owner.** Delete rather than disable.
- **No bare `except:`.** Catch specific exceptions; log and degrade explicitly.
- **Depth ≤ 3.** Early returns over nested `if`.
- **One shared implementation per concept.** Especially the risk engine, the i18n lookup, and the cert-change helper. Duplication here means divergent results, which breaks the determinism claim.

### 10.2 Complexity budget — the actual numbers

Think about this explicitly, and put the answer in the docstring when it isn't obvious. The dominant costs:

| Operation | Target | How |
|---|---|---|
| Upload + hash | **O(n)** time, **O(1)** space | stream in 64 KB chunks; never `read()` the whole file |
| Zip member reads | O(members read), capped | read named members only; never extract |
| Manifest parse | **O(e)** elements | one pass, no re-walk |
| Permission → group | **O(P)**, not O(P×G) | prebuilt `dict[str,str]` at startup |
| Category match | **O(T)** tokens | prebuilt keyword index; no fuzzy matching |
| Pattern match | O(K) frozenset subset tests | precompiled `frozenset`s |
| Scoring | **O(G)**, independent of APK size | operates on the group set only |
| Report store | O(1) get/set | dict + TTL |
| Hash intel | O(1) indexed | SQLite PK + UPSERT |

Hard rules that follow from this:
- **The whole APK is never held in RAM.** A 100 MB APK must cost constant memory. If you find yourself calling `.read()` on the upload, stop.
- **Scoring never sees the file.** Only the group set. That is why scoring is microseconds and stays reproducible.
- **Everything is loaded and indexed once at startup** — rules, keyword indices, permission maps, compiled regexes, pattern frozensets. Never per request.
- **Compile regexes at import time**, not inside loops. A regex compiled per call is a silent O(n) rebuild.
- **No unbounded caches.** The report store has a TTL and a max size; the intel DB is bounded by distinct hashes. Nothing grows without limit.
- **Cap everything a user controls:** upload size, zip member size, zip entry count, redirect count, response header size, message length, DEX string count.
- **Avoid `rapidfuzz` on hot paths.** It is O(n×m) per comparison. Use it only for look-alike domains, and **prefilter** candidates by length (±2) and first character before calling it. With a brand list of 30, the naive version is 30 full edit-distance computations per link; the prefilttered version usually does zero.
- **SQLite: enable WAL, index the PK, use one connection per request or a small pool.** Never open a connection per query inside a loop.

If a proposed change makes any row in that table worse, it needs a reason in the PR/commit message.

### 10.3 Caching (only where it's free)
- Rules, indices, compiled regexes: module-level singletons loaded once at startup.
- Reputation lookups: keyed by hash/URL, **short TTL** (5 min), bounded size. Never cache an APK.
- Nothing else. Do not cache reports in two places.

---

## 11. Implementation plan

Rate the work honestly and **put a clock on the reason-key freeze** — it is on the critical path and the original timeline ignored it entirely.

| Phase | Hours | Deliverable | Owner | Gate to pass |
|---|---|---|---|---|
| **P0 — Foundations** | 0–2 | Repo scaffold, `.env.example`, Makefile, lint+test wired, **`reason_keys.json` frozen**, all rules JSON drafted | All | `make test` runs (0 tests); rules JSON valid |
| **P1 — Parsing** | 2–6 | F1 upload safety, F2 manifest+components+cert, F3 groups | Backend | Real APK parses < 2 s; non-APK rejected cleanly; temp deleted on failure |
| **P2 — Scoring core** | 2–6 | F4 category, F5 engine, F6 patterns, F7/F8 score+band | Rules | **All 6 vectors pass exactly** |
| **P3 — Language + UI shell** | 4–10 | F9 explanations in EN/HI/PA, Home + ApkResult, VerdictBanner | Frontend + Design | `check_i18n.py` passes; changes language with no missing key |
| **P4 — Link pipeline** | 8–14 | F10 link checker with SSRF guard, F11 handoff | Backend + Rules | All SSRF tests block; short link expands; missing key ⇒ `not_checked` |
| **P5 — Wedge: repackaging** | 10–14 | F12 repackaging + `collect_certs.py` + `tools/make_demo_apks.md` | Rules + Backend | Demo APK with swapped signer ⇒ red with correct reason |
| **P6 — Demo APKs** | 12–15 | 4 self-made demo APKs **+ 2–3 real benign APKs (F-Droid)** | Design + Backend | Each demo APK produces its expected verdict |
| **P7 — Differentiators** | 14–18 | F13 version diff, F14 crowd intel, F15 playbook, F16 calibration, F19 prescription | Backend + Rules | Each renders in the report and contributes 0 unintended points |
| **P8 — Reach + extras** | 16–19 | F17 WhatsApp bot, F18 QR, F20 voice, F21 export, F22 history | Frontend + Backend | Bot replies to a forwarded link end to end |
| **P9 — Integration + freeze** | 18–21 | End-to-end pass, bug fixes, **feature freeze at hour 18** | All | Full testing checklist green |
| **P10 — Pitch** | 21–24 | Slides, competitor table, **quantified impact slide with cited sources**, rehearsal, backup recording | Design | 3-minute demo runs twice cleanly |

**Rules:**
- **Feature freeze at hour 18.** After that: bugs and polish only. No new features, no refactors.
- **P0's reason-key freeze is not optional.** Every `reason_key` from `rules.json` and `patterns.json` goes into `reason_keys.json` and into all three message files **at hour 2**, before any UI work. Adding a key at hour 20 forces edits in three languages under time pressure, and a missing key is a test failure — you do not want that at hour 22.
- **Demo APKs at hours 12–15, not at the end.** The original timeline put them at hours 10–15 alongside integration; a broken demo APK at hour 20 is unrecoverable.
- If a phase slips, cut from **P8** first, then **P7 extras**. Never cut P1, P2, P4, P5 or the security tests in P4.

### 11.1 Building the demo APKs — use apktool, not Gradle flavors
The original plan's "Gradle project with product flavors" means Android SDK install, licence acceptance, and multi-minute builds × 4 variants — inside a 24-hour window. Instead:

```
apktool d benign.apk -o work/          # decompile a benign app
# edit work/AndroidManifest.xml: add/remove uses-permission, add a service stub
apktool b work -o out.apk              # rebuild
apksigner sign --ks debug.keystore out.apk
```
Roughly ten minutes per variant, no SDK required. Document it in `tools/make_demo_apks.md`. Keep the accessibility service stub **empty** — declared, never functional.

**Also add 2–3 real, benign, open-source APKs from F-Droid** to the demo set. Scanning a genuine popular app and producing a sensible, justified verdict is the strongest possible answer to *"doesn't it just flag everything red?"* — and it costs nothing but a download.

### 11.2 Demo flow for judges (~3 minutes)
1. **Problem (30 s)** — show a WhatsApp-style message: "SBI Reward Points APK, download now". Most people just tap Allow.
2. **Link check (30 s)** — paste a demo look-alike link. Red result, then "This link downloads an APK. Scan it too?"
3. **Wedge (45 s)** — upload the repackaged demo APK. Show: *"This claims to be SampleBank, but it was signed by a different developer."* Then toggle to Hindi.
4. **Suspicious APK (45 s)** — upload `flashlight_suspicious`. Show permissions, mismatch reasons, red score, playbook, crowd intel.
5. **Real app (20 s)** — scan a genuine F-Droid APK. Sensible verdict. *"It doesn't just flag everything."*
6. **Honest close (20 s)** — show the limitation line and the calibration card. Say what's next (dynamic sandbox, on-device scanning).

Rehearse it **twice**. Keep a screen recording as backup for when the Wi-Fi or an API dies.

---

## 12. Testing checklist

All of these must pass before the freeze. The security and honesty ones are not negotiable.

**Scoring**
- [ ] All 6 test vectors (Section 9) pass exactly.
- [ ] Each group scores once, however many of its permissions are declared.
- [ ] `unknown` category applies **no** mismatch penalty.

**Parsing**
- [ ] Binary AXML decodes; the decoder fallback chain works when the primary decoder is stubbed to fail.
- [ ] Accessibility is detected from `BIND_ACCESSIBILITY_SERVICE` **and** from the `<meta-data>` form.
- [ ] Notification listener and device admin detected from components.
- [ ] Cert parse failure ⇒ `cert_check: "not_checked"`, **200 response**, no exception.
- [ ] A real 100 MB APK parses in < 2 s and does not spike memory.

**Safety**
- [ ] Non-APK upload (renamed `.txt`) ⇒ clean 4xx.
- [ ] Oversized upload ⇒ clean 4xx, rejected before the body is read.
- [ ] Temp file deleted on success **and** on parse failure.
- [ ] Zip-bomb fixture (huge declared member) is capped, not decompressed.
- [ ] SSRF blocked: `http://127.0.0.1`, `http://169.254.169.254`, `http://localhost`, `http://[::1]`, and a public URL that **redirects** to a private IP.
- [ ] Webhook rejects a request with a bad `X-Hub-Signature-256`.
- [ ] Report ID `../etc/passwd` ⇒ 400, not a filesystem read.
- [ ] Missing API keys ⇒ `not_checked`, no crash.

**Honesty and i18n**
- [ ] Every `reason_key` exists in EN, HI and PA. `make freeze-check` fails on a missing key.
- [ ] Disclaimer on every result surface, including the bot reply.
- [ ] No occurrence of `100% safe` or `100% fake` anywhere in the repo or UI.
- [ ] `scans < 5` ⇒ `insufficient_data`, not a percentage.
- [ ] Calibration card renders whenever a check is `not_checked`.

**UI**
- [ ] Works at phone width; never relies on color alone (icon + text + color).
- [ ] Language toggle switches everything with no missing key and no English leakage.
- [ ] Demo flow runs offline, or from the backup recording.

---

## 13. Agent guardrails — quick reference

**Before every commit, an agent should be able to answer yes to all of these:**

1. Did I keep `core/` pure — no I/O, no network, no clock?
2. Did I put tunables in JSON rather than Python?
3. Did I reuse the one shared risk engine rather than writing a second scoring path?
4. Did I keep the SSRF guard and the zip-bomb caps intact?
5. Did I avoid inventing any URL, package name, domain or certificate fingerprint?
6. Did I avoid logging file contents, message text, tokens or API keys?
7. Did I delete temp files on every path, including exceptions?
8. Did I keep memory cost constant with respect to APK size?
9. Did I add a test for the new behaviour?
10. Did I run `make test` and `make freeze-check`?

**Stop immediately and ask a human if:** a requirement here conflicts with something you were told; a security test fails and the fix would require weakening the check; a feature needs a real brand's certificate fingerprint; or you are about to write a second implementation of something that already exists in `core/`.

---

## 14. Glossary

| Term | Meaning |
|---|---|
| **AXML** | Compiled *binary* Android XML. The format of `AndroidManifest.xml` inside an APK. Not readable as text. |
| **APK** | Android application package — a ZIP containing AXML manifest, DEX code, resources and signatures. |
| **Manifest** | `AndroidManifest.xml` — declares permissions, components and metadata. |
| **Permission group** | Our normalized bucket (`sms`, `overlay`...) that carries score points. |
| **Repackaging** | Rebuilding an existing app with modified contents and a different signing key. |
| **Signer / cert fingerprint** | SHA-256 of the certificate that signed the APK. Changes ⇒ different developer. |
| **SSRF** | Server-Side Request Forgery — tricking our backend into fetching internal addresses. |
| **AXML fallback** | Secondary binary decoder used when the primary parser fails. |
| **Calibration** | Explicitly stating where the analysis may be wrong. |
| **Reason key** | i18n key for a scoring reason; must exist in all three message files. |
| **Feature freeze** | Hour 18 — after this, bugs and polish only. |