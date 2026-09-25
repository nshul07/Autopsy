package com.appautopsy.analysis.link

/**
 * URL normalization and preliminary validation (F10).
 * 1:1 port of `backend/app/link/normalize.py`.
 *
 * Deliberately hand-rolled instead of java.net.URI: the JVM and Android URI
 * classes disagree on edge cases (bare hosts, weird ports), and this engine
 * must produce one answer on every shell.
 */

class InvalidUrlException(message: String) : Exception(message)

data class NormalizedUrl(
    val scheme: String,
    val host: String,
    /** Port, or null when default/absent. */
    val port: Int?,
    val path: String,
    val query: String,
    /** Full normalized string, fragment stripped. */
    val value: String,
)

fun normalizeUrl(rawUrl: String): NormalizedUrl {
    var url = rawUrl.trim()
    if (url.isEmpty()) throw InvalidUrlException("URL cannot be empty")

    if (!url.startsWith("http://", ignoreCase = true) &&
        !url.startsWith("https://", ignoreCase = true)
    ) {
        url = "https://$url"
    }

    val scheme = url.substringBefore("://").lowercase()
    if (scheme != "http" && scheme != "https") {
        throw InvalidUrlException("Disallowed URL scheme: $scheme")
    }

    // rest = host[/path][?query][#fragment]
    var rest = url.substringAfter("://", missingDelimiterValue = "")
    if (rest.isEmpty()) throw InvalidUrlException("Malformed URL")
    val fragmentIdx = rest.indexOf('#')
    if (fragmentIdx >= 0) rest = rest.substring(0, fragmentIdx)

    val pathSep = rest.indexOf('/')
    val authority = if (pathSep >= 0) rest.substring(0, pathSep) else rest
    var pathAndQuery = if (pathSep >= 0) rest.substring(pathSep) else "/"

    // userinfo before @ is part of the credential trick; keep the URL string
    // intact (at_symbol check wants it) but the host is after the last @.
    val hostPort = authority.substringAfterLast('@')
    if (hostPort.isEmpty()) throw InvalidUrlException("URL must have a valid hostname")

    var host = hostPort
    var port: Int? = null
    if (!hostPort.startsWith('[')) { // skip IPv6 literal bracket handling for port split
        val colon = hostPort.lastIndexOf(':')
        if (colon >= 0) {
            host = hostPort.substring(0, colon)
            port = hostPort.substring(colon + 1).toIntOrNull()
                ?: throw InvalidUrlException("Invalid port in URL")
        }
    }
    host = host.lowercase()
    if (host.isEmpty()) throw InvalidUrlException("URL must have a valid hostname")

    val query = pathAndQuery.substringAfter('?', "")
    if (query.isNotEmpty()) pathAndQuery = pathAndQuery.substringBefore('?')
    if (pathAndQuery.isEmpty()) pathAndQuery = "/"

    // Default ports vanish from the normalized form, same as Python's urlunparse.
    val effectivePort = port?.takeIf { it != 80 && it != 443 }
    val netloc = if (effectivePort != null) "$host:$effectivePort" else host
    val value = "$scheme://$netloc$pathAndQuery"

    return NormalizedUrl(
        scheme = scheme,
        host = host,
        port = effectivePort,
        path = pathAndQuery,
        query = query,
        value = value,
    )
}
