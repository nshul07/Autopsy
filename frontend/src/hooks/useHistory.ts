import { useState, useEffect, useCallback, useMemo } from 'react'
import type { AnyReport, HistoryEntry, ScanSource } from '../types/contract'

const HISTORY_KEY = 'appautopsy.history'
const REPORTS_STORE_KEY = 'appautopsy.reports.cache'
const MAX_ENTRIES = 50

export interface HistoryStats {
  total: number
  red: number
  yellow: number
  green: number
  sources: {
    link: number
    sms: number
    email: number
    manual: number
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed: HistoryEntry[] = JSON.parse(raw)
        // Normalize older entries without source
        const normalized = parsed.map((item) => ({
          ...item,
          source: item.source || (item.type === 'link' ? 'link' : item.type === 'message' ? 'sms' : 'manual'),
        }))
        setHistory(normalized)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const addReport = useCallback(
    (report: AnyReport, explicitSource?: ScanSource) => {
      let title = 'Unknown'
      let subtitle = ''
      let source: ScanSource = explicitSource || 'manual'

      if (report.type === 'apk') {
        title = report.app.label || report.app.package || 'APK File'
        subtitle = report.app.package
        source = explicitSource || 'manual'
      } else if (report.type === 'link') {
        try {
          title = new URL(report.url).hostname
        } catch {
          title = report.url
        }
        subtitle = report.direct_apk ? 'APK download link' : 'Web link'
        source = explicitSource || 'link'
      } else if (report.type === 'message') {
        title = 'Suspicious message'
        subtitle = `${report.signals.length} warning signs`
        source = explicitSource || 'sms'
      }

      const entry: HistoryEntry = {
        id: report.report_id,
        type: report.type,
        source,
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

  const stats: HistoryStats = useMemo(() => {
    const total = history.length
    const red = history.filter((h) => h.verdict === 'red' || h.band === 'high').length
    const yellow = history.filter((h) => h.verdict === 'yellow' || h.band === 'medium').length
    const green = history.filter((h) => h.verdict === 'green' || h.band === 'low').length
    const sources = {
      link: history.filter((h) => h.source === 'link').length,
      sms: history.filter((h) => h.source === 'sms').length,
      email: history.filter((h) => h.source === 'email').length,
      manual: history.filter((h) => h.source === 'manual').length,
    }
    return { total, red, yellow, green, sources }
  }, [history])

  return { history, stats, addReport, getCachedReport, clearHistory, refresh: loadHistory }
}
