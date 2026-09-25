package com.appautopsy.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/**
 * Hand-drawn glyphs for the three things this app scans.
 *
 * The Material icon *core* set (the only one on the classpath without adding a
 * dependency) has no link, chat-bubble or android figure, and pulling
 * material-icons-extended costs ~2 MB of dex for three shapes. So they are
 * drawn here: flat vector paths, tinted by the caller, which also means they
 * follow the theme in dark mode for free.
 */

@Composable
fun LinkIcon(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val stroke = w * 0.11f
        // Two overlapping chain links, drawn as rounded rectangles rotated 45°.
        fun ring(cx: Float, cy: Float) {
            val r = w * 0.24f
            drawCircle(
                color = color,
                radius = r,
                center = Offset(cx, cy),
                style = Stroke(width = stroke, cap = StrokeCap.Round),
            )
        }
        val d = w * 0.19f
        ring(w / 2 - d, h / 2 + d)
        ring(w / 2 + d, h / 2 - d)
        // The bar that ties them together.
        drawLine(
            color = color,
            start = Offset(w * 0.28f, h * 0.72f),
            end = Offset(w * 0.72f, h * 0.28f),
            strokeWidth = stroke,
            cap = StrokeCap.Round,
        )
    }
}

@Composable
fun MessageIcon(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val pad = w * 0.12f
        val body = Path().apply {
            addRoundRect(
                androidx.compose.ui.geometry.RoundRect(
                    left = pad, top = pad,
                    right = w - pad, bottom = h * 0.72f,
                    radiusX = w * 0.16f, radiusY = w * 0.16f,
                ),
            )
        }
        drawPath(body, color)
        // Tail.
        val tail = Path().apply {
            moveTo(w * 0.3f, h * 0.66f)
            lineTo(w * 0.3f, h * 0.88f)
            lineTo(w * 0.52f, h * 0.66f)
            close()
        }
        drawPath(tail, color)
        // Two text lines knocked out of the bubble.
        val line = w * 0.075f
        listOf(h * 0.31f, h * 0.47f).forEach { y ->
            drawLine(
                color = Color.White.copy(alpha = 0.92f),
                start = Offset(w * 0.28f, y),
                end = Offset(w * 0.72f, y),
                strokeWidth = line,
                cap = StrokeCap.Round,
            )
        }
    }
}

@Composable
fun ApkIcon(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2
        // Head: a dome with two antennae.
        val headTop = h * 0.16f
        val headBottom = h * 0.36f
        val headR = w * 0.24f
        drawArc(
            color = color,
            startAngle = 180f,
            sweepAngle = 180f,
            useCenter = false,
            topLeft = Offset(cx - headR, headTop),
            size = Size(headR * 2, (headBottom - headTop) * 2),
            style = Stroke(width = w * 0.09f),
        )
        drawLine(color, Offset(cx - headR, headBottom), Offset(cx + headR, headBottom), w * 0.09f)
        // Antennae.
        drawLine(color, Offset(cx - headR * 0.6f, headTop - h * 0.06f), Offset(cx - headR * 0.35f, headTop + h * 0.04f), w * 0.07f, cap = StrokeCap.Round)
        drawLine(color, Offset(cx + headR * 0.6f, headTop - h * 0.06f), Offset(cx + headR * 0.35f, headTop + h * 0.04f), w * 0.07f, cap = StrokeCap.Round)
        // Body.
        drawRoundRect(
            color = color,
            topLeft = Offset(cx - headR, h * 0.42f),
            size = Size(headR * 2, h * 0.4f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.08f),
        )
        // Legs.
        drawLine(color, Offset(cx - headR * 0.45f, h * 0.82f), Offset(cx - headR * 0.45f, h * 0.94f), w * 0.1f, cap = StrokeCap.Round)
        drawLine(color, Offset(cx + headR * 0.45f, h * 0.82f), Offset(cx + headR * 0.45f, h * 0.94f), w * 0.1f, cap = StrokeCap.Round)
    }
}


@Composable
fun ShieldIcon(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val shield = Path().apply {
            moveTo(w * 0.5f, h * 0.06f)
            lineTo(w * 0.9f, h * 0.22f)
            lineTo(w * 0.9f, h * 0.5f)
            quadraticBezierTo(w * 0.9f, h * 0.8f, w * 0.5f, h * 0.96f)
            quadraticBezierTo(w * 0.1f, h * 0.8f, w * 0.1f, h * 0.5f)
            lineTo(w * 0.1f, h * 0.22f)
            close()
        }
        drawPath(shield, color)
        // A link glyph inside, in white, tying the shield to the app's name.
        val stroke = w * 0.07f
        drawLine(Color.White, Offset(w * 0.32f, h * 0.62f), Offset(w * 0.68f, h * 0.3f), stroke, cap = StrokeCap.Round)
        drawCircle(Color.White, radius = w * 0.1f, center = Offset(w * 0.32f, h * 0.62f), style = Stroke(width = stroke))
        drawCircle(Color.White, radius = w * 0.1f, center = Offset(w * 0.68f, h * 0.3f), style = Stroke(width = stroke))
    }
}

@Composable
fun HistoryIcon(color: Color, modifier: Modifier = Modifier) {
    // Clock face + hand: the "history" glyph, drawn because the core icon set
    // has no history shape.
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val stroke = w * 0.09f
        drawCircle(color, radius = w * 0.38f, center = Offset(w / 2, h / 2), style = Stroke(width = stroke))
        drawLine(color, Offset(w / 2, h / 2), Offset(w / 2, h * 0.28f), stroke, cap = StrokeCap.Round)
        drawLine(color, Offset(w / 2, h / 2), Offset(w * 0.66f, h / 2), stroke, cap = StrokeCap.Round)
    }
}

@Composable
fun GlobeIcon(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val stroke = w * 0.07f
        drawCircle(color, radius = w * 0.42f, center = Offset(w / 2, h / 2), style = Stroke(width = stroke))
        drawLine(color, Offset(w * 0.08f, h / 2), Offset(w * 0.92f, h / 2), stroke)
        drawOval(
            color = color,
            topLeft = Offset(w * 0.3f, h * 0.08f),
            size = Size(w * 0.4f, h * 0.84f),
            style = Stroke(width = stroke),
        )
    }
}

/** The splash backdrop: navy with a soft radial glow behind the shield. */
@Composable
fun SplashBackdrop(modifier: Modifier = Modifier) {
    Box(modifier = modifier) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawRect(
                Brush.verticalGradient(
                    listOf(Ink.NavyDeep, Ink.Navy),
                ),
            )
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Ink.Brand.copy(alpha = 0.55f), Color.Transparent),
                    center = Offset(size.width / 2, size.height * 0.32f),
                    radius = size.width * 0.75f,
                ),
                center = Offset(size.width / 2, size.height * 0.32f),
                radius = size.width * 0.75f,
            )
        }
    }
}
