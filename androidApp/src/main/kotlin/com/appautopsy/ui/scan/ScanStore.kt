package com.appautopsy.ui.scan

import android.content.Context
import com.appautopsy.analysis.model.Verdict
import org.json.JSONArray
import org.json.JSONObject

/**
 * Scan history + counters, kept on-device in SharedPreferences.
 *
 * Privacy contract: only the verdict, score, source and a timestamp per
 * record are stored — never the message text, never the full URL. That is
 * the same rule the backend store follows, enforced here at rest.
 */
object ScanStore {

    enum class Source { LINK, SMS, MAIL, MANUAL }

    data class Record(
        val verdict: String,
        val score: Int,
        val source: Source,
        val atMillis: Long,
    )

    private const val PREFS = "scan_history"
    private const val KEY = "records"
    private const val MAX_RECORDS = 200

    fun record(context: Context, verdict: Verdict?, score: Int, source: Source, atMillis: Long = System.currentTimeMillis()) {
        val v = verdict ?: return
        runCatching {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val arr = parse(prefs.getString(KEY, "[]"))
            val rec = JSONObject()
                .put("v", verdict.id)
                .put("s", score)
                .put("src", source.name)
                .put("t", atMillis)
            arr.put(0, rec) // newest first
            while (arr.length() > MAX_RECORDS) arr.remove(arr.length() - 1)
            prefs.edit().putString(KEY, arr.toString()).apply()
        }
    }

    fun recent(context: Context, limit: Int = 20): List<Record> =
        parse(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "[]"))
            .let { a -> (0 until minOf(limit, a.length())).map { i ->
                val o = a.getJSONObject(i)
                Record(
                    verdict = o.getString("v"),
                    score = o.getInt("s"),
                    source = runCatching { Source.valueOf(o.getString("src")) }.getOrDefault(Source.MANUAL),
                    atMillis = o.getLong("t"),
                )
            } }

    fun counts(context: Context): Map<String, Int> {
        val out = HashMap<String, Int>()
        out["total"] = 0
        for (id in listOf("red", "yellow", "green")) out[id] = 0
        val a = parse(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "[]"))
        for (i in 0 until a.length()) {
            val v = a.getJSONObject(i).getString("v")
            out["total"] = (out["total"] ?: 0) + 1
            out[v] = (out[v] ?: 0) + 1
        }
        return out
    }

    fun clear(context: Context) {
        runCatching {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply()
        }
    }

    private fun parse(raw: String?): JSONArray =
        runCatching { JSONArray(raw ?: "[]") }.getOrElse { JSONArray() }
}

/** A rejected scan is still a checked link — count it as warned with score 0. */
fun ScanStore.record(result: ScanResult, source: ScanStore.Source, context: Context) {
    val verdict = if (result is ScanResult.Rejected) "yellow" else result.verdict.id
    val score = if (result is ScanResult.Rejected) 0 else result.score
    record(context, com.appautopsy.analysis.model.Verdict.fromId(verdict), score, source)
}
