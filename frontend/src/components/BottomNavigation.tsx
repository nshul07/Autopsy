import { Home, ShieldCheck, History, BookOpen, Settings } from 'lucide-react'
import { useI18n } from '../i18n'

export type NavTab = 'home' | 'scan' | 'history' | 'learn' | 'settings'

interface BottomNavigationProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
}

export function BottomNavigation({ currentTab, onSelectTab }: BottomNavigationProps) {
  const { t } = useI18n()

  const tabs: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t('nav.home') || 'Home', icon: Home },
    { id: 'scan', label: t('nav.scan') || 'Scan', icon: ShieldCheck },
    { id: 'history', label: t('nav.history') || 'History', icon: History },
    { id: 'learn', label: t('nav.learn') || 'Learn', icon: BookOpen },
    { id: 'settings', label: t('nav.settings') || 'Settings', icon: Settings },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line shadow-nav transition-colors"
      aria-label="Bottom Navigation"
    >
      <div className="mx-auto max-w-shell px-2 flex items-center justify-around h-[64px]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-150 select-none
                ${
                  isActive
                    ? 'text-brand font-bold scale-[1.03]'
                    : 'text-ink-muted hover:text-ink hover:bg-sunken/40 font-medium'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-brand-soft text-brand' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
export default BottomNavigation
