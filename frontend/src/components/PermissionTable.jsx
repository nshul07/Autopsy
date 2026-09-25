import { useLanguage } from '../i18n/LanguageContext'

const STATUS_STYLES = {
  expected: 'bg-success-bg text-success-text',
  unexpected: 'bg-danger-bg text-danger-text',
  not_checked: 'bg-white text-ink-muted border border-line',
}

function StatusBadge({ status, label }) {
  return (
    <span className={`inline-block text-[11.5px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  )
}

export default function PermissionTable({ permissions }) {
  const { t } = useLanguage()

  function statusLabel(status) {
    if (status === 'expected') return t.result.status.expected
    if (status === 'unexpected') return t.result.status.unexpected
    return t.result.status.notChecked
  }

  return (
    <section className="py-8 border-t border-line">
      <h2 className="text-[16px] font-semibold text-ink">{t.result.permissionBreakdown}</h2>

      {/* Desktop / tablet table */}
      <div className="mt-4 hidden sm:block overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-navy-50/50">
              <th className="px-4 py-2.5 font-medium text-ink-soft">{t.result.table.permission}</th>
              <th className="px-4 py-2.5 font-medium text-ink-soft">{t.result.table.status}</th>
              <th className="px-4 py-2.5 font-medium text-ink-soft">{t.result.table.why}</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, i) => (
              <tr key={p.permission} className={i !== permissions.length - 1 ? 'border-b border-line' : ''}>
                <td className="px-4 py-2.5 text-ink font-medium">{p.permission}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={p.status} label={statusLabel(p.status)} />
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{p.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 sm:hidden space-y-2">
        {permissions.map((p) => (
          <div key={p.permission} className="rounded-md border border-line px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-medium text-ink">{p.permission}</span>
              <StatusBadge status={p.status} label={statusLabel(p.status)} />
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">{p.why}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
