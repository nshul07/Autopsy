import { Scale, HelpCircle } from 'lucide-react'
import { useI18n } from '../i18n'

interface CalibrationCardProps {
  reasons?: string[]
}

export function CalibrationCard({ reasons = [] }: CalibrationCardProps) {
  const { t } = useI18n()

  if (reasons.length === 0) return null

  return (
    <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="calibration-heading">
      <div className="flex items-center gap-2.5 pb-3 border-b border-line">
        <span className="w-8 h-8 rounded-lg bg-sunken text-ink-muted flex items-center justify-center shrink-0">
          <Scale size={17} strokeWidth={2.2} />
        </span>
        <div>
          <h3 id="calibration-heading" className="text-[16px] font-bold text-ink tracking-tight">
            {t('calibration.title')}
          </h3>
          <p className="text-[12.5px] text-ink-muted">{t('calibration.sub')}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {reasons.map((reason, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-[13.5px] text-ink-soft leading-relaxed">
            <HelpCircle size={15} className="text-ink-faint shrink-0 mt-0.5" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
export default CalibrationCard
