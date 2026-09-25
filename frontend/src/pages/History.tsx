import { useState, useMemo } from 'react'
import { History as HistoryIcon, Trash2, ChevronRight, FileUp, Link2, MessageSquareWarning } from 'lucide-react'
import { useI18n } from '../i18n'
import { useHistory } from '../hooks/useHistory'
import RiskBadge from '../components/RiskBadge'
import EmptyState from '../components/EmptyState'
import { dayBucket } from '../lib/format'
import type { HistoryEntry } from '../types/contract'

interface HistoryProps {
  onOpenReport: (entry: HistoryEntry) => void
  onNavigateToScan: () => void
}

export function History({ onOpenReport, onNavigateToScan }: HistoryProps) {
  const { t } = useI18n()
  const { history, clearHistory } = useHistory()
  const [filterType, setFilterType] = useState<'all' | 'apk' | 'link' | 'message'>('all')

  const filteredHistory = useMemo(() => {
    if (filterType === 'all') return history
    return history.filter((item) => item.type === filterType)
  }, [history, filterType])

  const grouped = useMemo(() => {
    const buckets: { today: HistoryEntry[]; yesterday: HistoryEntry[]; earlier: HistoryEntry[] } = {
      today: [],
      yesterday: [],
      earlier: [],
    }

    filteredHistory.forEach((item) => {
      const b = dayBucket(item.createdAt)
      buckets[b].push(item)
    })

    return buckets
  }, [filteredHistory])

  const getTypeIcon = (type: string) => {
    if (type === 'apk') return FileUp
    if (type === 'link') return Link2
    return MessageSquareWarning
  }

  const handleClear = () => {
    if (window.confirm(t('history.clearConfirm') || 'Clear all saved reports?')) {
      clearHistory()
    }
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
            {t('nav.history')}
          </span>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
            {t('history.title')}
          </h1>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-ink-muted hover:text-risk-high-text rounded-xl hover:bg-sunken flex items-center gap-1.5 text-[13px] font-medium transition-colors"
            title={t('history.clear')}
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">{t('history.clear')}</span>
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'apk', 'link', 'message'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${
                filterType === tab
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface text-ink-muted border border-line hover:text-ink'
              }`}
            >
              {tab === 'all'
                ? `All (${history.length})`
                : tab === 'apk'
                ? `${t('history.types.apk')} (${history.filter((h) => h.type === 'apk').length})`
                : tab === 'link'
                ? `${t('history.types.link')} (${history.filter((h) => h.type === 'link').length})`
                : `${t('history.types.message')} (${history.filter((h) => h.type === 'message').length})`}
            </button>
          ))}
        </div>
      )}

      {history.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon size={28} strokeWidth={2} />}
          title={t('history.empty')}
          description={t('history.emptyBody')}
          actionLabel={t('history.emptyAction')}
          onAction={onNavigateToScan}
        />
      ) : (
        <div className="space-y-6">
          {(['today', 'yesterday', 'earlier'] as const).map((bucketKey) => {
            const items = grouped[bucketKey]
            if (items.length === 0) return null

            const bucketLabel =
              bucketKey === 'today'
                ? t('history.today')
                : bucketKey === 'yesterday'
                ? t('history.yesterday')
                : t('history.earlier')

            return (
              <section key={bucketKey} className="space-y-2.5">
                <h3 className="text-[13px] font-bold text-ink-muted uppercase tracking-wider px-1">
                  {bucketLabel}
                </h3>

                <div className="space-y-2">
                  {items.map((item) => {
                    const Icon = getTypeIcon(item.type)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpenReport(item)}
                        className="w-full card p-3.5 sm:p-4 border-line hover:border-line-strong hover:bg-sunken/40 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                            <Icon size={18} strokeWidth={2.2} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-[14.5px] font-bold text-ink truncate">
                                {item.title}
                              </h4>
                              <RiskBadge band={item.band} size="sm" />
                            </div>
                            <p className="text-[12.5px] text-ink-muted truncate mt-0.5">
                              Score: <span className="font-semibold text-ink">{item.score}/100</span>
                              {item.subtitle ? ` • ${item.subtitle}` : ''}
                            </p>
                          </div>
                        </div>

                        <ChevronRight size={18} className="text-ink-muted shrink-0" />
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}

          <p className="text-[12px] text-ink-muted text-center pt-2">
            {t('history.note')}
          </p>
        </div>
      )}
    </div>
  )
}
export default History
