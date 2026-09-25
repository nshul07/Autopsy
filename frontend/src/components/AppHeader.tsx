import { Shield, Moon, Sun, ArrowLeft } from 'lucide-react'
import { useI18n, LANGUAGES } from '../i18n'
import type { Lang } from '../types/contract'
import { useTheme } from '../hooks/useTheme'

interface AppHeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  onLogoClick?: () => void
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  onLogoClick,
}: AppHeaderProps) {
  const { lang, setLang, t } = useI18n()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-surface/95 backdrop-blur-md transition-colors">
      <div className="container-page h-16 flex items-center justify-between gap-3">
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] -ml-2 rounded-xl flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sunken active:scale-95 transition-all"
              aria-label={t('common.back')}
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onLogoClick}
              className="flex items-center gap-2.5 text-left group select-none"
              aria-label="AppAutopsy Home"
            >
              <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs group-hover:bg-brand-hover transition-colors">
                <Shield size={20} strokeWidth={2.2} />
              </div>
              <div className="leading-tight">
                <span className="text-[17px] font-bold text-ink tracking-tight block">
                  AppAutopsy
                </span>
                <span className="text-[11px] text-ink-muted hidden sm:block">
                  {t('app.tagline')}
                </span>
              </div>
            </button>
          )}

          {title && showBack && (
            <h1 className="text-[16px] font-bold text-ink truncate ml-1">{title}</h1>
          )}
        </div>

        {/* Right actions: Language pill & Dark mode toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Selector Dropdown / Pills */}
          <div className="flex items-center bg-sunken rounded-lg p-0.5 border border-line">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code as Lang)}
                className={`px-2 py-1 text-[11.5px] font-bold rounded-md transition-all ${
                  lang === item.code
                    ? 'bg-surface text-brand shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
                aria-label={`Switch to ${item.label}`}
              >
                {item.native}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sunken active:scale-95 transition-all"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
export default AppHeader
