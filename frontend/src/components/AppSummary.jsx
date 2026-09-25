import { AppWindow } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function AppSummary({ report }) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-5">
      <div className="w-12 h-12 rounded-lg bg-navy-50 border border-line flex items-center justify-center shrink-0">
        <AppWindow size={20} className="text-navy-500" />
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-[19px] font-semibold text-ink truncate">{report.appName}</h1>
        <p className="text-[13px] text-ink-muted font-mono truncate">{report.packageName}</p>
      </div>

      <dl className="grid grid-cols-3 sm:flex sm:items-center gap-x-6 gap-y-2 text-[13px] shrink-0">
        <div>
          <dt className="text-ink-faint">{t.result.version}</dt>
          <dd className="text-ink-soft font-medium">{report.version}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">{t.result.category}</dt>
          <dd className="text-ink-soft font-medium">{report.category}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">{t.result.confidence}</dt>
          <dd className="text-ink-soft font-medium">{report.categoryConfidence}</dd>
        </div>
      </dl>
    </div>
  )
}
