import Logo from './Logo'
import Disclaimer from './Disclaimer'
import { useLanguage } from '../i18n/LanguageContext'

export default function Footer({ onNavigate }) {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-line mt-20">
      <div className="container-page py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-2 text-[13.5px] text-ink-muted leading-relaxed">{t.footer.tagline}</p>
          </div>

          <div className="flex gap-10 text-[13.5px]">
            <button onClick={() => onNavigate?.('how')} className="text-ink-soft hover:text-ink">
              {t.footer.how}
            </button>
            <button onClick={() => onNavigate?.('privacy')} className="text-ink-soft hover:text-ink">
              {t.footer.privacy}
            </button>
            <button onClick={() => onNavigate?.('limitations')} className="text-ink-soft hover:text-ink">
              {t.footer.limitations}
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-ink-soft hover:text-ink"
            >
              {t.footer.github}
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-line">
          <Disclaimer />
        </div>
      </div>
    </footer>
  )
}
