import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function LinkCheckerInline({ onCheck }) {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!url.trim()) return
    onCheck?.(url.trim())
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center gap-2">
        <Link2 size={16} className="text-navy-500" />
        <h3 className="text-[15px] font-semibold text-ink">{t.linkAlt.subtitle}</h3>
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">{t.linkAlt.helper}</p>

      <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.linkAlt.placeholder}
          className="flex-1 rounded-md border border-line bg-paper px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-navy-400"
        />
        <button
          type="submit"
          className="rounded-md bg-navy-500 px-4 py-2 text-[13.5px] font-medium text-white hover:bg-navy-600 transition-colors duration-150"
        >
          {t.linkAlt.button}
        </button>
      </form>
    </div>
  )
}
