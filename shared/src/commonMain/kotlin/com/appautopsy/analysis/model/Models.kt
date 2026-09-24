package com.appautopsy.analysis.model

/**
 * Every type that crosses a boundary: the parser produces these, the scorer
 * consumes them, and the UI renders them.
 *
 * Reports carry a `reasonKey` plus `params` instead of finished prose so the UI
 * can re-render a finished report in another language without re-running the
 * analysis. That matters here because switching language must be instant.
 */

enum class Lang(val code: String) {
    EN("en"),
    HI("hi"),
    PA("pa");

    companion object {
        fun fromCode(code: String?): Lang =
            entries.firstOrNull { it.code.equals(code, ignoreCase = true) } ?: EN
    }
}

enum class Verdict(val id: String) {
    GREEN("green"),
    YELLOW("yellow"),
    RED("red");

    companion object {
        fun fromId(id: String): Verdict =
            entries.firstOrNull { it.id == id } ?: GREEN
    }
}

enum class Band(val id: String) {
    LOW("low"),
    MEDIUM("medium"),
    HIGH("high");

    companion object {
        fun fromId(id: String): Band = entries.firstOrNull { it.id == id } ?: LOW
    }
}

enum class Confidence(val id: String) {
    HIGH("high"),
    MEDIUM("medium"),
    LOW("low");

    companion object {
        fun fromId(id: String?): Confidence =
            entries.firstOrNull { it.id == id } ?: LOW
    }
}

enum class CertCheck(val id: String) {
    /** Signature blocks were found and parsed. */
    OK("ok"),

    /** No signature could be read. Never treated as "passed". */
    NOT_CHECKED("not_checked"),

    /** Signature present but malformed. */
    FAILED("failed");
}

enum class CheckStatus(val id: String) {
    OK("ok"),
    FLAGGED("flagged"),
    NOT_CHECKED("not_checked");
}

/** A `<service>` or `<receiver>` declaration and the signals it carries. */
data class ComponentInfo(
    val name: String,
    val permission: String? = null,
    val metaDataNames: List<String> = emptyList(),
)

/**
 * Everything the analysis needs from an APK. Pure data with no file handle, so
 * the scorer can never accidentally depend on the archive still being open.
 */
data class ParsedApk(
    val label: String? = null,
    val packageName: String? = null,
    val versionName: String? = null,
    val versionCode: Long? = null,
    val minSdk: Int? = null,
    val targetSdk: Int? = null,
    val sha256: String = "",
    val permissions: List<String> = emptyList(),
    val services: List<ComponentInfo> = emptyList(),
    val receivers: List<ComponentInfo> = emptyList(),
    val activities: List<String> = emptyList(),
    val hasLauncherActivity: Boolean = false,
    val signingCertSha256: List<String> = emptyList(),
    val certCheck: CertCheck = CertCheck.NOT_CHECKED,
)

data class CategoryResult(
    val id: String,
    val confidence: Confidence,
    val method: String,
)

data class BreakdownItem(
    val rule: String,
    val points: Int,
    val reasonKey: String,
    val status: String,
    val params: Map<String, String> = emptyMap(),
)

data class PermissionItem(
    val name: String,
    val group: String,
    val status: String,
)

data class PatternMatch(
    val id: String,
    val bonus: Int,
    val critical: Boolean,
    val reasonKey: String,
)

data class ImpersonationResult(
    val brand: String,
    val reasonKey: String,
)

data class RepackagingResult(
    val detected: Boolean,
    val signal: String,
    val expectedCertSha256: String? = null,
    val actualCertSha256: String? = null,
    val detailKey: String,
)

data class UpdateDiff(
    val hasHistory: Boolean,
    val groupsAdded: List<String> = emptyList(),
    val groupsRemoved: List<String> = emptyList(),
    val versionChanged: Boolean = false,
    val certChanged: Boolean = false,
)

data class CrowdIntel(
    val scans: Int,
    val percentToldNeverInstall: Int? = null,
    val insufficientData: Boolean = false,
)

/** A localized note carrying no score, such as a calibration caveat. */
data class NoteItem(
    val reasonKey: String,
    val params: Map<String, String> = emptyMap(),
)

data class PlaybookStep(
    val stepKey: String,
    val params: Map<String, String> = emptyMap(),
)

data class Prescription(
    val minimalGroups: List<String> = emptyList(),
)

/** The result of scoring, before it is assembled into a renderable report. */
data class ScoreResult(
    val score: Int,
    val band: Band,
    val verdict: Verdict,
    val recommendation: String,
    val criticalOverride: Boolean,
    val breakdown: List<BreakdownItem>,
    val permissions: List<PermissionItem>,
    val patterns: List<PatternMatch>,
    val presentGroups: Set<String>,
    val unexpectedGroups: Set<String>,
)

/** Why an analysis could not be completed. Codes match the message catalog. */
enum class AnalysisErrorCode(val code: String) {
    FILE_TOO_LARGE("file_too_large"),
    NOT_AN_APK("not_an_apk"),
    MANIFEST_UNREADABLE("manifest_unreadable"),
    ANALYSIS_TIMEOUT("analysis_timeout"),
    INTERNAL("internal");
}

class AnalysisException(
    val code: AnalysisErrorCode,
    message: String,
) : Exception(message)