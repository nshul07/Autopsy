import { Info } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function Disclaimer({ className = '' }) {
  const { t } = useLanguage()
  return (
    <div className={`flex items-start gap-2 text-[13px] text-ink-muted ${className}`}>
      <Info size={15} className="shrink-0 mt-0.5" />
      <span>{t.disclaimer}</span>
    </div>
  )
}
