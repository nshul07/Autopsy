import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from '../types/contract'
import en from './locales/en.json'
import hi from './locales/hi.json'
import pa from './locales/pa.json'
import messagesEn from './locales/messages_en.json'
import messagesHi from './locales/messages_hi.json'
import messagesPa from './locales/messages_pa.json'

export const LANGUAGES: { code: Lang; label: string; native: string; speech: string }[] = [
  { code: 'en', label: 'English', native: 'English', speech: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', speech: 'pa-IN' },
]

const DICTIONARIES: Record<Lang, unknown> = {
  en: { ...messagesEn, ...en },
  hi: { ...messagesHi, ...hi },
  pa: { ...messagesPa, ...pa },
}

const STORAGE_KEY = 'appautopsy.lang'
const DEFAULT_LANG: Lang = 'en'

export type TranslateParams = Record<string, string | number>

/** `t('result.permissionCount', { count: 4 })` → "4 permissions checked" */
export type Translate = (path: string, params?: TranslateParams) => string

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'hi' || value === 'pa'
}

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLang(stored)) return stored
  } catch {
    /* storage unavailable (private mode) — fall through */
  }
  return DEFAULT_LANG
}

/** Walk a dotted path or flat key through the dictionary. */
function lookup(dict: unknown, path: string): unknown {
  if (!dict || typeof dict !== 'object') return undefined
  if (path in (dict as Record<string, unknown>)) {
    return (dict as Record<string, unknown>)[path]
  }
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object' && key in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[key]
    }
    return undefined
  }, dict)
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in params ? String(params[key]) : whole
  )
}

/** Resolve a path to a string, or to a string array for list-valued keys. */
export function resolveText(lang: Lang, path: string): string | string[] | undefined {
  const value = lookup(DICTIONARIES[lang], path)
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value as string[]
  return undefined
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translate
  /** Like `t`, but for keys whose value is an array of strings. */
  tList: (path: string) => string[]
  /** The BCP-47 tag to hand to `speechSynthesis`. */
  speechLang: string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback<Translate>(
    (path, params) => {
      const value = resolveText(lang, path)
      // Fall back to English so a gap in a translation never renders a raw key.
      const fallback = typeof value === 'string' ? value : resolveText('en', path)
      const text = typeof fallback === 'string' ? fallback : path
      return interpolate(text, params)
    },
    [lang]
  )

  const tList = useCallback(
    (path: string) => {
      const value = resolveText(lang, path)
      if (Array.isArray(value)) return value
      const fallback = resolveText('en', path)
      return Array.isArray(fallback) ? fallback : []
    },
    [lang]
  )

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t,
      tList,
      speechLang: LANGUAGES.find((l) => l.code === lang)?.speech ?? 'en-IN',
    }),
    [lang, setLang, t, tList]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

export const LANGUAGE_STORAGE_KEY = STORAGE_KEY