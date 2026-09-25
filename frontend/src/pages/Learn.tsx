import { useState } from 'react'
import {
  FileText,
  KeyRound,
  MessageSquare,
  Eye,
  Fingerprint,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react'
import { useI18n } from '../i18n'
import Disclaimer from '../components/Disclaimer'

export function Learn() {
  const { t } = useI18n()
  const [openCard, setOpenCard] = useState<string | null>('apk')

  const cards = [
    {
      id: 'apk',
      icon: FileText,
      title: t('learn.cards.apk.title'),
      body: t('learn.cards.apk.body'),
    },
    {
      id: 'permissions',
      icon: KeyRound,
      title: t('learn.cards.permissions.title'),
      body: t('learn.cards.permissions.body'),
    },
    {
      id: 'sms',
      icon: MessageSquare,
      title: t('learn.cards.sms.title'),
      body: t('learn.cards.sms.body'),
    },
    {
      id: 'accessibility',
      icon: Eye,
      title: t('learn.cards.accessibility.title'),
      body: t('learn.cards.accessibility.body'),
    },
    {
      id: 'repackaged',
      icon: Fingerprint,
      title: t('learn.cards.repackaged.title'),
      body: t('learn.cards.repackaged.body'),
    },
    {
      id: 'safe',
      icon: ShieldCheck,
      title: t('learn.cards.safe.title'),
      body: t('learn.cards.safe.body'),
    },
  ]

  const toggle = (id: string) => {
    setOpenCard(openCard === id ? null : id)
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      <header>
        <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('nav.learn')}
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
          Security Knowledge
        </h1>
        <p className="text-[14.5px] text-ink-muted mt-1 leading-relaxed">
          {t('learn.sub')}
        </p>
      </header>

      <section className="space-y-3" aria-label="Educational Guides">
        {cards.map((card) => {
          const Icon = card.icon
          const isOpen = openCard === card.id

          return (
            <div
              key={card.id}
              className="card overflow-hidden border-line bg-surface transition-all duration-150"
            >
              <button
                type="button"
                onClick={() => toggle(card.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <h3 className="text-[15.5px] font-bold text-ink truncate">
                    {card.title}
                  </h3>
                </div>

                <div className="text-ink-muted shrink-0 ml-2">
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                  <div className="pt-3 border-t border-line text-[14px] text-ink-soft leading-relaxed">
                    {card.body}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <Disclaimer />
    </div>
  )
}
export default Learn
