import { useLanguage } from '../i18n/LanguageContext'

export default function LanguageToggle() {
  const { lang, setLang, languages } = useLanguage()

  return (
    <div className="flex items-center rounded-md border border-line bg-white p-0.5 text-sm">
      {languages.map((l, i) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={[
            'px-2.5 py-1 rounded transition-colors duration-150',
            lang === l.code ? 'bg-navy-500 text-white' : 'text-ink-muted hover:text-ink',
            i > 0 ? 'ml-0.5' : '',
          ].join(' ')}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
