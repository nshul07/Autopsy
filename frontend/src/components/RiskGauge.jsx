const BAND_COLORS = {
  high: '#B3402E',
  medium: '#B8862B',
  low: '#2F6B49',
}

const BAND_TRACK = {
  high: '#F3DAD5',
  medium: '#F3E3C0',
  low: '#D6E9DC',
}

// Semicircle gauge, 0-100, drawn with a single arc whose stroke-dashoffset
// reflects the score. Kept deliberately simple — no needle, no ticks.
export default function RiskGauge({ score, band, size = 168 }) {
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius // half circle
  const clamped = Math.max(0, Math.min(100, score))
  const offset = circumference - (clamped / 100) * circumference
  const color = BAND_COLORS[band] || BAND_COLORS.medium
  const track = BAND_TRACK[band] || BAND_TRACK.medium

  const cx = size / 2
  const cy = size / 2

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + strokeWidth / 2} viewBox={`0 0 ${size} ${size / 2 + strokeWidth / 2}`}>
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms ease-out' }}
        />
      </svg>
      <div className="absolute top-[46%] -translate-y-1/2 flex flex-col items-center">
        <span className="text-[34px] font-semibold leading-none text-ink tabular-nums">{clamped}</span>
        <span className="text-[12px] text-ink-muted mt-0.5">/ 100</span>
      </div>
    </div>
  )
}
