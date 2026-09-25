import { AlertOctagon, PhoneCall, Globe, Trash2, Ban } from 'lucide-react'
import type { PlaybookStep } from '../types/contract'
import { useI18n } from '../i18n'

interface PlaybookCardProps {
  steps?: PlaybookStep[]
  appName?: string
}

export function PlaybookCard({ steps = [], appName = 'this app' }: PlaybookCardProps) {
  const { t } = useI18n()

  if (steps.length === 0) return null

  const getStepIcon = (key: string) => {
    if (key.includes('do_not_install')) return Ban
    if (key.includes('remove')) return Trash2
    if (key.includes('bank')) return PhoneCall
    if (key.includes('cybercrime')) return Globe
    return AlertOctagon
  }

  return (
    <section
      className="card p-5 sm:p-6 border-risk-high-border/90 bg-risk-high-bg/25 shadow-sm"
      aria-labelledby="playbook-heading"
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-risk-high-border/40">
        <span className="w-8 h-8 rounded-lg bg-risk-high text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertOctagon size={18} strokeWidth={2.2} />
        </span>
        <div>
          <h3 id="playbook-heading" className="text-[17px] font-bold text-ink tracking-tight">
            {t('playbook.title')}
          </h3>
          <p className="text-[12.5px] text-ink-muted">Immediate recommended steps</p>
        </div>
      </div>

      <ol className="mt-4 space-y-3">
        {steps.map((step, idx) => {
          const stepKey = `playbook.steps.${step.step_key}`
          const rawText = t(stepKey, { app: appName, ...step.params })
          const text = rawText !== stepKey ? rawText : step.step_key.replace(/^playbook\./, '').replace(/_/g, ' ')
          const Icon = getStepIcon(step.step_key)

          return (
            <li
              key={`${step.step_key}-${idx}`}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-surface shadow-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-soft text-brand font-bold text-[13px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-medium text-ink leading-relaxed">{text}</p>
                  <Icon size={16} className="text-ink-muted shrink-0 mt-0.5" />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
export default PlaybookCard
