import { UploadCloud, Search, Scale, MessageSquareText } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

const icons = [UploadCloud, Search, Scale, MessageSquareText]

export default function HowItWorks() {
  const { t } = useLanguage()

  return (
    <section id="how-it-works" className="container-page py-16">
      <h2 className="text-xl font-semibold text-ink">{t.how.title}</h2>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
        {t.how.steps.map((step, i) => {
          const Icon = icons[i]
          return (
            <div key={step.title} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-navy-50 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-navy-500" />
                </div>
                <h3 className="text-[14.5px] font-semibold text-ink">{step.title}</h3>
              </div>
              <p className="text-[13.5px] text-ink-muted leading-relaxed">{step.body}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
