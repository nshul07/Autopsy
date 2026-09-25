package com.appautopsy.analysis.link

/**
 * Punycode + homoglyph support.
 *
 * The trick this exists to kill: аpple.com spelled with the Cyrillic "а"
 * (U+0430) encodes as xn--pple-43d.com. A browser shows the pretty fake, the
 * raw host shows an opaque punycode blob, and naive matching sees no brand in
 * either. Decoding the label and folding confusable letters back to ASCII
 * makes the fake match the brand exactly — so the matcher sees "apple", and
 * the reason text can show the user the address as it really spells.
 *
 * Pure functions, no network, no clock — safe for the scoring path.
 */
object Punycode {
    private const val BASE = 36
    private const val TMIN = 1
    private const val TMAX = 26
    private const val SKEW = 38
    private const val DAMP = 700
    private const val INITIAL_BIAS = 72
    private const val INITIAL_N = 128

    /** Decode one `xn--` label to Unicode; null when malformed. Others pass through. */
    fun decodeLabel(label: String): String? {
        if (!label.startsWith("xn--")) return label
        val encoded = label.substring(4)
        if (encoded.isEmpty()) return null
        val lastDelim = encoded.lastIndexOf('-')
        val output = StringBuilder(if (lastDelim > 0) encoded.substring(0, lastDelim) else "")
        var position = if (lastDelim >= 0) lastDelim + 1 else 0
        var n = INITIAL_N
        var bias = INITIAL_BIAS
        var i = 0
        while (position < encoded.length) {
            val oldi = i
            var w = 1
            var k = BASE
            while (true) {
                if (position >= encoded.length) return null
                val digit = digitOf(encoded[position++]) ?: return null
                i += digit * w
                val t = when {
                    k <= bias -> TMIN
                    k >= bias + TMAX -> TMAX
                    else -> k - bias
                }
                if (digit < t) break
                w *= BASE - t
                k += BASE
            }
            val out = output.length + 1
            bias = adapt(i - oldi, out, oldi == 0)
            n += i / out
            i %= out
            if (n !in 0..0x10FFFF) return null
            output.insert(i++, String(Character.toChars(n)))
            i++
        }
        return output.toString()
    }

    fun decodeHost(host: String): String =
        host.split('.').joinToString(".") { decodeLabel(it) ?: it }

    private fun digitOf(c: Char): Int? = when (c) {
        in 'a'..'z' -> c - 'a'
        in 'A'..'Z' -> c - 'A'
        in '0'..'9' -> c - '0' + 26
        else -> null
    }

    private fun adapt(deltaIn: Int, nPoints: Int, firstTime: Boolean): Int {
        var d = if (firstTime) deltaIn / DAMP else deltaIn / 2
        d += d / nPoints
        var k = 0
        while (d > (BASE - TMIN) * TMAX / 2) {
            d /= BASE - TMIN
            k += BASE
        }
        return k + (BASE - TMIN + 1) * d / (d + SKEW)
    }
}

object Confusables {
    /**
     * Non-Latin letters that render as an ASCII letter in ordinary fonts.
     * Written as escapes on purpose: several of these codepoints are visually
     * identical to one another and mapOf() throws on duplicate keys.
     */
    private val MAP: Map<Char, Char> = mapOf(
        // Cyrillic lowercase
        'а' to 'a', // а
        'е' to 'e', // е
        'о' to 'o', // о
        'р' to 'p', // р
        'с' to 'c', // с
        'у' to 'y', // у
        'х' to 'x', // х
        'к' to 'k', // к
        'т' to 't', // т
        'м' to 'm', // м
        'і' to 'i', // і
        'ј' to 'j', // ј
        'ѕ' to 's', // ѕ
        'ԁ' to 'd', // ԁ
        'ӏ' to 'l', // ӏ
        'ԝ' to 'w', // ԝ
        'ѡ' to 'o', // ѡ
        // Cyrillic uppercase
        'А' to 'A', // А
        'В' to 'B', // В (renders like Latin B)
        'Е' to 'E', // Е
        'О' to 'O', // О
        'Р' to 'P', // Р
        'С' to 'C', // С
        'Т' to 'T', // Т
        'М' to 'M', // М
        'К' to 'K', // К
        'Н' to 'H', // Н
        'Х' to 'X', // Х
        'І' to 'I', // І
        'Ј' to 'J', // Ј
        'Ѕ' to 'S', // Ѕ
        // Greek
        'ο' to 'o', // ο omicron
        'ν' to 'v', // ν nu
        'ι' to 'i', // ι iota
    )

    /** Zero-width and bidi controls — removed entirely before matching. */
    private val STRIP: Set<Char> = setOf(
        '​', '‌', '‍', '⁠', '﻿', // ZWSP, ZWNJ, ZWJ, word joiner, BOM
        '‎', '‏', '⁦', '⁧', '⁨', '⁩', // bidi controls
    )

    /** Fold confusable letters to their ASCII look-alike, strip invisible chars. */
    fun fold(s: String): String {
        val out = StringBuilder(s.length)
        for (c in s) {
            if (c in STRIP) continue
            out.append(MAP[c] ?: c)
        }
        return out.toString()
    }

    /** True when the string holds any character above ASCII. */
    fun hasNonAscii(s: String): Boolean = s.any { it.code > 0x7F }
}
