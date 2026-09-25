import type { Band } from '../types/contract'

interface RiskGaugeProps {
  score: number
  band: Band
  size?: number
}

const BAND_COLORS: Record<Band, string> = {
  high: 'var(--risk-high)',
  medium: 'var(--risk-medium)',
  low: 'var(--risk-low)',
}

const BAND_TRACKS: Record<Band, string> = {
  high: 'var(--risk-high-bg)',
  medium: 'var(--risk-medium-bg)',
  low: 'var(--risk-low-bg)',
}

export function RiskGauge({ score, band, size = 160 }: RiskGaugeProps) {
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius // Semicircle
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const offset = circumference - (clamped / 100) * circumference

  const color = BAND_COLORS[band] || 'var(--risk-medium)'
  const track = BAND_TRACKS[band] || 'var(--risk-medium-bg)'

  const cx = size / 2
  const cy = size / 2

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center select-none"
      style={{ width: size, height: size / 2 + strokeWidth }}
      aria-label={`Risk score: ${clamped} out of 100`}
    >
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        className="overflow-visible"
      >
        {/* Background track */}
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active colored arc */}
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>

      <div className="absolute top-[42%] -translate-y-1/2 flex flex-col items-center text-center">
        <span className="text-[36px] font-bold tracking-tight text-ink leading-none tabular-nums">
          {clamped}
        </span>
        <span className="text-[12px] font-medium text-ink-muted mt-1">/ 100</span>
      </div>
    </div>
  )
}
export default RiskGauge
