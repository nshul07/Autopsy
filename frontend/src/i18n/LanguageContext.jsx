import { createContext, useContext, useState, useMemo } from 'react'
import { translations, LANGUAGES } from './translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: translations[lang],
      languages: LANGUAGES,
    }),
    [lang]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
