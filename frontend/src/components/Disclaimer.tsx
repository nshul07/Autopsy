import { Info } from 'lucide-react'
import { useI18n } from '../i18n'

interface DisclaimerProps {
  className?: string
  prominent?: boolean
}

export function Disclaimer({ className = '', prominent = false }: DisclaimerProps) {
  const { t } = useI18n()

  if (prominent) {
    return (
      <div
        className={`flex items-center gap-2.5 rounded-xl border border-line bg-sunken/60 px-4 py-3 text-[13px] text-ink-muted leading-relaxed ${className}`}
        role="note"
      >
        <Info size={16} className="text-ink-faint shrink-0" />
        <span>{t('disclaimer')}</span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-start gap-2 text-[12.5px] text-ink-muted leading-snug ${className}`}
      role="note"
    >
      <Info size={14} className="text-ink-faint shrink-0 mt-0.5" />
      <span>{t('disclaimer')}</span>
    </div>
  )
}
export default Disclaimer
