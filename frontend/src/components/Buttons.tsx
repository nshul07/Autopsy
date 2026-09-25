import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
  size?: 'md' | 'lg'
}

export function PrimaryButton({
  children,
  loading = false,
  icon,
  fullWidth = false,
  size = 'lg',
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const sizeClasses =
    size === 'lg'
      ? 'min-h-[48px] px-5 py-3 text-[15px]'
      : 'min-h-[42px] px-4 py-2.5 text-[14px]'

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight
        bg-brand text-white shadow-sm hover:bg-brand-hover active:scale-[0.99]
        disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 select-none
        ${sizeClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin text-white/80" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}

export function SecondaryButton({
  children,
  loading = false,
  icon,
  fullWidth = false,
  size = 'lg',
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const sizeClasses =
    size === 'lg'
      ? 'min-h-[48px] px-5 py-3 text-[15px]'
      : 'min-h-[42px] px-4 py-2.5 text-[14px]'

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight
        bg-surface text-ink border border-line hover:border-line-strong hover:bg-sunken active:scale-[0.99]
        disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 select-none
        ${sizeClasses}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin text-ink-muted" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}
