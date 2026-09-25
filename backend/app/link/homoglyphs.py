"""Punycode + homoglyph support (port of ``shared/.../link/Homoglyphs.kt``).

The trick this exists to kill: аpple.com spelled with the Cyrillic "а"
(U+0430) encodes as xn--pple-43d.com. A browser shows the pretty fake, the raw
host shows an opaque punycode blob, and naive matching sees no brand in either.
Decoding the label and folding confusable letters back to ASCII makes the fake
match the brand exactly, so the matcher sees "apple" and the reason text can
show the user the address as it really spells.

Everything here is pure: no network, no clock, no randomness.
"""

from __future__ import annotations

_BASE = 36
_TMIN = 1
_TMAX = 26
_SKEW = 38
_DAMP = 700
_INITIAL_BIAS = 72
_INITIAL_N = 128


def _digit_of(char: str) -> int | None:
    if "a" <= char <= "z":
        return ord(char) - ord("a")
    if "A" <= char <= "Z":
        return ord(char) - ord("A")
    if "0" <= char <= "9":
        return ord(char) - ord("0") + 26
    return None


def _adapt(delta: int, num_points: int, first_time: bool) -> int:
    delta = delta // _DAMP if first_time else delta // 2
    delta += delta // num_points
    k = 0
    while delta > (_BASE - _TMIN) * _TMAX // 2:
        delta //= _BASE - _TMIN
        k += _BASE
    return k + (_BASE - _TMIN + 1) * delta // (delta + _SKEW)


def decode_label(label: str) -> str | None:
    """Decode one ``xn--`` label to Unicode; None when malformed.

    A label that is not punycode passes through unchanged.
    """
    if not label.startswith("xn--"):
        return label
    encoded = label[4:]
    if not encoded:
        return None

    last_delim = encoded.rfind("-")
    output = encoded[:last_delim] if last_delim > 0 else ""
    position = last_delim + 1 if last_delim >= 0 else 0
    n = _INITIAL_N
    bias = _INITIAL_BIAS
    i = 0

    while position < len(encoded):
        old_i = i
        w = 1
        k = _BASE
        while True:
            if position >= len(encoded):
                return None
            digit = _digit_of(encoded[position])
            position += 1
            if digit is None:
                return None
            i += digit * w
            if k <= bias:
                t = _TMIN
            elif k >= bias + _TMAX:
                t = _TMAX
            else:
                t = k - bias
            if digit < t:
                break
            w *= _BASE - t
            k += _BASE

        out_len = len(output) + 1
        bias = _adapt(i - old_i, out_len, old_i == 0)
        n += i // out_len
        i %= out_len
        if not 0 <= n <= 0x10FFFF:
            return None
        output = output[:i] + chr(n) + output[i:]
        i += 1

    return output


def decode_host(host: str) -> str:
    """Decode every label of a host, leaving undecodable ones as they were."""
    return ".".join(decode_label(label) or label for label in host.split("."))


# Non-Latin letters that render as an ASCII letter in ordinary fonts. Written
# as escapes on purpose: several of these codepoints are visually identical to
# one another, and a dict literal with duplicates would silently drop entries.
_CONFUSABLES: dict[str, str] = {
    # Cyrillic lowercase
    "а": "a",  # а
    "е": "e",  # е
    "о": "o",  # о
    "р": "p",  # р
    "с": "c",  # с
    "у": "y",  # у
    "х": "x",  # х
    "к": "k",  # к
    "т": "t",  # т
    "м": "m",  # м
    "і": "i",  # і
    "ј": "j",  # ј
    "ѕ": "s",  # ѕ
    "ԁ": "d",  # ԁ
    "ӏ": "l",  # ӏ
    "ԝ": "w",  # ԝ
    "ѡ": "o",  # ѡ
    # Cyrillic uppercase
    "А": "A",  # А
    "В": "B",  # В (renders like Latin B)
    "Е": "E",  # Е
    "О": "O",  # О
    "Р": "P",  # Р
    "С": "C",  # С
    "Т": "T",  # Т
    "М": "M",  # М
    "К": "K",  # К
    "Н": "H",  # Н
    "Х": "X",  # Х
    "І": "I",  # І
    "Ј": "J",  # Ј
    "Ѕ": "S",  # Ѕ
    # Greek
    "ο": "o",  # ο omicron
    "ν": "v",  # ν nu
    "ι": "i",  # ι iota
}

# Zero-width and bidi controls — removed entirely before matching.
_STRIP: frozenset[str] = frozenset(
    {
        "​",  # zero width space
        "‌",  # zero width non-joiner
        "‍",  # zero width joiner
        "⁠",  # word joiner
        "﻿",  # BOM
        "‎",
        "‏",
        "‪",
        "‫",
        "‬",
        "‭",
        "‮",
    }
)


def fold(text: str) -> str:
    """Fold confusable letters to their ASCII look-alike, strip invisible chars."""
    return "".join(
        _CONFUSABLES.get(char, char) for char in text if char not in _STRIP
    )


def has_non_ascii(text: str) -> bool:
    return any(ord(char) > 0x7F for char in text)
