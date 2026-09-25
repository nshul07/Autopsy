package com.appautopsy.analysis.link

/**
 * Offline link heuristics (F10) — 1:1 port of
 * `backend/app/link/heuristics.py`, network parts removed (v1 offline).
 *
 * Two desktop libraries get replaced by hand-rolled equivalents:
 *  - tldextract: a small embedded two-part-suffix list covers the cases that
 *    matter for look-alike checks (co.in, co.uk, com.au...); everything else
 *    is "last two labels", which is right for the overwhelmingly common .com/.in
 *    family. Wrong suffix parsing only ever makes a domain look *less* official,
 *    never more — it fails safe.
 *  - rapidfuzz: banded Levenshtein below. Same prefilter discipline as the spec
 *    (§10.2): never run unrestricted distance; length ±tolerance first, then
 *    an early-abort DP.
 */

object DomainParts {
    val TWO_PART_SUFFIXES: Set<String> = setOf(
        "co.in", "com.in", "net.in", "org.in", "gov.in", "ac.in", "edu.in",
        "co.uk", "org.uk", "ac.uk", "gov.uk",
        "com.au", "net.au", "org.au", "gov.au",
        "co.jp", "or.jp", "ne.jp", "ac.jp",
        "co.nz", "com.br", "com.mx", "co.za", "com.sg", "com.my",
        "com.pk", "com.bd", "com.np", "com.lk",
    )
}

data class HostSplit(val subdomain: String, val domain: String, val suffix: String)

fun splitHost(hostname: String): HostSplit {
    val labels = hostname.split('.').filter { it.isNotEmpty() }
    if (labels.size <= 1) return HostSplit("", labels.firstOrNull() ?: "", "")
    val two = labels.takeLast(2).joinToString(".")
    return if (labels.size >= 3 && two in DomainParts.TWO_PART_SUFFIXES) {
        HostSplit(labels.dropLast(3).joinToString("."), labels[labels.size - 3], two)
    } else {
        HostSplit(labels.dropLast(2).joinToString("."), labels[labels.size - 2], labels.last())
    }
}

/**
 * Levenshtein with an early abort when the row minimum exceeds [maxDist].
 * Identical semantics to a full distance capped by "greater than maxDist".
 */
fun boundedEditDistance(a: String, b: String, maxDist: Int): Int {
    if (a == b) return 0
    if (kotlin.math.abs(a.length - b.length) > maxDist) return maxDist + 1

    var prev = IntArray(b.length + 1) { it }
    var curr = IntArray(b.length + 1)

    for (i in 1..a.length) {
        curr[0] = i
        var rowMin = curr[0]
        for (j in 1..b.length) {
            val cost = if (a[i - 1] == b[j - 1]) 0 else 1
            curr[j] = minOf(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
            if (curr[j] < rowMin) rowMin = curr[j]
        }
        if (rowMin > maxDist) return maxDist + 1
        val tmp = prev; prev = curr; curr = tmp
    }
    return prev[b.length]
}

fun isIpAddress(host: String): Boolean {
    // IPv4: four dot-separated numbers 0-255. IPv6: contains ':' (already
    // bracket-stripped by normalize) or is hex-ish with colons.
    if (host.contains(':')) return true
    val parts = host.split('.')
    if (parts.size != 4) return false
    return parts.all { part ->
        part.isNotEmpty() && part.length <= 3 && part.all { it.isDigit() } &&
            (part.toIntOrNull() ?: -1) in 0..255
    }
}

/** A brand impersonation hit, plus how damning the signal is. */
data class BrandMatch(val brand: String, val strong: Boolean)

/**
 * Words that only ever appear next to a brand in a phishing lure. Their
 * presence next to a brand token turns a mere "contains the brand name"
 * coincidence into an impersonation signal.
 */
private val LURE_WORDS = setOf(
    "verify", "verification", "secure", "security", "login", "signin", "logon",
    "update", "kyc", "reward", "rewards", "claim", "support", "account",
    "wallet", "pay", "payment", "payments", "banking", "netbanking", "official",
    "service", "services", "help", "helpdesk", "alert", "notice", "gift",
    "gifts", "offer", "offers", "bonus", "team", "care", "customer",
    "customercare", "portal", "auth", "online", "india", "app", "refund",
    "cashback", "loan", "loans", "card", "upi", "unlock", "confirm",
)

/**
 * Brand look-alike, four signals:
 *  1. exact brand SLD on a wrong TLD — sbi.xyz, microsoft.net        [strong]
 *  2. typo-squat — small edit distance to a brand token — rnmicrosoft [strong
 *     on tokens >= 6 chars at distance 1; weaker otherwise]
 *  3. containment — a brand token buried in a lured-up domain —
 *     microsoft-secure-login, paytm-verify, claim-reward-flipkart   [weak]
 *  4. subdomain spoof — brand token among the labels while someone else owns
 *     the domain — sbi.verify-loan.xyz, microsoft.com.verify-login.xyz [strong]
 *
 * [BrandMatch.strong] means "this is impersonation by construction, not a
 * coincidence": the scorer turns those RED directly, because a signed-out
 * score of 35 would otherwise only warn.
 *
 * The brand's own domains (incl. any subdomain of them) return null —
 * login.microsoft.com stays green. That is the exact-match guard at the top.
 *
 * Fuzzy signals use conservative tokens (brand name + aliases + primary SLD);
 * short generic tokens like "fb"/"t" participate only in exact/label checks,
 * never in fuzzy, so olive.com is never "Microsoft" and a lone "t" label is
 * never "Telegram".
 */
fun checkBrandLookalikeMatch(
    hostname: String,
    rules: com.appautopsy.analysis.rules.Rules,
): BrandMatch? {
    // Punycode first (xn--pple-43d.com → аpple.com), then fold confusables
    // to ASCII (а→a → apple). The raw-vs-official guard below uses only the
    // DECODED string, so a homoglyph "аpple.com" never passes as the real
    // apple.com — folding is for matching brands, never for trusting hosts.
    val decoded = if ("xn--" in hostname) Punycode.decodeHost(hostname.lowercase()) else hostname.lowercase()
    val split = splitHost(decoded)
    val sld = split.domain
    val reg = if (split.suffix.isNotEmpty()) "$sld.${split.suffix}" else sld
    if (reg.isEmpty()) return null
    val rawLabels = decoded.split('.').filter { it.isNotEmpty() }.toList()
    val sldFolded = Confusables.fold(sld)
    val labelsFolded = rawLabels.map { Confusables.fold(it) }.toSet()
    // Every brand alias doubles as a lure word for its own brand ("upi" is both
    // a BHIM UPI alias and a lure word), so a lure signal on the SLD itself
    // proves nothing — upi.com lured itself into a forced RED on a real news
    // site. Only subdomain labels and hyphenated/underscored parts count.
    val lureScope = rawLabels.filter { it != sld } +
        rawLabels.flatMap { it.split('-', '_').drop(1) }
    val lured = lureScope.any { Confusables.fold(it) in LURE_WORDS }

    val suffixIsSuspicious = split.suffix.lowercase() in rules.linkRules.suspiciousTlds

    for (brand in rules.brands) {
        val official = brand.officialDomains.map { it.lowercase() }.distinct()
        // Literally the brand's own domain (never the folded form!) → clean.
        if (reg in official || official.any { it.isNotEmpty() && reg.endsWith(".$it") }) {
            continue
        }
        // The brand's own SLD under a different public suffix is still the
        // brand's own site: amazon.co.uk, amazon.de, google.co.jp are Amazon's
        // and Google's, even though officialDomains only lists .com/.in. Every
        // ccTLD variant of every brand cannot be enumerated, so match the SLD
        // and require only that the suffix is not one a phishing kit would
        // pick. Without this guard amazon.co.uk, amazon.ca and amazon.fr were
        // all forced RED — a false alarm on the real store. A wrong-TLD squat
        // on amazon.xyz still trips the check: those suffixes are suspicious.
        if (!suffixIsSuspicious &&
            official.any { it.isNotEmpty() && sld == splitHost(it).domain }
        ) {
            continue
        }

        fun norm(text: String) = text.lowercase().replace(" ", "")

        val exactTokens = buildSet {
            official.forEach { add(splitHost(it).domain) }
            add(norm(brand.name))
            brand.aliases.forEach { add(norm(it)) }
        }.filter { it.length >= 3 }.toSet()

        val fuzzyCandidates = buildList {
            add(norm(brand.name))
            brand.aliases.forEach { add(norm(it)) }
            official.firstOrNull()?.let { add(splitHost(it).domain) }
        }.distinct()

        // Fuzzy typo-squat candidates need real length: a 4-char token like
        // "uber" is one edit from "aber" (aber.ac.uk) and would force RED on a
        // university. Containment instead runs on short tokens too, because it
        // is gated on a lure word next to the brand — "paytm-verify" and
        // "sbi.verify-loan" must keep working, and "olive"/"snapple" still do
        // not, since neither is lured up.
        val fuzzyTokens = fuzzyCandidates.filter { it.length >= 6 }
        val containTokens = fuzzyCandidates.filter { it.length >= 3 }


        // 1. right brand name, wrong domain — in ASCII or via homoglyphs. A
        //    long brand word (microsoft, paytm) matching an SLD that is not the
        //    brand's is impersonation outright. A SHORT alias is a coincidence:
        //    "upi" is the alias of BHIM UPI and also upi.com, a real news
        //    agency, so short tokens only force a match when the TLD is already
        //    suspicious (sbi.xyz) or a lure word is present.
        if (sldFolded in exactTokens) {
            if (sldFolded.length >= 5 || suffixIsSuspicious || lured) {
                return BrandMatch(brand.name, strong = true)
            }
        }

        for (t in fuzzyTokens) {
            // 2. typo-squat, distance budget scaled to token length. Distance 1
            //    only for most tokens: at distance 2 a short token matches
            //    unrelated words — measured cost was "telegraph" being two
            //    edits from "telegram", forcing RED on telegraph.co.uk. A 7+
            //    char token gets the full rules budget, but each extra edit
            //    past the first raises the length bar: a 2-edit hit needs a
            //    >= 9 char token (microsoft/office365 still qualify; telegram
            //    alone does not).
            var budget = if (t.length >= 7) rules.linkRules.lookalikeMaxEditDistance else 1
            if (budget > 1 && t.length < 9) budget = 1
            if (budget > 0 &&
                kotlin.math.abs(sldFolded.length - t.length) <= rules.linkRules.lookalikeLengthTolerance
            ) {
                val d = boundedEditDistance(sldFolded, t, budget)
                // A two-edit hit only accuses when the brand word is still a
                // substring of the domain — a real character-level wrap
                // (rnmicrosoft, microsooft). Anything else at distance 2 is a
                // coincidence the engine cannot distinguish from a squat:
                // "rnicrosoft" (a genuine Microsoft squat) and "picosoft" (a
                // real Italian software firm) are both one insertion from
                // "microsoft" and differ by no string test whatsoever, and
                // "citibank"/"hiexpress"/"oakbank" are the same story against
                // icicibank/dhlexpress/kotakbank. Demanding the embedded brand
                // word keeps every real site clean (hiexpress, devexpress,
                // picosoft, citibank.co.uk, oakbank.co.nz were all forced RED
                // before) at the documented cost of one miss: "rnicrosoft" is
                // no longer caught. That trade is deliberate — crying wolf on a
                // real bank costs more trust than missing one typosquat, and a
                // wrap that keeps the brand visible is the signal a phisher
                // actually relies on.
                if (d in 1..budget && (d == 1 || t in sldFolded)) {
                    return BrandMatch(brand.name, strong = true)
                }
            }
        }

        for (t in containTokens) {
            // 3. containment — only counts when the domain is lured up
            //    (microsoft-secure-login). A bare containment match on its
            //    own is too loose: "olive" contains "live", "snapple"
            //    contains "apple", "costco" contains "cost".
            if (lured && sldFolded.length > t.length && t in sldFolded) {
                return BrandMatch(brand.name, strong = true)
            }
        }

        // 4. brand token in the hostname but someone else owns the domain.
        //    Require a lure signal, because a lone brand label is usually a real
        //    subdomain — microsoft.wikia.com and blog.google.com are not
        //    phishing. A lured label is the spoof: sbi.verify-loan.xyz,
        //    login.microsoft.com.evil.tk. The lure gate is what makes a short
        //    brand label ("sbi") safe to honour here; without it "navy.mil"
        //    would read as the brand "Navi".
        if (lured && labelsFolded.any { it.length >= 3 && it in exactTokens }) {
            return BrandMatch(brand.name, strong = true)
        }
    }
    return null
}

/** Convenience for callers that only need the brand name. */
fun checkBrandLookalike(
    hostname: String,
    rules: com.appautopsy.analysis.rules.Rules,
): String? = checkBrandLookalikeMatch(hostname, rules)?.brand

/** Runs every offline check; pure, same input → same list, no side effects. */
fun evaluateOfflineHeuristics(url: NormalizedUrl, rules: com.appautopsy.analysis.rules.Rules): List<LinkCheckResult> {
    val cfg = rules.linkRules.checks
    val results = mutableListOf<LinkCheckResult>()

    fun flagged(id: String, pointsOverride: Int? = null, params: Map<String, String> = emptyMap()) {
        val def = cfg[id] ?: return
        results += LinkCheckResult(
            id = id,
            status = CheckStatus.FLAGGED,
            points = pointsOverride ?: def.points,
            reasonKey = def.reasonKey,
            params = params,
        )
    }

    val hostname = url.host
    val split = splitHost(hostname)

    // 1. No HTTPS
    if (url.scheme == "http") flagged("no_https")

    // 2. IP host
    if (isIpAddress(hostname)) flagged("ip_host")

    // 3. Punycode — show the user the address as it really spells.
    if ("xn--" in hostname) {
        flagged("punycode", params = mapOf("decoded" to Punycode.decodeHost(hostname)))
    }

    // 4. @ symbol anywhere in the URL
    if ("@" in url.value) flagged("at_symbol")

    // 5. Suspicious TLD
    if (split.suffix.lowercase() in rules.linkRules.suspiciousTlds) {
        flagged("suspicious_tld", params = mapOf("tld" to split.suffix))
    }

    // 6. Deep subdomains (>= 3 labels before the registered domain)
    if (split.subdomain.isNotEmpty()) {
        val subCount = split.subdomain.split('.').count { it.isNotEmpty() }
        if (subCount >= 3) flagged("deep_subdomains", params = mapOf("count" to subCount.toString()))
    }

    // 7. URL shortener
    val apex = if (split.suffix.isNotEmpty()) "${split.domain}.${split.suffix}" else split.domain
    if (apex.lowercase() in rules.linkRules.knownShorteners ||
        hostname in rules.linkRules.knownShorteners
    ) {
        flagged("shortener")
    }

    // 8. Scam keywords
    val urlLower = url.value.lowercase()
    val found = rules.linkRules.scamKeywords.filter { it in urlLower }
    if (found.isNotEmpty()) {
        val def = cfg["scam_keywords"]
        if (def != null) {
            val pts = minOf(found.size * def.points, def.maxPoints)
            flagged("scam_keywords", pointsOverride = pts, params = mapOf("keyword" to found.first()))
        }
    }

    // 9. Direct APK in URL
    val pathLower = url.path.lowercase()
    val exts = rules.linkRules.apkExtensions
    if (exts.any { pathLower.endsWith(it) } || exts.any { it in urlLower }) {
        flagged("direct_apk")
    }

    // 10. Injected credential path. The largest family of phishing URLs has no
    //     brand word anywhere: a compromised legit site (often WordPress) gets a
    //     dropper written into its own folders and the phish lives at a path
    //     like /wp-content/themes/x/PayPal/login.php. Structure alone catches
    //     it: a request for sign-in details that resolves into the site's own
    //     internal plumbing. Measured on 20k bad / 20k good URLs: this fires on
    //     5.0% of bad and 0.00% of good — the pairing is what does the work,
    //     since either signal alone is common on healthy sites.
    val injectDirs = rules.linkRules.injectDirs
    val credentialWords = rules.linkRules.credentialWords
    if (injectDirs.any { it in pathLower } && credentialWords.any { it in pathLower }) {
        flagged("phish_path")
    }

    // 11. Brand look-alike (typo squat, homoglyph, containment, subdomain spoof).
    //     Strong matches are marked by points alone being insufficient, so we
    //     encode the strength in an extra param the scorer reads: a strong
    //     impersonation must land RED, not a 35-point warning.
    checkBrandLookalikeMatch(hostname, rules)?.let { m ->
        flagged(
            "brand_lookalike",
            params = buildMap {
                put("brand", m.brand)
                if (m.strong) put("strong", "1")
            },
        )
    }

    return results
}
