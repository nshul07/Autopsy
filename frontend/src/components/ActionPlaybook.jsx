import { Phone } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function ActionPlaybook({ steps }) {
  const { t } = useLanguage()
  if (!steps?.length) return null

  return (
    <section className="py-8 border-t border-line">
      <h2 className="text-[16px] font-semibold text-ink">{t.result.whatShouldYouDo}</h2>

      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-danger-bg text-danger-strong text-[12.5px] font-semibold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-[14px] text-ink-soft leading-relaxed pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex items-center gap-2 text-[13px] text-ink-muted">
        <Phone size={14} />
        <span>National Cyber Crime Helpline: 1930 · cybercrime.gov.in</span>
      </div>
    </section>
  )
}
