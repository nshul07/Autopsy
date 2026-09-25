import React, { useState } from 'react'
import {
  MessageSquareWarning,
  AlertTriangle,
  Link2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Info,
  Mail,
  FileText,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import VerdictDisplay from '../components/VerdictDisplay'
import Disclaimer from '../components/Disclaimer'
import CalibrationCard from '../components/CalibrationCard'
import type { MessageReport, ScanSource } from '../types/contract'

interface MessageCheckerProps {
  report: MessageReport | null
  loading: boolean
  onCheckMessage: (text: string, source?: ScanSource) => void
  onCheckUrl: (url: string) => void
  onReset: () => void
}

const SAMPLE_SCAM_MESSAGE =
  'Dear customer, your SBI YONO account will be suspended today. Click here to update PAN and receive Rs. 5000 rewards points APK: https://sbi-rewards-claim.info/apk/download?id=48213. Do not share OTP.'

export function MessageChecker({
  report,
  loading,
  onCheckMessage,
  onCheckUrl,
  onReset,
}: MessageCheckerProps) {
  const { t } = useI18n()
  const [messageText, setMessageText] = useState('')
  const [sourceType, setSourceType] = useState<ScanSource>('sms')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmed = messageText.trim()
    if (!trimmed) {
      setErrorMsg(t('message.empty'))
      return
    }

    onCheckMessage(trimmed, sourceType)
  }

  const handlePasteSample = () => {
    setMessageText(SAMPLE_SCAM_MESSAGE)
    setSourceType('sms')
    onCheckMessage(SAMPLE_SCAM_MESSAGE, 'sms')
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      <header>
        <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('message.title')}
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
          Check a Message
        </h1>
        <p className="text-[14.5px] text-ink-muted mt-1 leading-relaxed">
          {t('message.sub')}
        </p>
      </header>

      {/* Message Input Box */}
      <section className="card p-5 sm:p-6 border-line bg-surface">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Attribution Selector */}
          <div>
            <label className="block text-[12.5px] font-bold uppercase tracking-wider text-ink-muted mb-2">
              Message Source (Attribution)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSourceType('sms')}
                className={`flex-1 py-2 px-3 rounded-lg border text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sourceType === 'sms'
                    ? 'border-brand bg-brand-soft text-brand shadow-xs'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                <MessageSquareWarning size={15} />
                <span>SMS / WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('email')}
                className={`flex-1 py-2 px-3 rounded-lg border text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sourceType === 'email'
                    ? 'border-brand bg-brand-soft text-brand shadow-xs'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                <Mail size={15} />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('manual')}
                className={`flex-1 py-2 px-3 rounded-lg border text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sourceType === 'manual'
                    ? 'border-brand bg-brand-soft text-brand shadow-xs'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                <FileText size={15} />
                <span>Manual</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="message-textarea" className="block text-[13px] font-bold text-ink mb-1.5">
              Paste Message Text
            </label>
            <textarea
              id="message-textarea"
              rows={4}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value)
                setErrorMsg(null)
              }}
              placeholder={t('message.placeholder')}
              className="w-full p-3.5 rounded-xl border border-line bg-surface text-ink text-[14px] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand placeholder:text-ink-faint transition-all resize-y"
            />
            {errorMsg && (
              <p className="text-[12.5px] text-risk-high-text font-medium mt-1">
                {errorMsg}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <PrimaryButton
              type="submit"
              fullWidth
              loading={loading}
              icon={<MessageSquareWarning size={18} />}
            >
              {t('message.action')}
            </PrimaryButton>

            <SecondaryButton
              type="button"
              onClick={handlePasteSample}
              size="lg"
            >
              Try Sample Scam Message
            </SecondaryButton>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-line flex items-center gap-2 text-[12px] text-ink-muted">
          <Info size={14} className="shrink-0" />
          <span>{t('message.privacyNote')}</span>
        </div>
      </section>

      {/* Analysis Result */}
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

          {/* Warning Signs List */}
          <div className="card p-5 sm:p-6 border-line bg-surface">
            <h3 className="text-[16px] font-bold text-ink tracking-tight mb-3">
              {t('message.warningSigns')}
            </h3>

            {report.signals.length === 0 ? (
              <div className="p-4 rounded-xl bg-risk-low-bg/40 border border-risk-low-border text-[13.5px] text-risk-low-text flex items-center gap-2.5">
                <ShieldCheck size={18} className="shrink-0" />
                <span>{t('message.noSigns')}</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {report.signals.map((signal) => {
                  const labelKey = `message.signals.${signal}.label`
                  const bodyKey = `message.signals.${signal}.body`
                  const label = t(labelKey) !== labelKey ? t(labelKey) : signal.replace(/_/g, ' ')
                  const body = t(bodyKey) !== bodyKey ? t(bodyKey) : ''

                  return (
                    <div
                      key={signal}
                      className="p-3.5 rounded-xl border border-risk-high-border/70 bg-risk-high-bg/30 flex items-start gap-3"
                    >
                      <AlertTriangle size={18} className="text-risk-high-text shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[14px] font-bold text-risk-high-text capitalize">
                          {label}
                        </h4>
                        {body && (
                          <p className="text-[13px] text-ink-soft mt-0.5 leading-relaxed">
                            {body}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Extracted Links */}
            {report.extracted_urls && report.extracted_urls.length > 0 && (
              <div className="mt-5 pt-4 border-t border-line">
                <h4 className="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-2">
                  {t('message.linksFound')}
                </h4>
                <div className="space-y-2">
                  {report.extracted_urls.map((extractedUrl, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-line bg-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 size={16} className="text-brand shrink-0" />
                        <span className="font-mono text-ink truncate">{extractedUrl}</span>
                      </div>
                      <PrimaryButton
                        size="md"
                        onClick={() => onCheckUrl(extractedUrl)}
                        icon={<ExternalLink size={14} />}
                        className="shrink-0"
                      >
                        Check this link
                      </PrimaryButton>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <SecondaryButton size="md" onClick={onReset} icon={<RefreshCw size={15} />}>
                Check another message
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

export default MessageChecker
