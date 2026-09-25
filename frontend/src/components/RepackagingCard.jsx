import { Fingerprint } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function RepackagingCard({ identity, sha256 }) {
  const { t } = useLanguage()

  return (
    <section className="py-8 border-t border-line">
      <h2 className="text-[16px] font-semibold text-ink">{t.result.appIdentity}</h2>

      <div
        className={[
          'mt-4 rounded-lg border p-5',
          identity.flagged ? 'border-danger-border bg-danger-bg/40' : 'border-line bg-white',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
              identity.flagged ? 'bg-danger-bg' : 'bg-navy-50',
            ].join(' ')}
          >
            <Fingerprint size={16} className={identity.flagged ? 'text-danger-strong' : 'text-navy-500'} />
          </div>
          <div>
            <h3 className={`text-[14.5px] font-semibold ${identity.flagged ? 'text-danger-text' : 'text-ink'}`}>
              {identity.result}
            </h3>
            {identity.flagged && (
              <p className="mt-0.5 text-[13.5px] text-ink-soft leading-relaxed">
                This package appears to use a different signing certificate than the known version.
              </p>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          <div>
            <dt className="text-ink-faint">Package name</dt>
            <dd className="text-ink-soft font-mono break-all mt-0.5">{identity.packageName}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">SHA-256</dt>
            <dd className="text-ink-soft font-mono break-all mt-0.5">{sha256}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Signing certificate</dt>
            <dd className="text-ink-soft font-mono break-all mt-0.5">{identity.signingCert}</dd>
          </div>
          <div>
            <dt className="text-ink-faint">Expected certificate</dt>
            <dd className="text-ink-soft font-mono break-all mt-0.5">{identity.expectedCert}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
