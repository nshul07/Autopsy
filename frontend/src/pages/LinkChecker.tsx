import React, { useState } from 'react'
import { Link2, QrCode, Globe, ArrowRight, RefreshCw, ExternalLink } from 'lucide-react'
import { useI18n } from '../i18n'
import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import VerdictDisplay from '../components/VerdictDisplay'
import Disclaimer from '../components/Disclaimer'
import CalibrationCard from '../components/CalibrationCard'
import type { LinkReport } from '../types/contract'
import { validateUrl } from '../lib/validate'
import { hostOf } from '../lib/format'

interface LinkCheckerProps {
  report: LinkReport | null
  loading: boolean
  onCheckUrl: (url: string) => void
  onNavigateToQr: () => void
  onNavigateToScanApk: () => void
  onReset: () => void
}

export function LinkChecker({
  report,
  loading,
  onCheckUrl,
  onNavigateToQr,
  onNavigateToScanApk,
  onReset,
}: LinkCheckerProps) {
  const { t } = useI18n()
  const [urlInput, setUrlInput] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const check = validateUrl(urlInput)
    if (!check.ok) {
      if (check.reason === 'empty') setErrorMsg(t('link.empty'))
      else if (check.reason === 'scheme') setErrorMsg(t('errors.invalidUrlScheme'))
      else setErrorMsg(t('errors.invalidUrl'))
      return
    }

    onCheckUrl(check.url)
  }

  const handleQuickDemo = (sampleUrl: string) => {
    setUrlInput(sampleUrl)
    onCheckUrl(sampleUrl)
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      <header>
        <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('link.title')}
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
          Check a Download Link
        </h1>
        <p className="text-[14.5px] text-ink-muted mt-1 leading-relaxed">
          {t('link.sub')}
        </p>
      </header>

      {/* Input Form */}
      <section className="card p-5 sm:p-6 border-line bg-surface">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url-input" className="block text-[13px] font-bold text-ink mb-1.5">
              Download Link or URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                <Globe size={18} />
              </div>
              <input
                id="url-input"
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  setErrorMsg(null)
                }}
                placeholder={t('link.placeholder')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-surface text-ink text-[14.5px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-ink-faint transition-all font-mono text-[13.5px]"
              />
            </div>
            {errorMsg && (
              <p className="text-[12.5px] text-risk-high-text font-medium mt-1.5">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryButton
              type="submit"
              fullWidth
              loading={loading}
              icon={<Link2 size={18} />}
            >
              {t('link.action')}
            </PrimaryButton>

            <SecondaryButton
              type="button"
              onClick={onNavigateToQr}
              icon={<QrCode size={18} />}
              size="lg"
            >
              {t('link.scanQr')}
            </SecondaryButton>
          </div>
        </form>

        {/* Quick test sample links */}
        <div className="mt-5 pt-4 border-t border-line">
          <span className="text-[12px] font-bold text-ink-muted uppercase tracking-wider block mb-2">
            Try a sample link:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleQuickDemo(
                  'https://sbi-rewards-claim.info/apk/download?id=48213'
                )
              }
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-risk-high-border bg-risk-high-bg/40 text-risk-high-text hover:bg-risk-high-bg transition-colors"
            >
              ⚠ Fake Bank Reward APK (Red)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('https://f-droid.org/F-Droid.apk')}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-line bg-sunken hover:bg-line text-ink transition-colors"
            >
              Direct F-Droid APK
            </button>
          </div>
        </div>
      </section>

      {/* Result Section (when report is present) */}
      {report && (
        <section className="space-y-6 animate-fade-up">
          {/* Core UI Verdict Display: Icon, Text Label, Color, Score, Reasons & Green Safety Disclaimer */}
          <VerdictDisplay
            verdict={report.verdict}
            band={report.band}
            score={report.score}
            summary={report.summary}
            reasons={report.reasons}
            showDisclaimer={true}
          />

          {/* Direct APK Download Hand-off Banner */}
          {report.direct_apk && (
            <div className="card p-5 border-brand/50 bg-brand-soft/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-[15px] font-bold text-brand">
                  {t('link.offerScan')}
                </h4>
                <p className="text-[13px] text-ink-soft mt-0.5">
                  {t('link.offerScanBody')}
                </p>
              </div>
              <PrimaryButton
                size="md"
                onClick={onNavigateToScanApk}
                icon={<ArrowRight size={16} />}
                className="shrink-0"
              >
                {t('link.offerScanAction')}
              </PrimaryButton>
            </div>
          )}

          {/* Analysis Breakdown */}
          <div className="card p-5 sm:p-6 border-line bg-surface">
            <h3 className="text-[16px] font-bold text-ink tracking-tight mb-4">
              {t('link.resultTitle')}
            </h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13.5px]">
              <div className="p-3 rounded-xl border border-line bg-sunken/40">
                <dt className="text-ink-muted text-[12px]">{t('link.domain')}</dt>
                <dd className="font-semibold text-ink break-all mt-0.5 font-mono text-[13px]">
                  {hostOf(report.url)}
                </dd>
              </div>

              <div className="p-3 rounded-xl border border-line bg-sunken/40">
                <dt className="text-ink-muted text-[12px]">{t('link.redirects')}</dt>
                <dd className="font-semibold text-ink mt-0.5">
                  {report.redirect_count} {report.redirect_count === 1 ? 'hop' : 'hops'}
                </dd>
              </div>

              <div className="p-3 rounded-xl border border-line bg-sunken/40">
                <dt className="text-ink-muted text-[12px]">{t('link.directApk')}</dt>
                <dd
                  className={`font-semibold mt-0.5 ${
                    report.direct_apk ? 'text-risk-high-text' : 'text-risk-low-text'
                  }`}
                >
                  {report.direct_apk ? t('link.value.yes') : t('link.value.no')}
                </dd>
              </div>

              <div className="p-3 rounded-xl border border-line bg-sunken/40">
                <dt className="text-ink-muted text-[12px]">{t('link.lookalike')}</dt>
                <dd
                  className={`font-semibold mt-0.5 ${
                    report.lookalike_domain ? 'text-risk-high-text' : 'text-risk-low-text'
                  }`}
                >
                  {report.lookalike_domain ? t('link.value.yes') : t('link.value.no')}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex justify-end">
              <SecondaryButton size="md" onClick={onReset} icon={<RefreshCw size={15} />}>
                Check another link
              </SecondaryButton>
            </div>
          </div>

          <CalibrationCard reasons={report.calibration} />
        </section>
      )}

      <Disclaimer />
    </div>
  )
}

export default LinkChecker
