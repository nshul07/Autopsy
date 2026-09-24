"""Typed boundaries: everything crossing HTTP or loaded from JSON.

Breakdown and note items carry a ``reason_key`` plus ``params`` rather than
finished prose, so the frontend can re-render them when the user switches
language without re-running the analysis.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Lang = Literal["en", "hi", "pa"]
Verdict = Literal["green", "yellow", "red"]
Band = Literal["low", "medium", "high"]
Confidence = Literal["high", "medium", "low"]
CertCheck = Literal["ok", "not_checked", "failed"]
CheckStatus = Literal["ok", "flagged", "not_checked"]


class ComponentInfo(BaseModel):
    """A <service> or <receiver> declaration and the signals it carries."""

    name: str
    permission: str | None = None
    meta_data_names: list[str] = Field(default_factory=list)


class ParsedApk(BaseModel):
    """Everything the analysis needs from an APK. Pure data, no file handle."""

    label: str | None = None
    package: str | None = None
    version_name: str | None = None
    version_code: int | None = None
    min_sdk: int | None = None
    target_sdk: int | None = None
    sha256: str = ""
    permissions: list[str] = Field(default_factory=list)
    services: list[ComponentInfo] = Field(default_factory=list)
    receivers: list[ComponentInfo] = Field(default_factory=list)
    activities: list[str] = Field(default_factory=list)
    has_launcher_activity: bool = False
    signing_cert_sha256: list[str] = Field(default_factory=list)
    cert_check: CertCheck = "not_checked"


class CategoryResult(BaseModel):
    id: str
    confidence: Confidence
    method: Literal["user", "keyword", "unknown", "llm"]


class BreakdownItem(BaseModel):
    rule: str
    points: int
    reason_key: str
    status: Literal["expected", "unexpected", "info", "critical"]
    params: dict[str, str] = Field(default_factory=dict)


class PermissionItem(BaseModel):
    name: str
    group: str
    status: Literal["expected", "unexpected"]


class PatternMatch(BaseModel):
    id: str
    bonus: int
    critical: bool
    reason_key: str


class ImpersonationResult(BaseModel):
    brand: str
    reason_key: str


class RepackagingResult(BaseModel):
    detected: bool
    signal: Literal["signer_mismatch", "package_collision", "signer_changed"]
    expected_cert_sha256: str | None = None
    actual_cert_sha256: str | None = None
    detail_key: str


class UpdateDiff(BaseModel):
    has_history: bool
    groups_added: list[str] = Field(default_factory=list)
    groups_removed: list[str] = Field(default_factory=list)
    version_changed: bool = False
    cert_changed: bool = False


class CrowdIntel(BaseModel):
    scans: int
    percent_told_never_install: int | None = None
    insufficient_data: bool = False


class NoteItem(BaseModel):
    """A localized note that carries no score, such as a calibration caveat."""

    reason_key: str
    params: dict[str, str] = Field(default_factory=dict)


class PlaybookStep(BaseModel):
    step_key: str
    params: dict[str, str] = Field(default_factory=dict)


class Prescription(BaseModel):
    minimal_groups: list[str] = Field(default_factory=list)


class AppInfo(BaseModel):
    label: str | None = None
    package: str | None = None
    version_name: str | None = None
    version_code: int | None = None
    min_sdk: int | None = None
    target_sdk: int | None = None
    sha256: str
    signing_cert_sha256: list[str] = Field(default_factory=list)
    cert_check: CertCheck = "not_checked"
    has_launcher_activity: bool = False


class ApkReport(BaseModel):
    report_id: str
    type: Literal["apk"] = "apk"
    created_at: datetime
    app: AppInfo
    category: CategoryResult
    score: int
    band: Band
    verdict: Verdict
    recommendation: str
    critical_pattern_triggered: bool
    breakdown: list[BreakdownItem] = Field(default_factory=list)
    permissions: list[PermissionItem] = Field(default_factory=list)
    patterns: list[PatternMatch] = Field(default_factory=list)
    impersonation: ImpersonationResult | None = None
    repackaging: RepackagingResult | None = None
    update_diff: UpdateDiff | None = None
    crowd_intel: CrowdIntel | None = None
    calibration: list[NoteItem] = Field(default_factory=list)
    playbook: list[PlaybookStep] = Field(default_factory=list)
    prescription: Prescription | None = None
    reasons: list[str] = Field(default_factory=list)
    summary: str = ""
    limitations: str = ""
    lang: Lang = "en"


class LinkCheckResult(BaseModel):
    id: str
    status: CheckStatus
    points: int
    reason_key: str
    params: dict[str, str] = Field(default_factory=dict)


class LinkReport(BaseModel):
    report_id: str
    type: Literal["link"] = "link"
    created_at: datetime
    input_url: str
    final_url: str | None = None
    redirect_chain: list[str] = Field(default_factory=list)
    score: int = 0
    band: Band = "low"
    verdict: Verdict = "green"
    critical_check_triggered: bool = False
    is_direct_apk: bool = False
    offer_apk_scan: bool = False
    checks: list[LinkCheckResult] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    limitations: str = ""
    lang: Lang = "en"


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorEnvelope(BaseModel):
    error: ErrorDetail


class LinkCheckRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    lang: Lang = "en"


class MessageCheckRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    lang: Lang = "en"