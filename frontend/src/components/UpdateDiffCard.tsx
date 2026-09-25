import { GitCommit, AlertTriangle, CheckCircle2, Plus, Minus } from 'lucide-react'
import type { UpdateDiff } from '../types/contract'
import { useI18n } from '../i18n'
import { groupLabelKey } from '../lib/format'

interface UpdateDiffCardProps {
  updateDiff?: UpdateDiff | null
}

export function UpdateDiffCard({ updateDiff }: UpdateDiffCardProps) {
  const { t } = useI18n()

  if (!updateDiff) return null

  if (!updateDiff.has_history) {
    return (
      <div className="card p-4 border-line bg-surface">
        <div className="flex items-center gap-2.5">
          <GitCommit size={18} className="text-ink-muted shrink-0" />
          <div>
            <h4 className="text-[14px] font-semibold text-ink">
              {t('result.sections.updateDiff')}
            </h4>
            <p className="text-[12.5px] text-ink-muted">
              {t('updateDiff.noHistory')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const hasAdded = updateDiff.groups_added.length > 0
  const hasRemoved = updateDiff.groups_removed.length > 0
  const isSuspicious = hasAdded || updateDiff.cert_changed

  return (
    <section
      className={`card p-5 sm:p-6 ${
        isSuspicious ? 'border-risk-medium-border bg-risk-medium-bg/20' : 'border-line bg-surface'
      }`}
      aria-labelledby="update-diff-heading"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSuspicious
              ? 'bg-risk-medium-bg text-risk-medium-text'
              : 'bg-risk-low-bg text-risk-low-text'
          }`}
        >
          {isSuspicious ? (
            <AlertTriangle size={18} strokeWidth={2.2} />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2.2} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 id="update-diff-heading" className="text-[16px] font-bold text-ink tracking-tight">
            {t('result.sections.updateDiff')}
          </h3>

          {hasAdded ? (
            <p className="text-[13.5px] font-semibold text-risk-medium-text mt-1">
              {t('updateDiff.headline', { count: updateDiff.groups_added.length })}
            </p>
          ) : (
            <p className="text-[13px] text-ink-muted mt-1">{t('updateDiff.noChanges')}</p>
          )}

          {updateDiff.cert_changed && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-risk-high-bg border border-risk-high-border text-[12.5px] font-medium text-risk-high-text flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{t('updateDiff.certChanged')}</span>
            </div>
          )}

          {hasAdded && (
            <div className="mt-3">
              <span className="text-[12px] font-bold text-ink-muted uppercase tracking-wider block mb-1.5">
                {t('updateDiff.groupsAdded')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {updateDiff.groups_added.map((group) => {
                  const labelKey = groupLabelKey(group)
                  const label = t(labelKey) !== labelKey ? t(labelKey) : group
                  return (
                    <span
                      key={group}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-semibold bg-risk-high-bg text-risk-high-text border border-risk-high-border"
                    >
                      <Plus size={12} strokeWidth={3} />
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {hasRemoved && (
            <div className="mt-3">
              <span className="text-[12px] font-bold text-ink-muted uppercase tracking-wider block mb-1.5">
                {t('updateDiff.groupsRemoved')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {updateDiff.groups_removed.map((group) => {
                  const labelKey = groupLabelKey(group)
                  const label = t(labelKey) !== labelKey ? t(labelKey) : group
                  return (
                    <span
                      key={group}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-semibold bg-sunken text-ink-soft border border-line line-through"
                    >
                      <Minus size={12} strokeWidth={3} />
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
export default UpdateDiffCard
