import { ShieldCheck } from 'lucide-react'
import ApkUploader from '../components/ApkUploader'
import LinkCheckerInline from '../components/LinkCheckerInline'
import HowItWorks from '../components/HowItWorks'
import Disclaimer from '../components/Disclaimer'
import { useLanguage } from '../i18n/LanguageContext'

export default function Home({ onFileSelected, onLinkCheck, onTryDemo, scrollTarget }) {
  const { t } = useLanguage()

  return (
    <>
      <section className="container-page pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="max-w-2xl">
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-tight text-ink leading-[1.15]">
            {t.hero.headline}
          </h1>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed max-w-xl">{t.hero.sub}</p>
        </div>
      </section>

      <section id="scan" className="container-page pb-16">
        <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-navy-50 flex items-center justify-center shrink-0">
              <ShieldCheck size={17} className="text-navy-500" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-ink">{t.scanner.title}</h2>
              <p className="mt-1 text-[13.5px] text-ink-muted leading-relaxed max-w-lg">{t.scanner.desc}</p>
            </div>
          </div>

          <div className="mt-6">
            <ApkUploader onFileSelected={onFileSelected} />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Disclaimer />
            <button
              onClick={onTryDemo}
              className="text-[13px] font-medium text-navy-500 hover:text-navy-600 underline underline-offset-2 shrink-0 text-left sm:text-right"
            >
              {t.scanner.tryDemo}
            </button>
          </div>
        </div>

        <div id="link" className="mt-6">
          <p className="text-[13px] font-medium text-ink-muted mb-2.5">{t.linkAlt.title}</p>
          <LinkCheckerInline onCheck={onLinkCheck} />
        </div>
      </section>

      <div id="how" />
      <HowItWorks />
    </>
  )
}
