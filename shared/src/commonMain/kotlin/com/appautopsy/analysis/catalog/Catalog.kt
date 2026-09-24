package com.appautopsy.analysis.catalog

import com.appautopsy.analysis.model.Lang
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Resolves reason keys to text in a language.
 *
 * Reports carry keys plus params, never finished prose, so switching language
 * re-renders instantly without re-running any analysis. That is the whole i18n
 * contract of the app.
 *
 * A missing translation must never break a report: the lookup falls back to
 * English and finally to the raw key. Callers that need to *detect* a miss
 * (the completeness test) use [get], which says null.
 *
 * Playbook step strings live in the playbook file, not the message catalog, so
 * the `playbook.` prefix routes the lookup across the two maps.
 */
/**
 * @param fallback the English catalog to defer to for a missing key. Null only
 *   for the English catalog itself, which has nothing below it — its misses
 *   render as the raw key. Passing it in rather than reaching for a global is
 *   what keeps a Catalog safe to construct and test in isolation.
 */
class Catalog(
    val lang: Lang,
    internal val messages: Map<String, String>,
    internal val playbookStrings: Map<String, String>,
    private val fallback: Catalog? = null,
) {

    fun get(key: String): String? =
        if (key.startsWith(PLAYBOOK_PREFIX)) playbookStrings[key] else messages[key]

    fun text(key: String, params: Map<String, String> = emptyMap()): String {
        var template = get(key)
        if (template == null) template = fallback?.get(key)
        if (template == null) return key
        if (params.isEmpty()) return template
        return format(template, params)
    }

    /** Message catalogs use Python-style `{name}` placeholders; fill them here. */
    private fun format(template: String, params: Map<String, String>): String {
        val out = StringBuilder(template.length + 16)
        var i = 0
        while (i < template.length) {
            val open = template.indexOf('{', i)
            if (open < 0) {
                out.append(template, i, template.length)
                break
            }
            out.append(template, i, open)
            val close = template.indexOf('}', open)
            if (close < 0) {
                // Unbalanced brace is a content bug; print the rest verbatim.
                out.append(template, open, template.length)
                break
            }
            val name = template.substring(open + 1, close)
            // Kotlin's format specifiers also use braces ({{0}}); those are
            // not parameters, so pass them through unexpanded.
            out.append(params[name] ?: template.substring(open, close + 1))
            i = close + 1
        }
        return out.toString()
    }

    companion object {
        const val PLAYBOOK_PREFIX = "playbook."

        /**
         * Loads catalogs for all supported languages from a reader that resolves
         * file names (e.g. `messages_hi.json`). Loaded once at startup; the
         * catalogs are immutable thereafter, so rendering never touches I/O.
         */
        fun loadAll(readFile: (String) -> String): Map<Lang, Catalog> {
            val english = readCatalog(Lang.EN, readFile, fallback = null)
            return Lang.entries.associateWith { lang ->
                if (lang == Lang.EN) english else readCatalog(lang, readFile, english)
            }
        }

        private fun readCatalog(
            lang: Lang,
            readFile: (String) -> String,
            fallback: Catalog?,
        ): Catalog {
            val json = Json { ignoreUnknownKeys = true }
            val code = lang.code

            val messagesRaw =
                json.parseToJsonElement(readFile("messages_$code.json")).jsonObject
            val playbookRaw =
                json.parseToJsonElement(readFile("playbook_$code.json")).jsonObject

            // Keys starting with `_` are author comments, not translations.
            val messages = messagesRaw
                .filterKeys { !it.startsWith("_") }
                .mapValues { it.value.jsonPrimitive.content }

            val strings = playbookRaw["strings"]?.jsonObject
                ?.mapValues { it.value.jsonPrimitive.content }
                ?: emptyMap()

            return Catalog(lang, messages, strings, fallback)
        }
    }
}

/**
 * Every message key defined in a catalog, playbook strings excluded. Used only
 * by the i18n completeness test; `get`/`text` are the runtime API.
 */
fun Catalog.messageKeys(): Set<String> =
    messages.keys.filterNot { it.startsWith("_") }.toSet()
