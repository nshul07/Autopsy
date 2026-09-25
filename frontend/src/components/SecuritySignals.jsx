import { Check, TriangleAlert } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function SecuritySignals({ signals }) {
  const { t } = useLanguage()

  return (
    <section className="py-8 border-t border-line">
      <h2 className="text-[16px] font-semibold text-ink">{t.result.securitySignals}</h2>

      <ul className="mt-4 space-y-2.5">
        {signals.map((signal) => (
          <li key={signal.label} className="flex items-center gap-2.5 text-[13.5px]">
            {signal.ok ? (
              <Check size={15} className="text-success-strong shrink-0" />
            ) : (
              <TriangleAlert size={15} className="text-warning-strong shrink-0" />
            )}
            <span className={signal.ok ? 'text-ink-soft' : 'text-ink font-medium'}>{signal.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
