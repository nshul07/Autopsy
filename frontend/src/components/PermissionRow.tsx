import { useState } from 'react'
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronDown } from 'lucide-react'
import type { PermissionEntry } from '../types/contract'
import { useI18n } from '../i18n'
import { groupLabelKey, labelKeyForPermission } from '../lib/format'

interface PermissionRowProps {
  permission: PermissionEntry
}

export function PermissionRow({ permission }: PermissionRowProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  const groupKey = permission.group
    ? groupLabelKey(permission.group)
    : labelKeyForPermission(permission.name)

  const friendlyName = t(groupKey) !== groupKey ? t(groupKey) : (
    permission.name.replace(/^android\.permission\./, '').replace(/_/g, ' ')
  )

  const isExpected = permission.status === 'expected'
  const isUnexpected = permission.status === 'unexpected'

  return (
    <div className="py-3 px-3.5 rounded-xl border border-line bg-surface hover:border-line-strong transition-colors duration-150">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {isExpected && (
            <span className="w-6 h-6 rounded-md bg-risk-low-bg text-risk-low-text flex items-center justify-center shrink-0">
              <CheckCircle2 size={15} strokeWidth={2.2} />
            </span>
          )}
          {isUnexpected && (
            <span className="w-6 h-6 rounded-md bg-risk-high-bg text-risk-high-text flex items-center justify-center shrink-0">
              <AlertTriangle size={15} strokeWidth={2.2} />
            </span>
          )}
          {!isExpected && !isUnexpected && (
            <span className="w-6 h-6 rounded-md bg-sunken text-ink-muted flex items-center justify-center shrink-0">
              <HelpCircle size={15} />
            </span>
          )}

          <div className="min-w-0">
            <h4 className="text-[14.5px] font-semibold text-ink capitalize truncate">
              {friendlyName}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-md border ${
              isExpected
                ? 'bg-risk-low-bg text-risk-low-text border-risk-low-border'
                : isUnexpected
                ? 'bg-risk-high-bg text-risk-high-text border-risk-high-border'
                : 'bg-sunken text-ink-muted border-line'
            }`}
          >
            {isExpected
              ? t('result.status.expected')
              : isUnexpected
              ? t('result.status.unexpected')
              : t('result.status.not_checked')}
          </span>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="p-1 text-ink-muted hover:text-ink rounded"
            title={expanded ? t('common.collapse') : t('common.expand')}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-2.5 border-t border-line text-[12.5px] text-ink-muted">
          <div className="flex flex-col gap-1">
            <span className="text-ink-faint font-medium">{t('common.technicalDetails')}</span>
            <code className="bg-sunken px-2 py-1 rounded text-ink font-mono text-[11.5px] break-all border border-line">
              {permission.name}
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
export default PermissionRow
