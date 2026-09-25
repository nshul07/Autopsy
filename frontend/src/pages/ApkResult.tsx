import { useState } from 'react'
import {
  Volume2,
  VolumeX,
  Share2,
  Check,
  ChevronDown,
  Box,
  Fingerprint,
} from 'lucide-react'
import type { ApkReport } from '../types/contract'
import { useI18n } from '../i18n'
import { useSpeech } from '../hooks/useSpeech'
import VerdictDisplay from '../components/VerdictDisplay'
import PermissionCard from '../components/PermissionCard'
import PatternCard from '../components/PatternCard'
import RepackagingCard from '../components/RepackagingCard'
import UpdateDiffCard from '../components/UpdateDiffCard'
import CrowdIntelCard from '../components/CrowdIntelCard'
import PrescriptionCard from '../components/PrescriptionCard'
import PlaybookCard from '../components/PlaybookCard'
import CalibrationCard from '../components/CalibrationCard'
import Disclaimer from '../components/Disclaimer'

interface ApkResultProps {
  report: ApkReport
  onBack?: () => void
}

export function ApkResult({ report }: ApkResultProps) {
  const { t, speechLang } = useI18n()
  const { speak, cancel, speaking, supported: speechSupported } = useSpeech(speechLang)

  const [copied, setCopied] = useState(false)
  const [showTechnical, setShowTechnical] = useState(false)

  const actionRecommendation =
    report.recommendation === 'do_not_install'
      ? t('result.action.high')
      : report.recommendation === 'review_carefully'
      ? t('result.action.medium')
      : t('result.action.low')

  const handleVoiceRead = () => {
    if (speaking) {
      cancel()
    } else {
      const speechText = `${report.app.label}. ${actionRecommendation}. ${report.summary}`
      speak(speechText)
    }
  }

  const handleShare = async () => {
    const text = `AppAutopsy Report for ${report.app.label} (${report.app.package})\nScore: ${report.score}/100 (${report.band.toUpperCase()})\nVerdict: ${actionRecommendation}\n${report.summary}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AppAutopsy: ${report.app.label}`,
          text,
        })
        return
      } catch {
        /* share dismissed */
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard write failed */
    }
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      {/* 1. App Identity Header */}
      <section className="card p-5 sm:p-6 border-line bg-surface">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center shrink-0 border border-brand/20 shadow-xs">
              <Box size={26} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[19px] sm:text-[21px] font-bold text-ink tracking-tight truncate">
                  {report.app.label || 'Unknown Application'}
                </h1>
                {'isDemo' in report && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sunken text-ink-muted border border-line">
                    Demo Data
                  </span>
                )}
              </div>

              <p className="text-[12.5px] font-mono text-ink-muted truncate mt-0.5">
                {report.app.package}
              </p>

              <div className="flex items-center gap-2 mt-1.5 text-[12px] text-ink-muted">
                {report.app.version_name && (
                  <span>
                    v{report.app.version_name} {report.app.version_code ? `(${report.app.version_code})` : ''}
                  </span>
                )}
                {report.category?.id && (
                  <span>
                    • {t('result.category')}: <strong className="text-ink capitalize">{report.category.id}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick action buttons: Voice & Share */}
          <div className="flex items-center gap-1.5 shrink-0">
            {speechSupported && (
              <button
                type="button"
                onClick={handleVoiceRead}
                className={`p-2.5 rounded-xl border transition-all ${
                  speaking
                    ? 'bg-brand text-white border-brand animate-pulse'
                    : 'bg-surface text-ink-muted hover:text-ink border-line hover:bg-sunken'
                }`}
                title={speaking ? 'Stop speech' : 'Read report aloud'}
                aria-label={speaking ? 'Stop speech' : 'Read report aloud'}
              >
                {speaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-line bg-surface text-ink-muted hover:text-ink hover:bg-sunken transition-all"
              title="Share report"
              aria-label="Share report"
            >
              {copied ? <Check size={18} className="text-risk-low-text" /> : <Share2 size={18} />}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Core UI Verdict Display: Icon, Text Label, Color, Score, Reasons & Green Safety Disclaimer */}
      <VerdictDisplay
        verdict={report.verdict}
        band={report.band}
        score={report.score}
        summary={report.summary}
        reasons={report.reasons}
        criticalPatternTriggered={report.critical_pattern_triggered}
        showDisclaimer={true}
      />

      {/* 3. Repackaging Card (THE WEDGE - High visibility) */}
      <RepackagingCard
        repackaging={report.repackaging}
        sha256={report.app.sha256}
        packageName={report.app.package}
      />

      {/* 4. Suspicious Patterns */}
      <PatternCard patterns={report.patterns} />

      {/* 5. Permissions Table */}
      <PermissionCard permissions={report.permissions} />

      {/* 6. Minimum Permission Baseline Prescription */}
      <PrescriptionCard
        prescription={report.prescription}
        categoryName={report.category?.id}
      />

      {/* 7. What Changed? Version Diff Tracker */}
      <UpdateDiffCard updateDiff={report.update_diff} />

      {/* 8. Crowd Intelligence */}
      <CrowdIntelCard crowdIntel={report.crowd_intel} />

      {/* 9. Action Playbook (What should I do now?) */}
      <PlaybookCard steps={report.playbook} appName={report.app.label} />

      {/* 10. Calibration Card (Why this result might be wrong) */}
      <CalibrationCard reasons={report.calibration} />

      {/* 11. Technical Details Accordion */}
      <section className="card p-5 border-line bg-surface">
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={showTechnical}
        >
          <div className="flex items-center gap-2">
            <Fingerprint size={18} className="text-ink-muted shrink-0" />
            <h3 className="text-[15px] font-bold text-ink">
              {t('result.sections.technical')}
            </h3>
          </div>
          <ChevronDown
            size={18}
            className={`text-ink-muted transition-transform duration-200 ${
              showTechnical ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showTechnical && (
          <dl className="mt-4 pt-3 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[12.5px] font-mono">
            <div>
              <dt className="text-ink-faint font-sans">{t('result.sha256')}</dt>
              <dd className="text-ink break-all mt-0.5">{report.app.sha256 || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-ink-faint font-sans">Min / Target SDK</dt>
              <dd className="text-ink mt-0.5">
                Android {report.app.min_sdk ?? 'N/A'} (API {report.app.min_sdk}) → Target {report.app.target_sdk ?? 'N/A'}
              </dd>
            </div>
            {report.app.signing_cert_sha256 && report.app.signing_cert_sha256.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-ink-faint font-sans">{t('result.signer')}</dt>
                <dd className="text-ink break-all mt-0.5">
                  {report.app.signing_cert_sha256.join(', ')}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-ink-faint font-sans">Report ID</dt>
              <dd className="text-ink mt-0.5">{report.report_id}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* 12. Mandatory Static Analysis Disclaimer */}
      <Disclaimer prominent />
    </div>
  )
}

export default ApkResult
