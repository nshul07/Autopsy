import { ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react'
import type { Band } from '../types/contract'
import { useI18n } from '../i18n'

interface RiskBadgeProps {
  band: Band
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RiskBadge({ band, size = 'md', className = '' }: RiskBadgeProps) {
  const { t } = useI18n()

  const config = {
    low: {
      label: t('result.band.low') || 'LOW RISK',
      icon: ShieldCheck,
      classes: 'bg-risk-low-bg text-risk-low-text border-risk-low-border',
      dot: 'bg-risk-low',
    },
    medium: {
      label: t('result.band.medium') || 'REVIEW CAREFULLY',
      icon: AlertCircle,
      classes: 'bg-risk-medium-bg text-risk-medium-text border-risk-medium-border',
      dot: 'bg-risk-medium',
    },
    high: {
      label: t('result.band.high') || 'HIGH RISK',
      icon: AlertTriangle,
      classes: 'bg-risk-high-bg text-risk-high-text border-risk-high-border',
      dot: 'bg-risk-high',
    },
  }[band] || {
    label: t('result.band.medium') || 'REVIEW CAREFULLY',
    icon: AlertCircle,
    classes: 'bg-risk-medium-bg text-risk-medium-text border-risk-medium-border',
    dot: 'bg-risk-medium',
  }

  const Icon = config.icon

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold tracking-wider',
    md: 'text-[12.5px] px-2.5 py-1 gap-1.5 font-bold tracking-wide',
    lg: 'text-[14px] px-3.5 py-1.5 gap-2 font-bold tracking-wide',
  }[size]

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size]

  return (
    <span
      className={`inline-flex items-center rounded-lg border uppercase select-none ${config.classes} ${sizeStyles} ${className}`}
      role="status"
    >
      <Icon size={iconSizes} strokeWidth={2.5} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}
export default RiskBadge
