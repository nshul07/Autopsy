import { useEffect, useState } from 'react'
import { Check, Loader2, Shield } from 'lucide-react'
import { useI18n } from '../i18n'

interface LoadingStateProps {
  title?: string
  subtitle?: string
  subjectName?: string
  stages?: string[]
  durationMs?: number
  onDone?: () => void
}

export function LoadingState({
  title,
  subtitle,
  subjectName,
  stages: customStages,
  durationMs = 2400,
  onDone,
}: LoadingStateProps) {
  const { t } = useI18n()

  const defaultStages = [
    t('progress.stages.0') || 'File received',
    t('progress.stages.1') || 'Reading app information',
    t('progress.stages.2') || 'Checking permissions',
    t('progress.stages.3') || 'Comparing purpose and access',
    t('progress.stages.4') || 'Preparing report',
  ]

  const stages = customStages || defaultStages
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const stepDuration = durationMs / stages.length
    const timers = stages.map((_, i) =>
      setTimeout(() => setActiveIndex(i + 1), stepDuration * (i + 1))
    )

    const completionTimer = setTimeout(() => {
      onDone?.()
    }, durationMs + 100)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(completionTimer)
    }
  }, [durationMs, stages.length, onDone])

  return (
    <div className="card p-6 sm:p-8 max-w-md mx-auto my-6 text-center select-none shadow-raised border-line animate-fade-up">
      <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto mb-4">
        <Shield size={28} className="animate-pulse" />
      </div>

      <h3 className="text-[19px] font-bold text-ink tracking-tight">
        {title || t('progress.title')}
      </h3>

      {subjectName && (
        <p className="text-[14.5px] font-medium text-brand mt-1 truncate max-w-xs mx-auto">
          {subjectName}
        </p>
      )}

      <p className="text-[13.5px] text-ink-muted mt-1">
        {subtitle || t('progress.sub')}
      </p>

      {/* Progressive Stage Checklist */}
      <div className="mt-6 pt-5 border-t border-line text-left space-y-3">
        {stages.map((stage, idx) => {
          const isDone = idx < activeIndex
          const isActive = idx === activeIndex
          const isPending = idx > activeIndex

          return (
            <div
              key={`${stage}-${idx}`}
              className={`flex items-center gap-3 text-[14px] transition-colors duration-200 ${
                isDone
                  ? 'text-ink font-medium'
                  : isActive
                  ? 'text-brand font-semibold'
                  : 'text-ink-faint'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isDone ? (
                  <span className="w-5 h-5 rounded-full bg-risk-low-bg text-risk-low-text flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : isActive ? (
                  <Loader2 size={16} className="text-brand animate-spin" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-line-strong" />
                )}
              </div>

              <span className="truncate">{stage}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-[12px] text-ink-muted">
        {t('progress.generic')}
      </div>
    </div>
  )
}
export default LoadingState
