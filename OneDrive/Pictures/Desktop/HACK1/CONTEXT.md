# CONTEXT.md — Compact project brief for AI tools

**Paste this file when the AI tool has a small context window.** It is a condensed version of `AGENTS.md`, which is the authoritative spec. If a detail here conflicts with `AGENTS.md`, `AGENTS.md` wins. Read the full `AGENTS.md` before writing real code.

---

## 1. What we are building

**AppAutopsy** — checks an Android APK, a download link, or a scam message **before installation**, and explains in plain Hindi / Punjabi / English whether the app's permissions match its real purpose.

**Tagline:** Know what an app can do before it does it.

**User:** an ordinary Android user in India who received "SBI Reward Points APK" on WhatsApp and cannot judge what SMS or accessibility permission means.

**Pitch wedge (use ONE):** *the mod-APK and repackaging detector, in your language.* India's dominant malware channel is repackaged APKs — real app name, different signer, extra permissions. Nobody consumer-facing detects that.

---

## 2. How it works

```
APK / link / message
  → parse (manifest, components, signing cert)
  → identify the app category (flashlight, dialer, payments_upi...)
  → ASK: does this app need these permissions for its advertised job?
  → score 0-100, every point traced to a rule
  → band: green (0-25) / yellow (26-60) / red (61-100)
  → plain-language reasons in EN / HI / PA
  → action playbook: what to do RIGHT NOW
```

**Rules-based. No machine learning. No LLM in the scoring path.** Every point traces to a rule a non-programmer can read. This is the product's core claim and its differentiator.

---

## 3. Architecture rule — do not break this

There is exactly **ONE** scoring implementation: `backend/app/core/risk_engine.py`.
Exactly **ONE** set of rules: `backend/app/data/*.json`.
Exactly **ONE** explanation builder: `core/explain.py`.

Web, link, message and WhatsApp bot are thin adapters that normalize input and call the shared core. **The moment a second scoring path exists, results stop being reproducible.**

`core/` is **pure**: no I/O, no network, no `datetime.now()`, no globals. Data in, data out.

---

## 4. Scoring

```
for each sensitive permission GROUP present:
    if group is EXPECTED for this category:  0 points, label "Expected"
    else:                                    group.points, label "Unexpected"

if >5 unexpected groups:                    +10   (many_sensitive)
if category != unknown and any unexpected:  +20   (mismatch, once only)

+ pattern bonuses
+ 30 if impersonation
→ score = min(score, 100)

band: 0-25 low/green · 26-60 medium/yellow · 61-100 high/red

CRITICAL OVERRIDE: any critical pattern, OR impersonation,
OR signer mismatch ⇒ force red, regardless of score.
```

A **group** scores once, no matter how many of its permissions are declared.

**Permission groups (points):** sms 20 · contacts 15 · call_log 20 · microphone 10 · camera 8 · location 8 · accessibility 25 · overlay 20 · install_packages 25 · notification_listener 15 · device_admin 20 · calls 10 · all_files 10 · boot 0

**Critical:** accessibility, notification_listener and device_admin are **component** declarations, not `uses-permission` entries. The parser must read `<service>` and `<receiver>`.

**Verified test vectors** (must pass exactly):

| Category | Groups | Score |
|---|---|---|
| flashlight | sms, contacts, location, accessibility | **88** |
| flashlight | camera | **0** |
| navigation | location | **0** |
| unknown | sms | **20** (no mismatch penalty) |
| flashlight | sms, contacts, location, microphone, overlay | **93** |
| flashlight | sms, overlay, accessibility | **100** (85 + 25 banking_trojan + 15 otp_stealer = 125 → capped) |

---

## 5. Non-negotiables

1. **Never execute, install or `subprocess` an uploaded file.** Parse only.
2. **Never auto-download an APK** from a URL. Link checker reads headers only, never bodies.
3. **SSRF guard is mandatory.** Resolve DNS first, reject private/loopback/link-local/metadata ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`, `fe80::/10`). **Re-validate every redirect hop.** Max 5 hops, 5 s timeout.
4. **Zip-bomb caps:** read named members only (`AndroidManifest.xml`, `META-INF/*`). Cap member size 10 MB, total 50 MB, entry count. Never extract to disk.
5. **APK bytes never leave the server.** Reputation lookups send the SHA-256 hash only.
6. **Temp files deleted in `finally`,** on every path including exceptions.
7. **Never log** file contents, message text, tokens or API keys.
8. **Missing API key ⇒ `not_checked`, score 0, no crash.** Never fail a request because an optional provider is down.
9. **Never invent** a domain, package name or certificate fingerprint. Leave the field empty rather than guess.
10. **Never write** `100% safe` or `100% fake`. Every report carries: *"Static analysis only. This is not a guarantee of safety."*

---

## 6. Performance rules (real, not decorative)

- **The whole APK never enters RAM.** Stream in 64 KB chunks; compute SHA-256 in the same pass. A 100 MB APK costs O(1) memory.
- **Use androguard's manifest-only path.** `get_android_manifest_axml()`, `get_app_name()`, `get_certificates*()`, `get_files()`. **Never** `get_dex()` / `dvm` — full DEX analysis costs 20-40 s.
- **Prebuilt `dict[str, str]` permission→group map at startup.** O(P) lookup, not O(P×G).
- **Prebuilt keyword index for categories.** Tokenize and test membership. No fuzzy matching on the category path.
- **Precompiled `frozenset` per pattern** for subset tests.
- **Scoring never sees the file** — only the group set. Microseconds, and reproducible.
- **Compile regexes at import time.** Load all rules once at startup.
- **No unbounded caches.** Report store has TTL + max size. Nothing grows without limit.
- **Cap everything user-controlled:** upload size, zip members, redirects, message length.

---

## 7. Features

**MVP:** APK upload · manifest extraction · permission classification · category detection · purpose-vs-permission engine · scam patterns · score with reasons · green/yellow/red verdict · EN/HI/PA · link checker · link-to-APK handoff

**The differentiators:**
| ID | Feature |
|---|---|
| F12 | **Repackaging / signer-mismatch detection** ← the wedge |
| F13 | Version-diff tracker — "this update added SMS access" |
| F14 | Crowd-hash intelligence — "412 people scanned this file, 89% told not to install" |
| F15 | Action playbook — remove it, call 1930, cybercrime.gov.in |
| F16 | Calibration card — "reasons this might be wrong" |
| F17 | WhatsApp Guardian bot — forward a link, get a verdict back |
| F18 | QR scanner (frontend `jsQR`) |
| F19 | Minimum-permission prescription |

**Stretch:** voice read-out · report export · localStorage history · message scam checker · DEX string extraction

**Non-goals:** no ML, no dynamic analysis, no APK auto-download, no accounts, no cloud APK storage.

---

## 8. Stack

Backend: Python 3.11+, FastAPI, Uvicorn, androguard 4.x (manifest-only), httpx, tldextract, rapidfuzz (look-alike domains only), Pydantic v2, pytest.
Storage: in-memory TTL dict for reports; SQLite (WAL) for intel.
Frontend: React + Vite + Tailwind, `speechSynthesis`, `jsQR`.
**No `python-whois`** — slow, unreliable, dropped.

---

## 9. Docs and definitions

`AndroidManifest.xml` inside an APK is **compiled binary AXML**, not text. There is **no "read it raw" fallback.** Fallback chain: androguard → `AXMLPrinter` / `pyaxmlparser` / `apkutils2` → clean `manifest_unreadable` error.

Accessibility must be detected from **both** `BIND_ACCESSIBILITY_SERVICE` **and** `<meta-data android:name="android.accessibilityservice">`, or you miss real trojans. Same for notification listeners.

**Repackaging:** an app rebuilt with modified contents and a different signing key. Signal = same brand/package, different cert fingerprint.

---

## 10. Working rules

- Order of work: parsing → scoring core → UI shell → link pipeline → repackaging → demo APKs → differentiators → bot/QR/voice → freeze at hour 18.
- **Freeze the reason-key list at hour 2** into `reason_keys.json` and all three message files. A missing key is a test failure.
- Build demo APKs with **apktool**, not Gradle flavors. Add 2-3 real benign F-Droid APKs to the demo set.
- If a phase slips, cut the bot/QR/voice/export first. **Never cut parsing, scoring, the link pipeline, repackaging, or the security tests.**
- Ask a human before inventing architecture. Never weaken a security check to make a test pass.