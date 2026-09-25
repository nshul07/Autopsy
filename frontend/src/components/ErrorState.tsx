import { AlertCircle, RefreshCw, FileText } from 'lucide-react'
import { useI18n } from '../i18n'
import type { ApiErrorKind } from '../services/api'
import { PrimaryButton, SecondaryButton } from './Buttons'

interface ErrorStateProps {
  kind?: ApiErrorKind
  message?: string
  onRetry?: () => void
  onTryDemo?: () => void
  className?: string
}

export function ErrorState({
  kind = 'unknown',
  message,
  onRetry,
  onTryDemo,
  className = '',
}: ErrorStateProps) {
  const { t } = useI18n()

  const kindKey = `errors.kind.${kind}`
  const localizedMessage = message || (t(kindKey) !== kindKey ? t(kindKey) : t('errors.body'))

  return (
    <div
      className={`card p-6 sm:p-8 max-w-md mx-auto my-6 text-center border-risk-high-border/60 bg-risk-high-bg/20 shadow-sm ${className}`}
      role="alert"
    >
      <div className="w-14 h-14 rounded-2xl bg-risk-high-bg text-risk-high-text flex items-center justify-center mx-auto mb-4 border border-risk-high-border">
        <AlertCircle size={28} strokeWidth={2} />
      </div>

      <h3 className="text-[18px] font-bold text-ink tracking-tight">
        {t('errors.title')}
      </h3>

      <p className="text-[14px] text-ink-soft leading-relaxed mt-2 max-w-xs mx-auto">
        {localizedMessage}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <PrimaryButton
            onClick={onRetry}
            icon={<RefreshCw size={16} />}
            size="md"
          >
            {t('common.tryAgain')}
          </PrimaryButton>
        )}

        {onTryDemo && (
          <SecondaryButton
            onClick={onTryDemo}
            icon={<FileText size={16} />}
            size="md"
          >
            {t('common.demoData')}
          </SecondaryButton>
        )}
      </div>
    </div>
  )
}
export default ErrorState
