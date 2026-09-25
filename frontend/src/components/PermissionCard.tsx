import { useState, useMemo } from 'react'
import { ShieldAlert } from 'lucide-react'
import type { PermissionEntry } from '../types/contract'
import { useI18n } from '../i18n'
import PermissionRow from './PermissionRow'

interface PermissionCardProps {
  permissions: PermissionEntry[]
}

export function PermissionCard({ permissions = [] }: PermissionCardProps) {
  const { t } = useI18n()
  const [filter, setFilter] = useState<'all' | 'unexpected' | 'expected'>('all')

  const unexpectedCount = useMemo(
    () => permissions.filter((p) => p.status === 'unexpected').length,
    [permissions]
  )
  const expectedCount = useMemo(
    () => permissions.filter((p) => p.status === 'expected').length,
    [permissions]
  )

  const filteredPermissions = useMemo(() => {
    if (filter === 'unexpected') return permissions.filter((p) => p.status === 'unexpected')
    if (filter === 'expected') return permissions.filter((p) => p.status === 'expected')
    return permissions
  }, [permissions, filter])

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="permissions-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
        <div>
          <h3 id="permissions-heading" className="text-[17px] font-bold text-ink tracking-tight">
            {t('result.sections.permissions')}
          </h3>
          <p className="text-[13px] text-ink-muted mt-0.5">
            {t('result.permissionCount', { count: permissions.length })} •{' '}
            <span className="text-risk-high-text font-semibold">
              {t('result.unexpectedCount', { count: unexpectedCount })}
            </span>
          </p>
        </div>

        {/* Filter chips */}
        <div className="inline-flex rounded-lg border border-line bg-sunken p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-md transition-all ${
              filter === 'all'
                ? 'bg-surface text-ink shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            All ({permissions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unexpected')}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-md transition-all ${
              filter === 'unexpected'
                ? 'bg-surface text-risk-high-text shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Unexpected ({unexpectedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('expected')}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-md transition-all ${
              filter === 'expected'
                ? 'bg-surface text-risk-low-text shadow-xs font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Expected ({expectedCount})
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {filteredPermissions.length === 0 ? (
          <div className="py-6 text-center text-[13.5px] text-ink-muted">
            No permissions matching filter
          </div>
        ) : (
          filteredPermissions.map((perm, idx) => (
            <PermissionRow key={`${perm.name}-${idx}`} permission={perm} />
          ))
        )}
      </div>

      {unexpectedCount > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-risk-high-bg/50 border border-risk-high-border/60 flex items-start gap-2.5 text-[12.5px] text-risk-high-text">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>
            Unexpected permissions are those rarely needed by this category of application.
          </span>
        </div>
      )}
    </section>
  )
}
export default PermissionCard
