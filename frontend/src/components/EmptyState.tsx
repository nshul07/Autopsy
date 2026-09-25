import React from 'react'
import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`card p-8 sm:p-10 flex flex-col items-center justify-center text-center border-dashed ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-sunken flex items-center justify-center text-ink-muted mb-3.5">
        {icon || <FolderOpen size={26} strokeWidth={1.8} />}
      </div>

      <h4 className="text-[16px] font-bold text-ink tracking-tight">{title}</h4>

      {description && (
        <p className="text-[13.5px] text-ink-muted max-w-xs mt-1.5 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-xl text-[13.5px] font-semibold text-brand bg-brand-soft hover:bg-brand-soft/80 active:scale-95 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
export default EmptyState
