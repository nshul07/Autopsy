/**
 * The AppAutopsy backend contract.
 *
 * These types mirror the response shapes documented in `AGENTS.md` §8. The
 * frontend never derives any of these values — it renders what the backend
 * returns. Nothing in this folder computes a score, matches a pattern or
 * inspects a file.
 */

export type Band = 'low' | 'medium' | 'high'
export type Verdict = 'green' | 'yellow' | 'red'
export type Confidence = 'high' | 'medium' | 'low'
export type CheckStatus = 'expected' | 'unexpected' | 'not_checked'
export type Lang = 'en' | 'hi' | 'pa'

/** Permission groups. Groups carry the score, not individual permissions. */
export type PermissionGroup =
  | 'sms'
  | 'contacts'
  | 'call_log'
  | 'microphone'
  | 'camera'
  | 'location'
  | 'accessibility'
  | 'overlay'
  | 'install_packages'
  | 'notification_listener'
  | 'device_admin'
  | 'calls'
  | 'all_files'
  | 'boot'

export interface AppInfo {
  label: string
  package: string
  version_name?: string
  version_code?: number
  min_sdk?: number
  target_sdk?: number
  /** Empty string when the backend could not compute it — never invented. */
  sha256?: string
  /** Empty array means "could not be checked", which is not a pass. */
  signing_cert_sha256?: string[]
  cert_check?: 'ok' | 'not_checked'
}

export interface CategoryInfo {
  id: string
  confidence: Confidence
  method: string
  /** True when the backend disabled the mismatch penalty (unknown category). */
  mismatch_penalty_disabled?: boolean
}

export interface PermissionEntry {
  /** Technical name, e.g. `android.permission.READ_SMS`. Shown only on demand. */
  name: string
  group?: PermissionGroup
  status: CheckStatus
}

export interface PatternMatch {
  id: string
  bonus: number
  critical: boolean
}

export interface RepackagingInfo {
  detected: boolean
  signal?: string
  expected_cert_sha256?: string
  actual_cert_sha256?: string
}

export interface ImpersonationInfo {
  brand?: string
  signal?: string
  expected_package?: string
}

export interface UpdateDiff {
  has_history: boolean
  groups_added: PermissionGroup[]
  groups_removed: PermissionGroup[]
  version_changed: boolean
  cert_changed: boolean
}

/**
 * Aggregate, privacy-preserving counts. `insufficient_data` replaces the
 * percentages below 5 scans — the UI must not invent a percentage when the
 * backend withheld one.
 */
export interface CrowdIntel {
  status?: 'ok' | 'insufficient_data'
  people_who_scanned_this?: number
  percent_told_never_install?: number
}

export interface PlaybookStep {
  step_key: string
  params?: Record<string, string | number>
}

export interface Prescription {
  minimal_groups: PermissionGroup[]
}

export interface BreakdownEntry {
  rule: string
  points: number
  reason_key: string
  status: CheckStatus
}

/** Response of `POST /api/v1/apk/analyze`. */
export interface ApkReport {
  report_id: string
  type: 'apk'
  created_at: string

  app: AppInfo
  category: CategoryInfo

  score: number
  band: Band
  verdict: Verdict
  recommendation: 'safe_to_proceed' | 'review_carefully' | 'do_not_install'
  critical_pattern_triggered?: boolean

  breakdown: BreakdownEntry[]
  permissions: PermissionEntry[]
  patterns: PatternMatch[]
  impersonation?: ImpersonationInfo | null
  repackaging?: RepackagingInfo | null
  update_diff?: UpdateDiff | null
  crowd_intel?: CrowdIntel | null

  calibration: string[]
  playbook: PlaybookStep[]
  prescription?: Prescription | null

  reasons: string[]
  summary: string
  /** Always present. Rendered on every result surface. */
  limitations: string
  lang: Lang
}

/** Response of `POST /api/v1/link/check`. */
export interface LinkReport {
  report_id: string
  type: 'link'
  created_at: string

  url: string
  final_url: string
  redirect_count: number
  https: boolean
  direct_apk: boolean
  lookalike_domain: boolean
  reputation: 'ok' | 'not_checked' | 'suspicious' | 'clean'

  score: number
  band: Band
  verdict: Verdict
  recommendation: 'safe_to_proceed' | 'review_carefully' | 'do_not_install'

  reasons: string[]
  summary: string
  /** Set when the link returned an APK, so the UI can offer to scan it. */
  offer_apk_scan?: boolean

  calibration: string[]
  limitations: string
  lang: Lang
}

export type MessageSignal =
  | 'urgency'
  | 'otp_request'
  | 'suspicious_link'
  | 'apk_mention'
  | 'prize_claim'
  | 'kyc_threat'
  | 'impersonation'

/** Response of `POST /api/v1/message/check`. */
export interface MessageReport {
  report_id: string
  type: 'message'
  created_at: string

  signals: MessageSignal[]
  extracted_urls: string[]

  score: number
  band: Band
  verdict: Verdict
  recommendation: 'safe_to_proceed' | 'review_carefully' | 'do_not_install'

  reasons: string[]
  summary: string

  calibration: string[]
  limitations: string
  lang: Lang
}

/** Response of `GET /api/v1/intel/hash/{sha256}`. */
export interface HashIntel {
  sha256: string
  status: 'ok' | 'insufficient_data' | 'unknown'
  scans?: number
  red_count?: number
  percent_told_never_install?: number
}

export type AnyReport = ApkReport | LinkReport | MessageReport

/** Normalized error envelope: `{"error": {"code": "...", "message": "..."}}`. */
export interface ApiErrorBody {
  error: { code: string; message: string }
}

export type ScanSource = 'link' | 'sms' | 'email' | 'manual'

/** A report summary as stored in local history. Never holds file bytes. */
export interface HistoryEntry {
  id: string
  type: 'apk' | 'link' | 'message'
  source?: ScanSource
  title: string
  subtitle?: string
  score: number
  band: Band
  verdict: Verdict
  recommendation: ApkReport['recommendation']
  createdAt: string
}

export function isApkReport(r: AnyReport): r is ApkReport {
  return r.type === 'apk'
}

export function isLinkReport(r: AnyReport): r is LinkReport {
  return r.type === 'link'
}

export function isMessageReport(r: AnyReport): r is MessageReport {
  return r.type === 'message'
}