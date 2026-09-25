package com.appautopsy.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.appautopsy.analysis.catalog.Catalog
import kotlinx.coroutines.launch

/**
 * First-run splash + three onboarding slides, matching the mockup.
 *
 * The splash sells the one thing no competitor can fake in a screenshot: this
 * app has no INTERNET permission. The slides say what it does, that it runs
 * entirely on-device, and how to make every tapped link get checked.
 * Nothing here is a gate — "Skip" reaches the app on the first tap, and every
 * feature still works if the user grants nothing.
 */
@Composable
fun OnboardingScreen(catalog: Catalog, onDone: () -> Unit) {
    var splash by remember { mutableStateOf(true) }
    if (splash) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clickable { splash = false },
        ) {
            SplashBackdrop(Modifier.fillMaxSize())
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Box(modifier = Modifier.size(120.dp)) { ShieldIcon(Color.White) }
                Spacer(Modifier.height(20.dp))
                Text(
                    text = catalog.text("app.name"),
                    color = Color.White,
                    fontSize = 30.sp,
                    fontWeight = FontWeight.ExtraBold,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = catalog.text("app.tagline"),
                    color = Color.White.copy(alpha = 0.72f),
                    fontSize = 15.sp,
                )
                Spacer(Modifier.height(48.dp))
                PrivacyPill(catalog, "onb.no_cloud")
                Spacer(Modifier.height(10.dp))
                PrivacyPill(catalog, "onb.no_accounts")
                Spacer(Modifier.height(10.dp))
                PrivacyPill(catalog, "onb.no_telemetry")
            }
        }
        return
    }

    val titles = listOf("onb.slide1_title", "onb.slide2_title", "onb.slide3_title")
    val bodies = listOf("onb.slide1_body", "onb.slide2_body", "onb.slide3_body")
    val pager = rememberPagerState(pageCount = { titles.size })
    // Mirror the settled page into state so the Next button recomposes on swipe.
    var page by remember { mutableIntStateOf(0) }
    LaunchedEffect(pager.settledPage) { page = pager.settledPage }
    val scope = rememberCoroutineScope()
    val last = page == titles.size - 1

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Ink.Canvas)
            .padding(horizontal = 24.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(22.dp)) { ShieldIcon(Ink.Brand) }
                Spacer(Modifier.width(6.dp))
                Text(catalog.text("app.name"), color = Ink.Ink1, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            TextButton(onClick = onDone) {
                Text(catalog.text("onb.skip"), color = Ink.Ink3, fontSize = 14.sp)
            }
        }

        HorizontalPager(
            state = pager,
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
        ) { idx ->
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Box(modifier = Modifier.size(150.dp)) {
                    when (idx) {
                        0 -> ShieldIcon(Ink.Brand)
                        1 -> GlobeIcon(Ink.Green)
                        else -> LinkIcon(Ink.Brand)
                    }
                }
                Spacer(Modifier.height(40.dp))
                Text(
                    text = catalog.text(titles[idx]),
                    color = Ink.Ink1,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(12.dp))
                Text(
                    text = catalog.text(bodies[idx]),
                    color = Ink.Ink2,
                    fontSize = 15.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 22.sp,
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            repeat(titles.size) { i ->
                val active = i == page
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .size(if (active) 8.dp else 6.dp)
                        .clip(CircleShape)
                        .background(if (active) Ink.Brand else Ink.Line),
                )
            }
        }

        Button(
            onClick = {
                if (last) onDone() else scope.launch { pager.animateScrollToPage(page + 1) }
            },
            colors = ButtonDefaults.buttonColors(containerColor = Ink.Navy, contentColor = Color.White),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 20.dp, bottom = 8.dp)
                .height(52.dp),
        ) {
            Text(
                text = if (last) catalog.text("onb.get_started") else catalog.text("onb.next"),
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun PrivacyPill(catalog: Catalog, key: String) {
    // Icon + word, so the promise reads even without color.
    val glyph = when (key) {
        "onb.no_cloud" -> "☁"
        "onb.no_accounts" -> "👤"
        else -> "📊"
    }
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.08f))
            .padding(horizontal = 14.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(glyph, color = Color.White, fontSize = 14.sp)
        Spacer(Modifier.width(8.dp))
        Text(catalog.text(key), color = Color.White.copy(alpha = 0.9f), fontSize = 13.sp)
    }
}
