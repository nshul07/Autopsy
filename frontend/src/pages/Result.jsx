import { ArrowLeft } from 'lucide-react'
import AppSummary from '../components/AppSummary'
import VerdictBanner from '../components/VerdictBanner'
import WhyConcerned from '../components/WhyConcerned'
import PermissionTable from '../components/PermissionTable'
import SecuritySignals from '../components/SecuritySignals'
import RepackagingCard from '../components/RepackagingCard'
import ActionPlaybook from '../components/ActionPlaybook'
import CalibrationCard from '../components/CalibrationCard'
import { useLanguage } from '../i18n/LanguageContext'

export default function Result({ report, onBack }) {
  const { t } = useLanguage()

  return (
    <div className="container-page py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={15} />
        {t.result.back}
      </button>

      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-[15px] font-medium text-ink-muted">{t.result.complete}</h1>
        {report.isDemo && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-navy-50 text-navy-500">
            Demo data
          </span>
        )}
      </div>

      <AppSummary report={report} />

      <div className="mt-2">
        <VerdictBanner score={report.score} band={report.band} summary={report.verdictSummary} />
      </div>

      <WhyConcerned reasons={report.reasons} />
      <PermissionTable permissions={report.permissions} />
      <SecuritySignals signals={report.signals} />
      <RepackagingCard identity={report.identity} sha256={report.sha256} />
      <ActionPlaybook steps={report.playbook} />
      <CalibrationCard reasons={report.calibration} />
    </div>
  )
}
