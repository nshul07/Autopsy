import { useLanguage } from '../i18n/LanguageContext'

export default function CalibrationCard({ reasons }) {
  const { t } = useLanguage()

  return (
    <section className="py-8 border-t border-line">
      <h2 className="text-[16px] font-semibold text-ink">{t.result.beforeYouDecide}</h2>
      <p className="mt-2 text-[13.5px] text-ink-soft leading-relaxed max-w-2xl">{t.disclaimer}</p>

      {reasons?.length > 0 && (
        <div className="mt-4 rounded-lg border border-line bg-white p-5">
          <h3 className="text-[13.5px] font-semibold text-ink">{t.result.reasonsWrong}</h3>
          <ul className="mt-2.5 space-y-1.5">
            {reasons.map((reason) => (
              <li key={reason} className="text-[13.5px] text-ink-muted leading-relaxed pl-3.5 relative before:content-['–'] before:absolute before:left-0 before:text-ink-faint">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
