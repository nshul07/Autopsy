/**
 * DEMO DATA — development only.
 *
 * Nothing in this file is real security analysis. These objects exist so the
 * interface can be built and demonstrated before the backend is connected.
 * Every report built here carries `isDemo` so the UI can label it, and the
 * `limitations` string is always present.
 *
 * Scores in these fixtures are chosen to exercise the three bands
 * (8 / 48 / 78). They are not produced by the risk engine — the real engine
 * is `backend/app/core/risk_engine.py` and is the only scoring implementation
 * in this project.
 */

import type {
  ApkReport,
  HashIntel,
  Lang,
  LinkReport,
  MessageReport,
} from '../types/contract'

export const MOCK_DELAY_MS = 1800

export const DISCLAIMER =
  'Static analysis only. This is not a guarantee of safety.'

/** Marks a report as demo data so every screen can label it honestly. */
export interface DemoMarked {
  isDemo: true
}

/** Convert a scenario fixture into a report for the requested language. */
function localize<T extends { lang: Lang }>(report: T, lang: Lang): T {
  return { ...report, lang }
}

const MOCK_REPORT_ID = 'demo00000000'

function nowIso(): string {
  return new Date().toISOString()
}

/* -------------------------------------------------------------------------- */
/* APK — low risk                                                             */
/* -------------------------------------------------------------------------- */

export const mockCalculator: ApkReport & DemoMarked = {
  report_id: MOCK_REPORT_ID,
  type: 'apk',
  created_at: nowIso(),
  isDemo: true,

  app: {
    label: 'Simple Calculator (DEMO)',
    package: 'com.example.simplecalculator',
    version_name: '3.2.0',
    version_code: 32,
    min_sdk: 21,
    target_sdk: 33,
    sha256: 'a41f7c2e9b0d5a38f6c1e4b7d2a9f0c3e6b5d8a1f4c7e0b3d6a9f2c5e8b1d4a7',
    signing_cert_sha256: ['6d2b8f1a4c7e0b3d6a9f2c5e8b1d4a7f0c3e6b5d8a1f4c7e0b3d6a9f2c5e8b1d'],
    cert_check: 'ok',
  },

  category: { id: 'calculator', confidence: 'high', method: 'keyword' },
  score: 8,
  band: 'low',
  verdict: 'green',
  recommendation: 'safe_to_proceed',
  critical_pattern_triggered: false,

  breakdown: [
    { rule: 'group:boot', points: 0, reason_key: 'perm.boot.expected', status: 'expected' },
  ],

  permissions: [
    { name: 'android.permission.RECEIVE_BOOT_COMPLETED', group: 'boot', status: 'expected' },
    { name: 'android.permission.VIBRATE', status: 'expected' },
    { name: 'android.permission.INTERNET', status: 'expected' },
  ],

  patterns: [],
  impersonation: null,
  repackaging: { detected: false },
  update_diff: null,
  crowd_intel: { status: 'ok', people_who_scanned_this: 63, percent_told_never_install: 4 },

  calibration: [
    'A calculator app normally needs no sensitive permissions, and none were found.',
    'A low score means no major red flags appeared in the checks that ran. It does not prove the app is harmless.',
  ],

  playbook: [],

  prescription: { minimal_groups: [] },

  reasons: [
    'No sensitive permissions were requested.',
    'The app does not ask for access to your messages, contacts or location.',
  ],

  summary:
    'No major red flags were found in the checks that were run. A calculator app normally needs no sensitive access, and this one requests none.',

  limitations: DISCLAIMER,
  lang: 'en',
}

/* -------------------------------------------------------------------------- */
/* APK — medium risk                                                          */
/* -------------------------------------------------------------------------- */

export const mockUtility: ApkReport & DemoMarked = {
  report_id: MOCK_REPORT_ID,
  type: 'apk',
  created_at: nowIso(),
  isDemo: true,

  app: {
    label: 'Clean Master Tool (DEMO)',
    package: 'com.example.cleanmastertool',
    version_name: '5.0.2',
    version_code: 502,
    min_sdk: 21,
    target_sdk: 33,
    sha256: 'c8e5b2a9f6d3c0a7b4e1d8c5f2a9b6e3d0c7f4a1b8e5d2c9f6a3b0e7d4c1f8a5',
    signing_cert_sha256: ['1f4c7e0b3d6a9f2c5e8b1d4a7f0c3e6b5d8a1f4c7e0b3d6a9f2c5e8b1d4a7f0'],
    cert_check: 'ok',
  },

  category: { id: 'unknown', confidence: 'low', method: 'none', mismatch_penalty_disabled: true },
  score: 48,
  band: 'medium',
  verdict: 'yellow',
  recommendation: 'review_carefully',
  critical_pattern_triggered: false,

  breakdown: [
    { rule: 'group:location', points: 8, reason_key: 'perm.location.unexpected', status: 'unexpected' },
    { rule: 'group:overlay', points: 20, reason_key: 'perm.overlay.unexpected', status: 'unexpected' },
    { rule: 'group:contacts', points: 15, reason_key: 'perm.contacts.unexpected', status: 'unexpected' },
  ],

  permissions: [
    { name: 'android.permission.ACCESS_FINE_LOCATION', group: 'location', status: 'unexpected' },
    { name: 'android.permission.SYSTEM_ALERT_WINDOW', group: 'overlay', status: 'unexpected' },
    { name: 'android.permission.READ_CONTACTS', group: 'contacts', status: 'unexpected' },
    { name: 'android.permission.CAMERA', group: 'camera', status: 'not_checked' },
  ],

  patterns: [],
  impersonation: null,
  repackaging: { detected: false },
  update_diff: null,
  crowd_intel: { status: 'insufficient_data' },

  calibration: [
    'We could not confidently identify what kind of app this is, so the usual comparison could not be applied.',
    'Some legitimate apps need unusual permissions. This can produce false alarms.',
    'The purpose described by the app does not match the access it requests, which may be a wording problem rather than a risk.',
  ],

  prescription: { minimal_groups: [] },

  reasons: [
    'Location access is requested, but the app does not describe a reason for it.',
    'The ability to draw over other apps is requested. This is often used for advertising, and can also be used to show false screens on top of a real app.',
    'Access to contacts is requested, which a cleaning or storage tool would not normally need.',
  ],

  summary:
    'Some requested access is unusual for what this app says it does. Review the permissions before you install it.',

  limitations: DISCLAIMER,
  lang: 'en',
}

/* -------------------------------------------------------------------------- */
/* APK — high risk, with repackaging                                          */
/* -------------------------------------------------------------------------- */

export const mockFlashlight: ApkReport & DemoMarked = {
  report_id: MOCK_REPORT_ID,
  type: 'apk',
  created_at: nowIso(),
  isDemo: true,

  app: {
    label: 'Flashlight Pro (DEMO)',
    package: 'com.example.flashlightpro',
    version_name: '2.1.4',
    version_code: 214,
    min_sdk: 19,
    target_sdk: 30,
    sha256: 'd4c1f8a5b2e9d6c3a0f7b4e1d8c5f2a9b6e3d0c7f4a1b8e5d2c9f6a3b0e7d4c1',
    signing_cert_sha256: ['9a6f3c0e7b4d1a8f5c2e9b6d3a0f7c4e1b8d5a2f9c6e3b0d7a4f1c8e5b2d9a6'],
    cert_check: 'ok',
  },

  category: { id: 'flashlight', confidence: 'medium', method: 'keyword' },
  score: 78,
  band: 'high',
  verdict: 'red',
  recommendation: 'do_not_install',
  critical_pattern_triggered: true,

  breakdown: [
    { rule: 'group:accessibility', points: 25, reason_key: 'perm.accessibility.unexpected', status: 'unexpected' },
    { rule: 'group:overlay', points: 20, reason_key: 'perm.overlay.unexpected', status: 'unexpected' },
    { rule: 'group:sms', points: 20, reason_key: 'perm.sms.unexpected', status: 'unexpected' },
    { rule: 'group:location', points: 8, reason_key: 'perm.location.unexpected', status: 'unexpected' },
    { rule: 'mismatch', points: 20, reason_key: 'mismatch.generic', status: 'unexpected' },
    { rule: 'pattern:otp_stealer', points: 15, reason_key: 'pattern.otp_stealer', status: 'unexpected' },
  ],

  permissions: [
    { name: 'android.permission.READ_SMS', group: 'sms', status: 'unexpected' },
    { name: 'android.permission.RECEIVE_SMS', group: 'sms', status: 'unexpected' },
    { name: 'android.permission.SYSTEM_ALERT_WINDOW', group: 'overlay', status: 'unexpected' },
    { name: 'android.permission.ACCESS_FINE_LOCATION', group: 'location', status: 'unexpected' },
    { name: 'android.permission.BIND_ACCESSIBILITY_SERVICE', group: 'accessibility', status: 'unexpected' },
    { name: 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE', group: 'notification_listener', status: 'unexpected' },
    { name: 'android.permission.CAMERA', group: 'camera', status: 'expected' },
  ],

  patterns: [
    { id: 'otp_stealer', bonus: 15, critical: true },
    { id: 'banking_trojan', bonus: 25, critical: true },
  ],

  impersonation: null,

  repackaging: {
    detected: true,
    signal: 'signer_mismatch',
    expected_cert_sha256: '2b7e4a1d8f5c2e9b6d3a0f7c4e1b8d5a2f9c6e3b0d7a4f1c8e5b2d9a6f3c0e7',
    actual_cert_sha256: '9a6f3c0e7b4d1a8f5c2e9b6d3a0f7c4e1b8d5a2f9c6e3b0d7a4f1c8e5b2d9a6',
  },

  update_diff: {
    has_history: true,
    groups_added: ['sms', 'accessibility'],
    groups_removed: [],
    version_changed: true,
    cert_changed: true,
  },

  crowd_intel: { status: 'ok', people_who_scanned_this: 412, percent_told_never_install: 89 },

  calibration: [
    'The app category was estimated from its name, not confirmed by the developer.',
    'Some checks could not run because an optional reputation service was unavailable.',
    'A flashlight needs no sensitive permission at all, so the access requested here cannot be explained by its stated purpose.',
  ],

  playbook: [
    { step_key: 'playbook.do_not_install' },
    { step_key: 'playbook.remove_if_installed', params: { app: 'Flashlight Pro (DEMO)' } },
    { step_key: 'playbook.contact_bank_if_otp' },
    { step_key: 'playbook.report_cybercrime' },
  ],

  prescription: { minimal_groups: ['camera'] },

  reasons: [
    'This app can read your text messages. A flashlight has no reason to need them — this is the access used to steal one-time passwords.',
    'This app can draw over other apps. That can be used to place a fake screen on top of a real banking app.',
    'This app registers an accessibility service, which can allow it to read what is on your screen and act on your behalf.',
    'The app asks for access that does not match what a flashlight is for.',
  ],

  summary:
    'This flashlight app asks for access that is unusual for its purpose. It can read messages and control your screen, and it appears to be signed by a different developer than the official version.',

  limitations: DISCLAIMER,
  lang: 'en',
}

/* -------------------------------------------------------------------------- */
/* Link                                                                        */
/* -------------------------------------------------------------------------- */

export const mockLink: LinkReport & DemoMarked = {
  report_id: MOCK_REPORT_ID,
  type: 'link',
  created_at: nowIso(),
  isDemo: true,

  url: 'https://sbi-rewards-claim.info/apk/download?id=48213',
  final_url: 'https://sbi-rewards-claim.info/apk/download?id=48213',
  redirect_count: 2,
  https: true,
  direct_apk: true,
  lookalike_domain: true,
  reputation: 'not_checked',

  score: 81,
  band: 'high',
  verdict: 'red',
  recommendation: 'do_not_install',

  reasons: [
    'This address uses a name that looks like a bank, but it is not the bank’s official website.',
    'The link downloads an installable app file directly, instead of opening a Play Store page.',
    'We could not check this address against a reputation service, so no verdict was made about its history.',
  ],

  summary:
    'This link uses a name that resembles a bank, and it downloads an app file directly. Do not download from it.',

  offer_apk_scan: true,

  calibration: [
    'Reputation lookup was not available for this address, so its history could not be checked.',
    'Look-alike detection compares the address against known official domains. A new legitimate domain may resemble one without intending to.',
  ],

  limitations: DISCLAIMER,
  lang: 'en',
}

/* -------------------------------------------------------------------------- */
/* Message                                                                     */
/* -------------------------------------------------------------------------- */

export const mockMessage: MessageReport & DemoMarked = {
  report_id: MOCK_REPORT_ID,
  type: 'message',
  created_at: nowIso(),
  isDemo: true,

  signals: ['urgency', 'otp_request', 'suspicious_link', 'apk_mention', 'impersonation'],

  extracted_urls: ['https://sbi-rewards-claim.info/apk/download?id=48213'],

  score: 74,
  band: 'high',
  verdict: 'red',
  recommendation: 'do_not_install',

  reasons: [
    'The message creates urgency and threatens that an account will be blocked.',
    'It asks for a one-time password. No bank or government office asks for an OTP by message.',
    'It contains a link that downloads an app file directly.',
    'It mentions installing an app to receive a benefit, which is how most fake reward schemes spread.',
  ],

  summary:
    'This message shows several warning signs of a scam, including an OTP request and a link that downloads an app file.',

  calibration: [
    'This check looks at the wording and the links in the message. It does not confirm who sent it.',
    'A genuine message from your bank may also contain a link, so treat this as a warning to verify separately, not proof of fraud.',
  ],

  limitations: DISCLAIMER,
  lang: 'en',
}

/* -------------------------------------------------------------------------- */
/* Lookups used by the service layer                                           */
/* -------------------------------------------------------------------------- */

export type MockScenarioId = 'low' | 'medium' | 'high'

const APK_BY_SCENARIO: Record<MockScenarioId, ApkReport & DemoMarked> = {
  low: mockCalculator,
  medium: mockUtility,
  high: mockFlashlight,
}

/**
 * Returns a demo APK report. `fileName` is accepted so the demo can reflect
 * the file the user actually picked, which makes the mock flow feel real.
 * The parsed values themselves are still fixed demo values.
 */
export function mockApkReport(
  scenario: MockScenarioId,
  _fileName?: string,
  lang: Lang = 'en'
): ApkReport & DemoMarked {
  return localize(APK_BY_SCENARIO[scenario], lang)
}

export function mockLinkReport(url: string, lang: Lang = 'en'): LinkReport & DemoMarked {
  return localize({ ...mockLink, url, final_url: url }, lang)
}

export function mockMessageReport(text: string, lang: Lang = 'en'): MessageReport & DemoMarked {
  return localize(
    { ...mockMessage, extracted_urls: text.includes('http') ? mockMessage.extracted_urls : [] },
    lang
  )
}

export function mockHashIntel(sha256: string): HashIntel {
  const high = sha256.startsWith('d4')
  return {
    sha256,
    status: 'ok',
    scans: high ? 412 : 63,
    red_count: high ? 367 : 3,
    percent_told_never_install: high ? 89 : 4,
  }
}

/** The three demo scenarios offered on the Home screen in mock mode. */
export const DEMO_SCENARIOS: { id: MockScenarioId; label: string }[] = [
  { id: 'low', label: 'Low risk' },
  { id: 'medium', label: 'Medium risk' },
  { id: 'high', label: 'High risk' },
]