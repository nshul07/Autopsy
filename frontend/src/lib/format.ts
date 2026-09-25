import type { Band, PermissionGroup } from '../types/contract'

/** Safe hostname for display. Returns the raw string when it cannot be parsed. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** `Today` / `Yesterday` / `Earlier`, for grouping the history list. */
export function dayBucket(iso: string): 'today' | 'yesterday' | 'earlier' {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return 'earlier'

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (then >= startOfToday) return 'today'
  if (then >= startOfYesterday) return 'yesterday'
  return 'earlier'
}

export function formatTime(iso: string, locale: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
}

/** Shortens a hash for display while keeping enough to be identifiable. */
export function shortHash(hash: string, groups = 4): string {
  if (!hash) return ''
  const chunk = Math.ceil(hash.length / groups)
  return (hash.match(new RegExp(`.{1,${chunk}}`, 'g')) ?? []).join(' ')
}

export function truncateMiddle(value: string, max = 42): string {
  if (value.length <= max) return value
  const head = Math.ceil((max - 1) / 2)
  return `${value.slice(0, head)}…${value.slice(value.length - (max - head - 1))}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const BAND_ORDER: Band[] = ['low', 'medium', 'high']

/**
 * Turns a permission group id into the i18n key used for its friendly label.
 * The technical permission string is never shown first — see PermissionRow.
 */
const GROUP_LABEL_KEY: Record<PermissionGroup, string> = {
  sms: 'group.sms',
  contacts: 'group.contacts',
  call_log: 'group.call_log',
  microphone: 'group.microphone',
  camera: 'group.camera',
  location: 'group.location',
  accessibility: 'group.accessibility',
  overlay: 'group.overlay',
  install_packages: 'group.install_packages',
  notification_listener: 'group.notification_listener',
  device_admin: 'group.device_admin',
  calls: 'group.calls',
  all_files: 'group.all_files',
  boot: 'group.boot',
}

export function groupLabelKey(group: PermissionGroup): string {
  return GROUP_LABEL_KEY[group] ?? 'group.unknown'
}

/**
 * Derives a friendly label key from a raw permission string when the backend
 * did not supply a group. Purely cosmetic — it never affects the verdict.
 */
export function labelKeyForPermission(permissionName: string): string {
  const tail = permissionName.replace(/^android\.permission\./, '').toLowerCase()
  if (tail.includes('sms') || tail.includes('mms')) return 'group.sms'
  if (tail.includes('contact')) return 'group.contacts'
  if (tail.includes('call_log')) return 'group.call_log'
  if (tail.includes('audio')) return 'group.microphone'
  if (tail.includes('camera')) return 'group.camera'
  if (tail.includes('location')) return 'group.location'
  if (tail.includes('accessibility')) return 'group.accessibility'
  if (tail.includes('system_alert_window')) return 'group.overlay'
  if (tail.includes('install_packages')) return 'group.install_packages'
  if (tail.includes('notification_listener')) return 'group.notification_listener'
  if (tail.includes('device_admin')) return 'group.device_admin'
  if (tail.includes('call_phone')) return 'group.calls'
  if (tail.includes('external_storage')) return 'group.all_files'
  if (tail.includes('boot_completed')) return 'group.boot'
  return 'group.other'
}

/** Human-readable countdown/label for the report age. */
export function relativeAge(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const minutes = Math.floor((Date.now() - then) / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}