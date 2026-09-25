/**
 * The only module in the app that talks to the AppAutopsy backend.
 *
 * Components must never call `fetch` directly — they call this service, so that
 * the backend developer has exactly one file to reconcile if the contract
 * changes.
 *
 * Set `VITE_USE_MOCK_DATA=true` in `.env` to run the whole UI against
 * `src/mocks/` while the backend is still being built. That switch lives here
 * and nowhere else; no component knows whether it is looking at real or demo
 * data.
 */

import type {
  ApkReport,
  HashIntel,
  LinkReport,
  MessageReport,
  Lang,
} from '../types/contract'
import {
  mockApkReport,
  mockLinkReport,
  mockMessageReport,
  mockHashIntel,
  MOCK_DELAY_MS,
} from '../mocks/reports'

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/** Mock mode is on unless it is explicitly switched off with `false`/`0`/`no`. */
const USE_MOCK_RAW = import.meta.env.VITE_USE_MOCK_DATA
export const USE_MOCK_DATA: boolean =
  USE_MOCK_RAW === undefined ? true : !['false', '0', 'no', ''].includes(USE_MOCK_RAW.toLowerCase())

export const API_BASE_URL = BASE_URL

/** Which demo scenario mock mode should return next. */
export type MockScenario = 'low' | 'medium' | 'high'

const MOCK_SCENARIO_KEY = 'appautopsy.mock.scenario'

function readMockScenario(): MockScenario {
  try {
    const v = localStorage.getItem(MOCK_SCENARIO_KEY)
    if (v === 'low' || v === 'medium' || v === 'high') return v
  } catch {
    /* private mode — fall through to the default */
  }
  return 'high'
}

export function setMockScenario(scenario: MockScenario): void {
  try {
    localStorage.setItem(MOCK_SCENARIO_KEY, scenario)
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Every failure the UI can encounter, reduced to a small closed set so the UI
 * never has to render a raw server message.
 */
export type ApiErrorKind =
  | 'offline'
  | 'timeout'
  | 'too_large'
  | 'rate_limited'
  | 'bad_request'
  | 'not_found'
  | 'server'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code?: string

  constructor(kind: ApiErrorKind, status?: number, code?: string) {
    super(kind)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.code = code
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 400) return 'bad_request'
  if (status === 404) return 'not_found'
  if (status === 413) return 'too_large'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server'
  return 'unknown'
}

const REQUEST_TIMEOUT_MS = 90_000

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError'
    throw new ApiError(aborted ? 'timeout' : 'offline')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    let code: string | undefined
    try {
      const body = (await res.json()) as { error?: { code?: string } }
      code = body?.error?.code
    } catch {
      /* response was not JSON — the status alone is enough to classify it */
    }
    throw new ApiError(kindForStatus(res.status), res.status, code)
  }

  return (await res.json()) as T
}

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

/* -------------------------------------------------------------------------- */
/* Public surface                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Upload an APK for analysis.
 *
 * The frontend only ever streams the file to the backend for static parsing.
 * It never reads, unpacks, executes or installs the APK.
 */
export async function analyzeApk(
  file: File,
  lang: Lang = 'en',
  category?: string
): Promise<ApkReport> {
  if (USE_MOCK_DATA) {
    await mockDelay()
    return mockApkReport(readMockScenario(), file.name, lang)
  }

  const form = new FormData()
  form.append('file', file)
  if (category) form.append('category', category)
  form.append('lang', lang)

  return request<ApkReport>('/api/v1/apk/analyze', { method: 'POST', body: form })
}

/** Check a download link. The backend reads headers only — never the body. */
export async function checkLink(url: string, lang: Lang = 'en'): Promise<LinkReport> {
  if (USE_MOCK_DATA) {
    await mockDelay()
    return mockLinkReport(url, lang)
  }

  return request<LinkReport>('/api/v1/link/check', {
    method: 'POST',
    body: JSON.stringify({ url, lang }),
  })
}

/** Check a suspicious message. Message text is never stored. */
export async function checkMessage(text: string, lang: Lang = 'en'): Promise<MessageReport> {
  if (USE_MOCK_DATA) {
    await mockDelay()
    return mockMessageReport(text, lang)
  }

  return request<MessageReport>('/api/v1/message/check', {
    method: 'POST',
    body: JSON.stringify({ text, lang }),
  })
}

/** Fetch a stored report by id (1 h TTL server-side). */
export async function getReport(reportId: string): Promise<ApkReport | LinkReport | MessageReport> {
  if (USE_MOCK_DATA) {
    await mockDelay()
    return mockApkReport('high', undefined, 'en')
  }
  return request(`/api/v1/report/${encodeURIComponent(reportId)}`, { method: 'GET' })
}

/** Aggregate crowd counts for a file hash. Hash only — never the file. */
export async function getHashIntel(sha256: string): Promise<HashIntel> {
  if (USE_MOCK_DATA) {
    await mockDelay()
    return mockHashIntel(sha256)
  }
  return request<HashIntel>(`/api/v1/intel/hash/${encodeURIComponent(sha256)}`, { method: 'GET' })
}

export async function getHealth(): Promise<{ status: string; version: string }> {
  return request('/health', { method: 'GET' })
}

/** Human-readable label for an error kind. Resolved through i18n by the UI. */
export function errorKindOf(err: unknown): ApiErrorKind {
  if (err instanceof ApiError) return err.kind
  return 'unknown'
}