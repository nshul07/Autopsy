/**
 * Input validation for the UI only.
 *
 * These checks catch empty fields, obviously malformed input and the wrong
 * file type before a request is made. They are *not* security analysis — no
 * scoring, no pattern matching and no file inspection happens here. Deciding
 * whether a link or a file is risky belongs to the backend.
 */

import type { Band } from '../types/contract'

export const MAX_APK_MB = 100
export const MAX_APK_BYTES = MAX_APK_MB * 1024 * 1024

export type FileCheck =
  | { ok: true }
  | { ok: false; reason: 'too_large' | 'not_apk' | 'empty' }

/** Confirms the picked file is plausibly an APK of an acceptable size. */
export function validateApkFile(file: { name: string; size: number }): FileCheck {
  if (file.size === 0) return { ok: false, reason: 'empty' }
  if (file.size > MAX_APK_BYTES) return { ok: false, reason: 'too_large' }
  if (!file.name.toLowerCase().endsWith('.apk')) return { ok: false, reason: 'not_apk' }
  return { ok: true }
}

export type UrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: 'empty' | 'invalid' | 'scheme' }

/**
 * Normalizes a pasted address and confirms it is something the backend can
 * fetch. Bare hosts like `example.com/x` are upgraded to https.
 */
export function validateUrl(raw: string): UrlCheck {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, reason: 'empty' }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return { ok: false, reason: 'invalid' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'scheme' }
  }
  // A hostname with no dot and not localhost is not a usable public address.
  if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
    return { ok: false, reason: 'invalid' }
  }

  return { ok: true, url: parsed.toString() }
}

export function isProbablyUrl(text: string): boolean {
  return validateUrl(text).ok
}

/** Risk band thresholds, as defined by the backend. The UI only displays them. */
export function bandForScore(score: number): Band {
  if (score <= 25) return 'low'
  if (score <= 60) return 'medium'
  return 'high'
}