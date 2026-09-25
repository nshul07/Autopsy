package com.appautopsy

import android.app.Application
import com.appautopsy.analysis.catalog.Catalog
import com.appautopsy.analysis.model.Lang
import com.appautopsy.analysis.rules.Rules
import com.appautopsy.analysis.rules.RulesLoader

/**
 * Holds the compiled rules and every language catalog for the whole process.
 *
 * Loading happens once, in onCreate, from the app's assets (which point at the
 * canonical `data/` directory — no copy exists inside androidApp). After that
 * everything here is immutable and safe to read from any thread, including the
 * SMS receiver and the notification listener, which analyze incoming content
 * off the main thread.
 */
class AppAutopsyApp : Application() {

    override fun onCreate() {
        super.onCreate()
        val reader: (String) -> String = { name ->
            assets.open(name).bufferedReader().use { it.readText() }
        }
        container = AppContainer(
            rules = RulesLoader.load(reader),
            catalogs = Catalog.loadAll(reader),
        )
    }

    companion object {
        lateinit var container: AppContainer
            private set
    }
}

class AppContainer(
    val rules: Rules,
    val catalogs: Map<Lang, Catalog>,
) {
    @Volatile
    var lang: Lang = Lang.EN

    val catalog: Catalog get() = catalogs.getValue(lang)
}
