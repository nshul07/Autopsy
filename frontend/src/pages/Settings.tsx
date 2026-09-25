import { useState } from 'react'
import {
  Languages,
  Moon,
  Volume2,
  Sliders,
  Shield,
  RotateCcw,
  Check,
  FlaskConical,
} from 'lucide-react'
import { useI18n, LANGUAGES } from '../i18n'
import type { Lang } from '../types/contract'
import { useTheme, type Theme } from '../hooks/useTheme'
import { useHistory } from '../hooks/useHistory'
import { setMockScenario, USE_MOCK_DATA, type MockScenario } from '../services/api'
import Disclaimer from '../components/Disclaimer'

export function Settings() {
  const { lang, setLang, t } = useI18n()
  const { theme, setTheme } = useTheme()
  const { clearHistory } = useHistory()

  const [activeScenario, setActiveScenario] = useState<MockScenario>(() => {
    try {
      const saved = localStorage.getItem('appautopsy.mock.scenario')
      if (saved === 'low' || saved === 'medium' || saved === 'high') return saved
    } catch {
      /* ignore */
    }
    return 'high'
  })

  const [resetDone, setResetDone] = useState(false)

  const handleScenarioChange = (sc: MockScenario) => {
    setActiveScenario(sc)
    setMockScenario(sc)
  }

  const handleReset = () => {
    if (window.confirm(t('settings.resetConfirm') || 'Clear history and reset settings?')) {
      clearHistory()
      setResetDone(true)
      setTimeout(() => setResetDone(false), 2000)
    }
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      <header>
        <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('nav.settings')}
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
          {t('settings.title')}
        </h1>
      </header>

      {/* 1. Language Setting */}
      <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="lang-heading">
        <div className="flex items-center gap-2.5 mb-2">
          <Languages size={18} className="text-brand shrink-0" />
          <h2 id="lang-heading" className="text-[16px] font-bold text-ink">
            {t('settings.language')}
          </h2>
        </div>
        <p className="text-[13px] text-ink-muted mb-4">{t('settings.languageHint')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {LANGUAGES.map((l) => {
            const isSelected = lang === l.code
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code as Lang)}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-brand bg-brand-soft/60 text-brand shadow-xs font-bold'
                    : 'border-line bg-surface text-ink hover:bg-sunken'
                }`}
              >
                <div>
                  <span className="text-[15px] block">{l.native}</span>
                  <span className="text-[11.5px] text-ink-muted font-normal">{l.label}</span>
                </div>
                {isSelected && <Check size={18} className="text-brand" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* 2. Appearance Setting */}
      <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="theme-heading">
        <div className="flex items-center gap-2.5 mb-2">
          <Moon size={18} className="text-brand shrink-0" />
          <h2 id="theme-heading" className="text-[16px] font-bold text-ink">
            {t('settings.appearance')}
          </h2>
        </div>
        <p className="text-[13px] text-ink-muted mb-4">{t('settings.appearanceHint')}</p>

        <div className="grid grid-cols-3 gap-2.5">
          {(['system', 'light', 'dark'] as const).map((thm) => {
            const isSelected = theme === thm
            const label =
              thm === 'system'
                ? t('settings.theme.system')
                : thm === 'light'
                ? t('settings.theme.light')
                : t('settings.theme.dark')

            return (
              <button
                key={thm}
                type="button"
                onClick={() => setTheme(thm as Theme)}
                className={`py-3 px-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-brand bg-brand-soft/60 text-brand shadow-xs font-bold'
                    : 'border-line bg-surface text-ink hover:bg-sunken font-medium'
                }`}
              >
                <span className="text-[13.5px] capitalize">{label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. Demo Mode & Mock Scenarios */}
      <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="demo-heading">
        <div className="flex items-center gap-2.5 mb-2">
          <FlaskConical size={18} className="text-brand shrink-0" />
          <h2 id="demo-heading" className="text-[16px] font-bold text-ink">
            {t('settings.demoMode')}
          </h2>
        </div>
        <p className="text-[13px] text-ink-muted mb-4">
          {USE_MOCK_DATA ? t('settings.demoModeOn') : t('settings.demoModeOff')}. Pick sample test output:
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          {(['low', 'medium', 'high'] as const).map((sc) => {
            const isSelected = activeScenario === sc
            return (
              <button
                key={sc}
                type="button"
                onClick={() => handleScenarioChange(sc)}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-brand bg-brand-soft/60 text-brand shadow-xs font-bold'
                    : 'border-line bg-surface text-ink hover:bg-sunken font-medium'
                }`}
              >
                <span className="text-[13px] capitalize">
                  {sc === 'low' ? 'Low Risk' : sc === 'medium' ? 'Medium' : 'High (Repack)'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* 4. Privacy & Safety */}
      <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="privacy-heading">
        <div className="flex items-center gap-2.5 mb-2">
          <Shield size={18} className="text-brand shrink-0" />
          <h2 id="privacy-heading" className="text-[16px] font-bold text-ink">
            {t('settings.privacy')}
          </h2>
        </div>
        <p className="text-[13.5px] text-ink-soft leading-relaxed">
          {t('settings.privacyBody')}
        </p>
        <p className="text-[12.5px] text-ink-muted mt-2 italic">
          {t('settings.privacyLimit')}
        </p>
      </section>

      {/* 5. About & Reset */}
      <section className="card p-5 sm:p-6 border-line bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-bold text-ink">{t('settings.about')}</h3>
          <p className="text-[12.5px] text-ink-muted mt-0.5">
            {t('settings.version')}: 1.0.0 (Hackathon Edition)
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface text-ink-muted hover:text-risk-high-text hover:border-risk-high-border text-[13px] font-semibold transition-all self-start sm:self-auto"
        >
          <RotateCcw size={16} />
          <span>{resetDone ? 'Reset Complete' : t('settings.reset')}</span>
        </button>
      </section>

      <Disclaimer />
    </div>
  )
}
export default Settings
