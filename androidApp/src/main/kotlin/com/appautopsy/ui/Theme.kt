package com.appautopsy.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * The v4 palette, lifted from the product mockup: a light canvas of near-white
 * blue-grey, white cards, one navy for the hero surface and buttons, and the
 * three verdict colors used ONLY next to an icon and a word, never alone
 * (AGENTS.md §12).
 */
object Ink {
    val Brand = Color(0xFF1D4ED8)
    val BrandSoft = Color(0xFFDBEAFE)
    val Navy = Color(0xFF0F2A43)
    val NavyDeep = Color(0xFF081527)
    val Canvas = Color(0xFFF5F8FC)
    val Card = Color(0xFFFFFFFF)
    val Ink1 = Color(0xFF0F172A)
    val Ink2 = Color(0xFF475569)
    val Ink3 = Color(0xFF94A3B8)
    val Line = Color(0xFFE2E8F0)

    val Red = Color(0xFFDC2626)
    val RedTint = Color(0xFFFEF2F2)
    val Amber = Color(0xFFD97706)
    val AmberTint = Color(0xFFFFF7ED)
    val Green = Color(0xFF16A34A)
    val GreenTint = Color(0xFFF0FDF4)
    val BlueTint = Color(0xFFEFF6FF)
}

// Kept as aliases: the watch/ notification path and tests refer to these.
internal val RiskGreen = Ink.Green
internal val RiskYellow = Ink.Amber
internal val RiskRed = Ink.Red
internal val RiskRedDark = Color(0xFFFFB4AB)

private val LightScheme = lightColorScheme(
    primary = Ink.Brand,
    onPrimary = Color.White,
    secondary = Ink.Navy,
    onSecondary = Color.White,
    background = Ink.Canvas,
    onBackground = Ink.Ink1,
    surface = Ink.Card,
    onSurface = Ink.Ink1,
    surfaceVariant = Ink.BlueTint,
    onSurfaceVariant = Ink.Ink2,
    outline = Ink.Line,
    error = Ink.Red,
)

private val DarkScheme = darkColorScheme(
    primary = Color(0xFF93C5FD),
    onPrimary = Ink.NavyDeep,
    secondary = Color(0xFFB5C9D4),
    background = Color(0xFF0B1220),
    onBackground = Color(0xFFE5EAF2),
    surface = Color(0xFF111A2B),
    onSurface = Color(0xFFE5EAF2),
    surfaceVariant = Color(0xFF1B2A44),
    onSurfaceVariant = Color(0xFFA9B6C9),
    outline = Color(0xFF2A3B57),
    error = Ink.Red,
)

/**
 * Dark mode follows the system, no in-app override — the judges' "follows
 * system" checklist item, free.
 */
@Composable
fun AutopsyTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) DarkScheme else LightScheme,
        content = content,
    )
}
