package com.appautopsy.analysis

import com.appautopsy.analysis.rules.Rules
import com.appautopsy.analysis.rules.RulesLoader
import java.io.File

/**
 * Loads the real shipped rules into tests.
 *
 * The tests read the same JSON the app ships, so a rule edit that breaks scoring
 * fails the build here rather than surprising someone mid-demo. Fixtures are
 * built from the rules themselves rather than hard-coded, so renaming a
 * permission in JSON cannot silently desynchronise a test.
 */
object TestData {

    private val dataDir: File by lazy {
        var dir: File? = File(".").absoluteFile
        while (dir != null) {
            if (File(dir, "data/rules.json").exists()) return@lazy File(dir, "data")
            dir = dir.parentFile
        }
        error("could not locate data/ upward from ${File(".").absolutePath}")
    }

    val rules: Rules by lazy {
        RulesLoader.load { name -> File(dataDir, name).readText() }
    }
}