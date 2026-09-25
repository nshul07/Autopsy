import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import LanguageToggle from './LanguageToggle'
import { useLanguage } from '../i18n/LanguageContext'

export default function Header({ onNavigate }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const navItems = [
    { key: 'scan', label: t.nav.scan, view: 'scan' },
    { key: 'link', label: t.nav.link, view: 'link' },
    { key: 'how', label: t.nav.how, view: 'how' },
    { key: 'about', label: t.nav.about, view: 'about' },
  ]

  function go(view) {
    setOpen(false)
    onNavigate?.(view)
  }

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm border-b border-line">
      <div className="container-page flex items-center justify-between h-16">
        <button onClick={() => go('home')} className="shrink-0" aria-label="AppAutopsy home">
          <Logo />
        </button>

        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.view)}
              className="text-[14.5px] text-ink-soft hover:text-ink transition-colors duration-150"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:block">
          <LanguageToggle />
        </div>

        <button
          className="md:hidden text-ink-soft"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-paper">
          <div className="container-page py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => go(item.view)}
                className="text-left py-2 text-[15px] text-ink-soft hover:text-ink"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2">
              <LanguageToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
