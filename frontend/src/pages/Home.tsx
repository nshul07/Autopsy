import { ShieldCheck, Link2, QrCode, MessageSquareWarning, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import ScanOptionCard from '../components/ScanOptionCard'
import RiskBadge from '../components/RiskBadge'
import Disclaimer from '../components/Disclaimer'
import type { HistoryEntry } from '../types/contract'

interface HomeProps {
  onNavigateToScan: () => void
  onNavigateToLink: () => void
  onNavigateToQr: () => void
  onNavigateToMessage: () => void
  onNavigateToHistory: () => void
  onOpenReportById: (id: string) => void
  recentScan?: HistoryEntry | null
}

export function Home({
  onNavigateToScan,
  onNavigateToLink,
  onNavigateToQr,
  onNavigateToMessage,
  onNavigateToHistory,
  onOpenReportById,
  recentScan,
}: HomeProps) {
  const { t } = useI18n()

  const whyItems = [
    {
      title: t('home.whyItems.0.title') || 'It compares access to purpose',
      body:
        t('home.whyItems.0.body') ||
        'A flashlight needs a torch, not your messages. We check whether what an app asks for makes sense for what it claims to do.',
    },
    {
      title: t('home.whyItems.1.title') || 'It detects repackaged apps',
      body:
        t('home.whyItems.1.body') ||
        'A copied app can keep a trusted name while being signed by someone else. We check the signature.',
    },
    {
      title: t('home.whyItems.2.title') || 'It tells you what to do next',
      body:
        t('home.whyItems.2.body') ||
        'A score alone does not help. Every result comes with clear steps you can take right now.',
    },
  ]

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <section className="pt-2 pb-1">
        <span className="text-[12.5px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('home.greeting')}
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-ink leading-[1.2] text-balance">
          {t('home.headline')}
        </h1>
        <p className="text-[15px] text-ink-muted leading-relaxed mt-2 max-w-xl">
          {t('home.sub')}
        </p>
      </section>

      {/* Primary Actions Grid */}
      <section className="space-y-3" aria-label="Scan Options">
        {/* 1. Primary Action: Scan APK */}
        <ScanOptionCard
          primary
          icon={<ShieldCheck size={28} strokeWidth={2.2} />}
          title={t('home.actions.apk')}
          description={t('home.actions.apkHint')}
          onClick={onNavigateToScan}
          badge="Primary"
        />

        {/* 2. Check Link */}
        <ScanOptionCard
          icon={<Link2 size={24} strokeWidth={2} />}
          title={t('home.actions.link')}
          description={t('home.actions.linkHint')}
          onClick={onNavigateToLink}
        />

        {/* 3. Scan QR Code */}
        <ScanOptionCard
          icon={<QrCode size={24} strokeWidth={2} />}
          title={t('home.actions.qr')}
          description={t('home.actions.qrHint')}
          onClick={onNavigateToQr}
        />

        {/* 4. Check Message */}
        <ScanOptionCard
          icon={<MessageSquareWarning size={24} strokeWidth={2} />}
          title={t('home.actions.message')}
          description={t('home.actions.messageHint')}
          onClick={onNavigateToMessage}
        />
      </section>

      {/* Recent Scan Card (if exists) */}
      {recentScan && (
        <section className="card p-4 sm:p-5 border-line bg-surface" aria-labelledby="recent-heading">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 id="recent-heading" className="text-[14.5px] font-bold text-ink">
              {t('home.recent')}
            </h2>
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="text-[12.5px] font-semibold text-brand hover:underline"
            >
              {t('home.seeAll')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenReportById(recentScan.id)}
            className="w-full p-3 rounded-xl border border-line bg-sunken/60 hover:bg-sunken flex items-center justify-between gap-3 text-left transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14.5px] font-bold text-ink truncate">
                  {recentScan.title}
                </span>
                <RiskBadge band={recentScan.band} size="sm" />
              </div>
              <p className="text-[12.5px] text-ink-muted mt-0.5 truncate">
                Score: <span className="font-semibold text-ink">{recentScan.score}/100</span>
                {recentScan.subtitle ? ` • ${recentScan.subtitle}` : ''}
              </p>
            </div>
            <ChevronRight size={18} className="text-ink-muted shrink-0" />
          </button>
        </section>
      )}

      {/* Why AppAutopsy Section */}
      <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="why-heading">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-brand shrink-0" />
          <h2 id="why-heading" className="text-[16px] font-bold text-ink tracking-tight">
            {t('home.why')}
          </h2>
        </div>

        <div className="space-y-4">
          {whyItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-brand-soft text-brand font-bold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-ink">{item.title}</h3>
                <p className="text-[13px] text-ink-muted leading-relaxed mt-0.5">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mandatory Disclaimer */}
      <Disclaimer prominent className="mt-4" />
    </div>
  )
}
export default Home
