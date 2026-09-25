import { AlertTriangle, ShieldAlert } from 'lucide-react'
import type { PatternMatch } from '../types/contract'
import { useI18n } from '../i18n'

interface PatternCardProps {
  patterns: PatternMatch[]
}

export function PatternCard({ patterns = [] }: PatternCardProps) {
  const { t } = useI18n()

  if (patterns.length === 0) return null

  return (
    <section className="card p-5 sm:p-6 border-risk-high-border/80 bg-risk-high-bg/20" aria-labelledby="patterns-heading">
      <div className="flex items-center gap-2.5 pb-3 border-b border-risk-high-border/40">
        <span className="w-8 h-8 rounded-lg bg-risk-high-bg text-risk-high-text flex items-center justify-center shrink-0">
          <ShieldAlert size={18} strokeWidth={2.2} />
        </span>
        <div>
          <h3 id="patterns-heading" className="text-[17px] font-bold text-ink tracking-tight">
            {t('patterns.title')}
          </h3>
          <p className="text-[13px] text-ink-muted">{t('patterns.sub')}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {patterns.map((pattern) => {
          const labelKey = `patterns.${pattern.id}.label`
          const bodyKey = `patterns.${pattern.id}.body`
          const title = t(labelKey) !== labelKey ? t(labelKey) : pattern.id.replace(/_/g, ' ')
          const description = t(bodyKey) !== bodyKey ? t(bodyKey) : ''

          return (
            <div
              key={pattern.id}
              className="p-4 rounded-xl border border-risk-high-border bg-surface shadow-xs"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-risk-high-text shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[15px] font-bold text-risk-high-text capitalize">
                      {title}
                    </h4>
                    {pattern.critical && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-risk-high text-white tracking-wider uppercase">
                        Critical Risk
                      </span>
                    )}
                  </div>
                  {description && (
                    <p className="text-[13.5px] text-ink-soft leading-relaxed mt-1.5">
                      {description}
                    </p>
                  )}
                  <p className="text-[12px] text-ink-muted italic mt-2">
                    Note: If this app is malicious, these permissions combined could allow this action.
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
export default PatternCard
