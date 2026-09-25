import { useState } from 'react'
import { Link2, ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import VerdictBanner from '../components/VerdictBanner'
import Disclaimer from '../components/Disclaimer'
import ScanProgress from '../components/ScanProgress'
import { useLanguage } from '../i18n/LanguageContext'

function SignalRow({ label, value }) {
  let icon = <HelpCircle size={15} className="text-ink-faint" />
  if (value === true) icon = <XCircle size={15} className="text-danger-strong" />
  if (value === false) icon = <CheckCircle2 size={15} className="text-success-strong" />

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0 text-[13.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className="flex items-center gap-1.5 text-ink font-medium">{icon}</span>
    </div>
  )
}

export default function LinkCheck({ onCheck, pendingUrl, report, scanning, onBack, onScanApkToo }) {
  const { t } = useLanguage()
  const [url, setUrl] = useState(pendingUrl || '')

  function submit(e) {
    e.preventDefault()
    if (!url.trim()) return
    onCheck?.(url.trim())
  }

  if (scanning) {
    return (
      <div className="container-page py-12">
        <ScanProgress onDone={() => {}} durationMs={1600} />
      </div>
    )
  }

  if (report) {
    return (
      <div className="container-page py-8">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted hover:text-ink">
          <ArrowLeft size={15} />
          {t.result.back}
        </button>

        <h1 className="mt-4 text-[17px] font-semibold text-ink break-all">{report.url}</h1>

        <div className="mt-4">
          <VerdictBanner score={report.score} band={report.band} summary={report.verdictSummary} />
        </div>

        <div className="mt-8 rounded-lg border border-line bg-white p-5">
          <SignalRow label={t.link.finalDestination} value={report.finalDestination} />
          <SignalRow label={t.link.redirects} value={`${report.redirectCount} hop(s)`} />
          <SignalRow label={t.link.https} value={!report.https} />
          <SignalRow label={t.link.directApk} value={report.directApk} />
          <SignalRow label={t.link.lookalike} value={report.lookalikeDomain} />
          <SignalRow
            label={t.link.reputation}
            value={report.reputation === 'not_checked' ? 'Not checked' : report.reputation}
          />
        </div>

        {report.directApk && (
          <div className="mt-4 rounded-lg border border-navy-400/40 bg-navy-50 p-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[13.5px] text-ink-soft">This link downloads an APK. Scan it too?</p>
            <button
              onClick={onScanApkToo}
              className="rounded-md bg-navy-500 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-navy-600 transition-colors duration-150 shrink-0"
            >
              Scan the APK
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-line">
          <Disclaimer />
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-12 max-w-lg">
      <div className="flex items-center gap-2">
        <Link2 size={17} className="text-navy-500" />
        <h1 className="text-[19px] font-semibold text-ink">{t.link.title}</h1>
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.link.placeholder}
          className="flex-1 rounded-md border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-navy-400"
        />
        <button
          type="submit"
          className="rounded-md bg-navy-500 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-navy-600 transition-colors duration-150"
        >
          {t.link.analyze}
        </button>
      </form>

      <p className="mt-4 text-[13px] text-ink-muted">{t.linkAlt.helper}</p>
    </div>
  )
}
