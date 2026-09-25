import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import RiskGauge from './RiskGauge'
import { useLanguage } from '../i18n/LanguageContext'

const BAND_STYLES = {
  high: {
    badgeBg: 'bg-danger-bg',
    badgeText: 'text-danger-text',
    badgeBorder: 'border-danger-border',
    Icon: AlertTriangle,
  },
  medium: {
    badgeBg: 'bg-warning-bg',
    badgeText: 'text-warning-text',
    badgeBorder: 'border-warning-border',
    Icon: AlertCircle,
  },
  low: {
    badgeBg: 'bg-success-bg',
    badgeText: 'text-success-text',
    badgeBorder: 'border-success-border',
    Icon: CheckCircle2,
  },
}

export default function VerdictBanner({ score, band, summary }) {
  const { t } = useLanguage()
  const style = BAND_STYLES[band] || BAND_STYLES.medium
  const { Icon } = style

  const bandLabel = t.result.band[band]
  const actionLabel =
    band === 'high' ? t.result.doNotInstall : band === 'medium' ? t.result.reviewCarefully : t.result.noMajorConcerns

  return (
    <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
        <RiskGauge score={score} band={band} />

        <div className="flex-1">
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] font-semibold tracking-wide',
              style.badgeBg,
              style.badgeText,
              style.badgeBorder,
            ].join(' ')}
          >
            <Icon size={13} />
            {bandLabel}
          </span>

          <p className={`mt-3 text-[15px] font-medium ${style.badgeText}`}>{actionLabel}</p>
          <p className="mt-1.5 text-[14px] text-ink-soft leading-relaxed max-w-md">{summary}</p>
        </div>
      </div>
    </div>
  )
}
