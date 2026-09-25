import { ShieldCheck, AlertTriangle, ShieldAlert, Info, AlertOctagon } from 'lucide-react'
import type { Band, Verdict } from '../types/contract'
import { useI18n } from '../i18n'
import RiskGauge from './RiskGauge'

export interface VerdictDisplayProps {
  verdict: Verdict
  band: Band
  score: number
  summary: string
  reasons?: string[]
  criticalPatternTriggered?: boolean
  className?: string
  showDisclaimer?: boolean
}

export function VerdictDisplay({
  verdict,
  band,
  score,
  summary,
  reasons = [],
  criticalPatternTriggered = false,
  className = '',
  showDisclaimer = true,
}: VerdictDisplayProps) {
  const { t } = useI18n()

  const normalizedVerdict: Verdict =
    verdict || (band === 'high' ? 'red' : band === 'medium' ? 'yellow' : 'green')

  const config = {
    green: {
      key: 'green',
      icon: ShieldCheck,
      colorName: 'GREEN',
      badgeClass: 'bg-risk-low-bg text-risk-low-text border-risk-low-border',
      borderClass: 'border-risk-low-border',
      bgCardClass: 'bg-surface',
      headerBg: 'bg-risk-low-bg/40',
      textAccent: 'text-risk-low-text',
      dotClass: 'bg-risk-low',
      label: t('verdict.green.label') || 'LOOKED CLEAN',
      action: t('result.action.low') || 'No major red flags found',
      disclaimerText:
        t('verdict.green.disclaimer') ||
        'Notice: A clean verdict indicates no known suspicious patterns or permission mismatches were detected during static inspection. It does NOT guarantee that this app or link is safe.',
    },
    yellow: {
      key: 'yellow',
      icon: AlertTriangle,
      colorName: 'YELLOW',
      badgeClass: 'bg-risk-medium-bg text-risk-medium-text border-risk-medium-border',
      borderClass: 'border-risk-medium-border',
      bgCardClass: 'bg-surface',
      headerBg: 'bg-risk-medium-bg/40',
      textAccent: 'text-risk-medium-text',
      dotClass: 'bg-risk-medium',
      label: t('verdict.yellow.label') || 'REVIEW CAREFULLY',
      action: t('result.action.medium') || 'Review carefully before installing',
      disclaimerText:
        t('verdict.yellow.disclaimer') ||
        'Static analysis detected unusual permissions or behaviors. Verify the developer and grant permissions only if you understand their purpose.',
    },
    red: {
      key: 'red',
      icon: ShieldAlert,
      colorName: 'RED',
      badgeClass: 'bg-risk-high-bg text-risk-high-text border-risk-high-border',
      borderClass: 'border-risk-high-border',
      bgCardClass: 'bg-surface',
      headerBg: 'bg-risk-high-bg/40',
      textAccent: 'text-risk-high-text',
      dotClass: 'bg-risk-high',
      label: t('verdict.red.label') || 'HIGH RISK',
      action: t('result.action.high') || 'Do not install',
      disclaimerText:
        t('verdict.red.disclaimer') ||
        'High danger patterns detected. Do not install, run, or open this resource.',
    },
  }[normalizedVerdict]

  const IconComponent = config.icon

  return (
    <section
      className={`card border overflow-hidden ${config.borderClass} ${config.bgCardClass} ${className}`}
      aria-label={`Verdict: ${config.label}`}
    >
      {/* Top Banner with Verdict Badge, Color, Icon, Text Label, and Score */}
      <div className={`p-4 sm:p-5 border-b ${config.borderClass} ${config.headerBg} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${config.badgeClass} shadow-xs`}>
            <IconComponent size={24} strokeWidth={2.4} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[12px] font-bold tracking-wider uppercase border ${config.badgeClass}`}
                role="status"
              >
                <IconComponent size={14} strokeWidth={2.5} />
                <span>{config.label}</span>
                <span className="opacity-80">({config.colorName})</span>
              </span>

              {criticalPatternTriggered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-risk-high text-white">
                  <AlertOctagon size={12} />
                  <span>Critical Risk</span>
                </span>
              )}
            </div>

            <h2 className="text-[18px] sm:text-[20px] font-bold text-ink tracking-tight mt-1 leading-snug">
              {config.action}
            </h2>
          </div>
        </div>

        {/* Explicit Numeric Score Pill */}
        <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-line shadow-xs">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted block leading-none">
              Risk Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-[19px] font-bold font-mono leading-none tabular-nums ${config.textAccent}`}>
                {score}
              </span>
              <span className="text-[12px] text-ink-muted font-medium">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body: Gauge & Clear Explanation / Reasons */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0 flex justify-center py-1">
            <RiskGauge score={score} band={band} size={150} />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="text-[14px] font-bold text-ink uppercase tracking-wider mb-1.5">
              Executive Summary
            </h3>
            <p className="text-[14.5px] text-ink leading-relaxed">
              {summary}
            </p>

            {/* Explanations & Reasons */}
            {reasons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line text-left">
                <h4 className="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-2.5">
                  Reasons for this verdict ({reasons.length})
                </h4>
                <ul className="space-y-2">
                  {reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[13.5px] text-ink leading-relaxed">
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${config.dotClass}`} />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Safety Disclaimer Banner (Crucial for GREEN to not imply guaranteed safety) */}
        {showDisclaimer && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-[12.5px] leading-relaxed ${
              normalizedVerdict === 'green'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-sunken/60 border-line text-ink-muted'
            }`}
            role="note"
          >
            <Info size={16} className="shrink-0 mt-0.5 text-ink-muted" />
            <div>
              <p className="font-semibold text-ink">
                {normalizedVerdict === 'green' ? 'Verification Notice:' : 'Analysis Notice:'}
              </p>
              <p className="mt-0.5">{config.disclaimerText}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default VerdictDisplay
