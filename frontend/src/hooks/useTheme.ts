import { useState, useEffect, useCallback } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const THEME_KEY = 'appautopsy.theme'

function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    /* ignore */
  }
  return 'system'
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getSavedTheme)

  const applyTheme = useCallback((currentTheme: Theme) => {
    const isDark =
      currentTheme === 'dark' ||
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, applyTheme])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme)
      try {
        localStorage.setItem(THEME_KEY, newTheme)
      } catch {
        /* ignore */
      }
      applyTheme(newTheme)
    },
    [applyTheme]
  )

  return { theme, setTheme }
}
