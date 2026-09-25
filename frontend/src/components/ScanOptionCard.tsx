import React from 'react'
import { ChevronRight } from 'lucide-react'

interface ScanOptionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  primary?: boolean
  badge?: string
}

export function ScanOptionCard({
  icon,
  title,
  description,
  onClick,
  primary = false,
  badge,
}: ScanOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-150 select-none
        active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand flex items-center justify-between gap-3.5
        ${
          primary
            ? 'bg-brand text-white border-brand shadow-md hover:bg-brand-hover'
            : 'bg-surface text-ink border-line shadow-card hover:border-line-strong hover:bg-sunken/40'
        }
      `}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center shrink-0
            ${primary ? 'bg-white/15 text-white' : 'bg-brand-soft text-brand'}
          `}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-[16px] sm:text-[17px] font-bold tracking-tight truncate ${
                primary ? 'text-white' : 'text-ink'
              }`}
            >
              {title}
            </h3>
            {badge && (
              <span
                className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  primary
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-soft text-brand'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            className={`text-[13px] sm:text-[13.5px] line-clamp-1 mt-0.5 ${
              primary ? 'text-white/80' : 'text-ink-muted'
            }`}
          >
            {description}
          </p>
        </div>
      </div>

      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          primary ? 'text-white/80' : 'text-ink-muted'
        }`}
      >
        <ChevronRight size={20} />
      </div>
    </button>
  )
}
export default ScanOptionCard
