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

fun checkBrandLookalike(domain: String, rules: com.appautopsy.analysis.rules.Rules): String? {
    val domainClean = domain.lowercase().trim()
    if (domainClean.isEmpty()) return null

    val maxDist = rules.linkRules.lookalikeMaxEditDistance
    val lenTol = rules.linkRules.lookalikeLengthTolerance

    for (brand in rules.brands) {
        for (officialDomain in brand.officialDomains) {
            val offName = splitHost(officialDomain.lowercase()).domain
            if (domainClean == offName) continue // exact official domain
            if (kotlin.math.abs(domainClean.length - offName.length) > lenTol) continue
            val dist = boundedEditDistance(domainClean, offName, maxDist)
            if (dist in 1..maxDist) return brand.name
        }
    }
    return null
}

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

    // 3. Punycode
    if ("xn--" in hostname) flagged("punycode")

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

    // 10. Brand look-alike
    checkBrandLookalike(split.domain, rules)?.let { brand ->
        flagged("brand_lookalike", params = mapOf("brand" to brand))
    }

    return results
}
