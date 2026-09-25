import { FileWarning } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function ErrorState({ title, body, onRetry, onDemo }) {
  const { t } = useLanguage()

  return (
    <div className="rounded-lg border border-line bg-white p-8 text-center max-w-md mx-auto">
      <div className="mx-auto w-10 h-10 rounded-full bg-warning-bg flex items-center justify-center">
        <FileWarning size={18} className="text-warning-strong" />
      </div>
      <h3 className="mt-3 text-[15px] font-semibold text-ink">{title || t.errors.unreadable}</h3>
      <p className="mt-1.5 text-[13.5px] text-ink-muted leading-relaxed">{body || t.errors.unreadableBody}</p>
      <div className="mt-4 flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md border border-line bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-ink hover:border-navy-400 hover:text-navy-500 transition-colors duration-150"
          >
            {t.errors.tryAnother}
          </button>
        )}
        {onDemo && (
          <button
            onClick={onDemo}
            className="text-[13.5px] font-medium text-navy-500 hover:text-navy-600 underline underline-offset-2"
          >
            {t.scanner.tryDemo}
          </button>
        )}
      </div>
    </div>
  )
}
