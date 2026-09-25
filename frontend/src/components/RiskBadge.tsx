import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react'
import type { Band, Verdict } from '../types/contract'
import { useI18n } from '../i18n'

interface RiskBadgeProps {
  band?: Band
  verdict?: Verdict
  score?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showScore?: boolean
}

export function RiskBadge({
  band,
  verdict,
  score,
  size = 'md',
  className = '',
  showScore = false,
}: RiskBadgeProps) {
  const { t } = useI18n()

  const effectiveBand: Band =
    band || (verdict === 'red' ? 'high' : verdict === 'yellow' ? 'medium' : 'low')

  const config = {
    low: {
      label: t('result.band.low') || 'LOW RISK',
      colorName: 'GREEN',
      icon: ShieldCheck,
      classes: 'bg-risk-low-bg text-risk-low-text border-risk-low-border',
    },
    medium: {
      label: t('result.band.medium') || 'REVIEW CAREFULLY',
      colorName: 'YELLOW',
      icon: AlertTriangle,
      classes: 'bg-risk-medium-bg text-risk-medium-text border-risk-medium-border',
    },
    high: {
      label: t('result.band.high') || 'HIGH RISK',
      colorName: 'RED',
      icon: ShieldAlert,
      classes: 'bg-risk-high-bg text-risk-high-text border-risk-high-border',
    },
  }[effectiveBand]

  const Icon = config.icon

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold tracking-wider',
    md: 'text-[12px] px-2.5 py-1 gap-1.5 font-bold tracking-wide',
    lg: 'text-[13.5px] px-3.5 py-1.5 gap-2 font-bold tracking-wide',
  }[size]

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size]

  return (
    <span
      className={`inline-flex items-center rounded-lg border uppercase select-none font-sans ${config.classes} ${sizeStyles} ${className}`}
      role="status"
    >
      <Icon size={iconSizes} strokeWidth={2.4} className="shrink-0" />
      <span>{config.label}</span>
      {showScore && typeof score === 'number' && (
        <span className="font-mono ml-0.5 opacity-90">({score}/100)</span>
      )}
    </span>
  )
}

export default RiskBadge
