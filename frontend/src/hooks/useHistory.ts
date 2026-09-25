import { useState, useEffect, useCallback } from 'react'
import type { AnyReport, HistoryEntry } from '../types/contract'

const HISTORY_KEY = 'appautopsy.history'
const REPORTS_STORE_KEY = 'appautopsy.reports.cache'
const MAX_ENTRIES = 50

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        setHistory(JSON.parse(raw))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const addReport = useCallback(
    (report: AnyReport) => {
      let title = 'Unknown'
      let subtitle = ''

      if (report.type === 'apk') {
        title = report.app.label || report.app.package || 'APK File'
        subtitle = report.app.package
      } else if (report.type === 'link') {
        try {
          title = new URL(report.url).hostname
        } catch {
          title = report.url
        }
        subtitle = report.direct_apk ? 'APK download link' : 'Web link'
      } else if (report.type === 'message') {
        title = 'Suspicious message'
        subtitle = `${report.signals.length} warning signs`
      }

      const entry: HistoryEntry = {
        id: report.report_id,
        type: report.type,
        title,
        subtitle,
        score: report.score,
        band: report.band,
        verdict: report.verdict,
        recommendation: report.recommendation,
        createdAt: report.created_at || new Date().toISOString(),
      }

      try {
        // Save to history list
        const raw = localStorage.getItem(HISTORY_KEY)
        const list: HistoryEntry[] = raw ? JSON.parse(raw) : []
        const filtered = list.filter((item) => item.id !== entry.id)
        const updated = [entry, ...filtered].slice(0, MAX_ENTRIES)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
        setHistory(updated)

        // Cache the raw report so history items can be reopened
        const cacheRaw = localStorage.getItem(REPORTS_STORE_KEY)
        const cache: Record<string, AnyReport> = cacheRaw ? JSON.parse(cacheRaw) : {}
        cache[report.report_id] = report
        localStorage.setItem(REPORTS_STORE_KEY, JSON.stringify(cache))
      } catch {
        /* storage full or unavailable */
      }
    },
    []
  )

  const getCachedReport = useCallback((id: string): AnyReport | null => {
    try {
      const cacheRaw = localStorage.getItem(REPORTS_STORE_KEY)
      if (cacheRaw) {
        const cache: Record<string, AnyReport> = JSON.parse(cacheRaw)
        return cache[id] ?? null
      }
    } catch {
      /* ignore */
    }
    return null
  }, [])

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(HISTORY_KEY)
      localStorage.removeItem(REPORTS_STORE_KEY)
    } catch {
      /* ignore */
    }
    setHistory([])
  }, [])

  return { history, addReport, getCachedReport, clearHistory, refresh: loadHistory }
}
