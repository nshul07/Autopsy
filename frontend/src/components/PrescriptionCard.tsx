import { Check, ShieldCheck } from 'lucide-react'
import type { Prescription } from '../types/contract'
import { useI18n } from '../i18n'
import { groupLabelKey } from '../lib/format'

interface PrescriptionCardProps {
  prescription?: Prescription | null
  categoryName?: string
}

export function PrescriptionCard({ prescription, categoryName }: PrescriptionCardProps) {
  const { t } = useI18n()

  if (!prescription) return null

  const minimalGroups = prescription.minimal_groups || []

  return (
    <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="prescription-heading">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-risk-low-bg text-risk-low-text flex items-center justify-center shrink-0">
          <ShieldCheck size={18} strokeWidth={2.2} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 id="prescription-heading" className="text-[16px] font-bold text-ink tracking-tight">
            Minimum Permission Baseline
          </h3>
          <p className="text-[13px] text-ink-muted mt-0.5">
            What a genuine {categoryName ? `"${categoryName}"` : 'app of this type'} typically needs:
          </p>

          <div className="mt-3">
            {minimalGroups.length === 0 ? (
              <p className="text-[13.5px] font-medium text-risk-low-text">
                ✓ No sensitive permissions needed for this app category.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {minimalGroups.map((group) => {
                  const labelKey = groupLabelKey(group)
                  const label = t(labelKey) !== labelKey ? t(labelKey) : group
                  return (
                    <span
                      key={group}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[12.5px] font-semibold bg-risk-low-bg text-risk-low-text border border-risk-low-border"
                    >
                      <Check size={13} strokeWidth={3} />
                      {label}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
export default PrescriptionCard
