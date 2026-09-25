import { useState } from 'react'
import { Fingerprint, CheckCircle2, ChevronDown, ShieldAlert } from 'lucide-react'
import type { RepackagingInfo } from '../types/contract'
import { useI18n } from '../i18n'

interface RepackagingCardProps {
  repackaging?: RepackagingInfo | null
  sha256?: string
  packageName?: string
}

export function RepackagingCard({
  repackaging,
  sha256 = '',
  packageName = '',
}: RepackagingCardProps) {
  const { t } = useI18n()
  const [showTechnical, setShowTechnical] = useState(false)

  if (!repackaging) return null

  const isDetected = Boolean(repackaging.detected)

  if (!isDetected) {
    return (
      <div className="card p-4 flex items-center justify-between gap-3 border-line bg-surface">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-risk-low-bg text-risk-low-text flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} strokeWidth={2.2} />
          </span>
          <div>
            <h4 className="text-[14px] font-semibold text-ink">
              {t('repackaging.notDetected')}
            </h4>
            <p className="text-[12.5px] text-ink-muted">
              {t('repackaging.notDetectedNote')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      className="card p-5 sm:p-6 border-risk-high-border bg-risk-high-bg/30 shadow-sm"
      aria-labelledby="repackaging-heading"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-risk-high-bg text-risk-high-text flex items-center justify-center shrink-0 border border-risk-high-border">
          <Fingerprint size={22} strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-risk-high text-white">
              <ShieldAlert size={12} />
              Critical Red Flag
            </span>
          </div>

          <h3
            id="repackaging-heading"
            className="text-[17px] sm:text-[18px] font-bold text-risk-high-text mt-1.5 tracking-tight"
          >
            {t('repackaging.detected')}
          </h3>

          <p className="text-[14px] text-ink-soft leading-relaxed mt-1">
            {t('repackaging.detectedBody')}
          </p>

          <div className="mt-3.5 pt-3 border-t border-risk-high-border/50">
            <h4 className="text-[13px] font-semibold text-ink uppercase tracking-wide">
              {t('repackaging.whyMatters')}
            </h4>
            <p className="text-[13.5px] text-ink-soft leading-relaxed mt-1">
              {t('repackaging.whyMattersBody')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink hover:text-brand transition-colors"
          >
            <span>{showTechnical ? t('common.collapse') : t('common.technicalDetails')}</span>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${showTechnical ? 'rotate-180' : ''}`}
            />
          </button>

          {showTechnical && (
            <div className="mt-3 p-3.5 rounded-xl border border-line bg-surface text-[12.5px] space-y-2.5 font-mono">
              {packageName && (
                <div>
                  <span className="text-ink-faint font-sans font-medium block text-[11.5px]">
                    Package Name
                  </span>
                  <span className="text-ink break-all">{packageName}</span>
                </div>
              )}
              {sha256 && (
                <div>
                  <span className="text-ink-faint font-sans font-medium block text-[11.5px]">
                    File SHA-256
                  </span>
                  <span className="text-ink break-all">{sha256}</span>
                </div>
              )}
              {repackaging.expected_cert_sha256 && (
                <div>
                  <span className="text-risk-low-text font-sans font-medium block text-[11.5px]">
                    Expected Official Certificate Fingerprint
                  </span>
                  <span className="text-ink-soft break-all">{repackaging.expected_cert_sha256}</span>
                </div>
              )}
              {repackaging.actual_cert_sha256 && (
                <div>
                  <span className="text-risk-high-text font-sans font-medium block text-[11.5px]">
                    Actual Signing Certificate Fingerprint
                  </span>
                  <span className="text-ink-soft break-all">{repackaging.actual_cert_sha256}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
export default RepackagingCard
