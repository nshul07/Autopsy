import { MessageSquareText, Users, MapPin, Accessibility, ShieldAlert } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const ICONS = {
  sms: MessageSquareText,
  contacts: Users,
  location: MapPin,
  accessibility: Accessibility,
}

export default function WhyConcerned({ reasons }) {
  const { t } = useLanguage()
  if (!reasons?.length) return null

  return (
    <section className="py-8 border-t border-line">
      <h2 className="text-[16px] font-semibold text-ink">{t.result.whyConcerned}</h2>

      <div className="mt-4 space-y-4">
        {reasons.map((reason) => {
          const Icon = ICONS[reason.key] || ShieldAlert
          const isUnexpected = reason.status === 'unexpected'
          return (
            <div key={reason.key} className="flex gap-3">
              <div
                className={[
                  'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                  isUnexpected ? 'bg-danger-bg' : 'bg-success-bg',
                ].join(' ')}
              >
                <Icon size={15} className={isUnexpected ? 'text-danger-strong' : 'text-success-strong'} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-medium text-ink">{reason.label}</h3>
                  <span
                    className={[
                      'text-[11.5px] font-medium px-1.5 py-0.5 rounded',
                      isUnexpected ? 'bg-danger-bg text-danger-text' : 'bg-success-bg text-success-text',
                    ].join(' ')}
                  >
                    {isUnexpected ? t.result.status.unexpected : t.result.status.expected}
                  </span>
                </div>
                <p className="mt-0.5 text-[13.5px] text-ink-muted leading-relaxed">{reason.body}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
