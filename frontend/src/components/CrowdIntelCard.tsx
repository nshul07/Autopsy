import { Users, ShieldAlert, Info } from 'lucide-react'
import type { CrowdIntel } from '../types/contract'
import { useI18n } from '../i18n'

interface CrowdIntelCardProps {
  crowdIntel?: CrowdIntel | null
}

export function CrowdIntelCard({ crowdIntel }: CrowdIntelCardProps) {
  const { t } = useI18n()

  if (!crowdIntel) return null

  const isOk = crowdIntel.status === 'ok' && (crowdIntel.people_who_scanned_this ?? 0) >= 5

  return (
    <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="crowd-heading">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <Users size={18} strokeWidth={2.2} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 id="crowd-heading" className="text-[16px] font-bold text-ink tracking-tight">
            {t('result.sections.crowd')}
          </h3>

          {isOk ? (
            <div className="mt-2.5 space-y-2">
              <p className="text-[14px] font-medium text-ink">
                {t('crowd.peopleScanned', { count: crowdIntel.people_who_scanned_this! })}
              </p>

              {(crowdIntel.percent_told_never_install ?? 0) > 0 && (
                <div className="p-3 rounded-xl bg-risk-high-bg border border-risk-high-border flex items-center gap-2.5">
                  <ShieldAlert size={18} className="text-risk-high-text shrink-0" />
                  <span className="text-[13.5px] font-bold text-risk-high-text">
                    {t('crowd.percentTold', { percent: crowdIntel.percent_told_never_install! })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13.5px] text-ink-muted mt-1">{t('crowd.insufficient')}</p>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-muted">
            <Info size={13} className="shrink-0" />
            <span>{t('crowd.note')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
export default CrowdIntelCard
