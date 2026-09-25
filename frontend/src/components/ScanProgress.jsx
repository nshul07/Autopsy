import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function ScanProgress({ onDone, durationMs = 2200 }) {
  const { t } = useLanguage()
  const stages = t.progress.stages
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const stepMs = durationMs / stages.length
    const timers = stages.map((_, i) =>
      setTimeout(() => setActiveIndex(i + 1), stepMs * (i + 1))
    )
    const done = setTimeout(() => onDone?.(), durationMs + 150)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(done)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-lg border border-line bg-white p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <Loader2 size={16} className="text-navy-500 animate-spin" />
        <h3 className="text-[15px] font-semibold text-ink">{t.progress.analyzing}</h3>
      </div>

      <ul className="mt-4 space-y-2.5">
        {stages.map((stage, i) => {
          const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'
          return (
            <li key={stage} className="flex items-center gap-2.5 text-[13.5px]">
              {state === 'done' && (
                <span className="w-4 h-4 rounded-full bg-success-bg flex items-center justify-center shrink-0">
                  <Check size={11} className="text-success-strong" strokeWidth={3} />
                </span>
              )}
              {state === 'active' && (
                <span className="w-4 h-4 rounded-full border-2 border-navy-400 border-t-transparent animate-spin shrink-0" />
              )}
              {state === 'pending' && (
                <span className="w-4 h-4 rounded-full border border-line shrink-0" />
              )}
              <span className={state === 'pending' ? 'text-ink-faint' : 'text-ink-soft'}>{stage}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
