import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Link2,
  QrCode,
  MessageSquareWarning,
  ChevronRight,
  Sparkles,
  Lock,
  Cpu,
  EyeOff,
  UserX,
  FileCheck,
  Radio,
  FileUp,
  Inbox,
  Mail,
  Send,
} from 'lucide-react'
import { useI18n } from '../i18n'
import { useHistory } from '../hooks/useHistory'
import ScanOptionCard from '../components/ScanOptionCard'
import RiskBadge from '../components/RiskBadge'
import Disclaimer from '../components/Disclaimer'
import type { HistoryEntry, MockScenario } from '../types/contract'
import { formatTimeAgo } from '../lib/format'

interface HomeProps {
  onNavigateToScan: () => void
  onNavigateToLink: () => void
  onNavigateToQr: () => void
  onNavigateToMessage: () => void
  onNavigateToHistory: () => void
  onOpenReportById: (id: string) => void
  onSelectMockScenario?: (scenario: MockScenario) => void
  recentScan?: HistoryEntry | null
}

export function Home({
  onNavigateToScan,
  onNavigateToLink,
  onNavigateToQr,
  onNavigateToMessage,
  onNavigateToHistory,
  onOpenReportById,
  onSelectMockScenario,
}: HomeProps) {
  const { t } = useI18n()
  const { history, stats } = useHistory()

  const recentItems = history.slice(0, 4)

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'link':
        return Link2
      case 'sms':
        return MessageSquareWarning
      case 'email':
        return Mail
      case 'manual':
      default:
        return FileUp
    }
  }

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'link':
        return t('dashboard.sources.link') || 'Link'
      case 'sms':
        return t('dashboard.sources.sms') || 'SMS'
      case 'email':
        return t('dashboard.sources.email') || 'Email'
      case 'manual':
      default:
        return t('dashboard.sources.manual') || 'Manual'
    }
  }

  return (
    <div className="container-page py-5 sm:py-6 space-y-6 animate-fade-in">
      {/* 1. Cybersecurity Status Bar */}
      <section className="flex flex-wrap items-center justify-between gap-2.5 p-3 px-4 rounded-xl border border-line bg-surface shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[12.5px] font-semibold text-ink">
            On-Device Engine: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Active</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold text-ink-muted">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sunken border border-line">
            <Cpu size={12} className="text-brand" />
            On-Device
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sunken border border-line">
            <UserX size={12} className="text-brand" />
            No Accounts
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sunken border border-line">
            <EyeOff size={12} className="text-brand" />
            Zero Telemetry
          </span>
        </div>
      </section>

      {/* 2. Hero Headline */}
      <section className="pt-1">
        <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('home.greeting')}
        </span>
        <h1 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-ink leading-[1.25]">
          {t('home.headline')}
        </h1>
        <p className="text-[14.5px] text-ink-muted leading-relaxed mt-2 max-w-xl">
          {t('home.sub')}
        </p>
      </section>

      {/* 3. Dashboard Metrics (Real Data Only - Never Invented) */}
      <section className="card p-5 sm:p-6 border-line bg-surface space-y-4" aria-label="Security Dashboard">
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-brand" />
            <h2 className="text-[15px] sm:text-[16px] font-bold text-ink tracking-tight">
              {t('dashboard.title') || 'Security Dashboard'}
            </h2>
          </div>
          <span className="text-[11.5px] font-mono text-ink-muted">
            Local SQLite Store
          </span>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Checked */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-line bg-sunken/40">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-ink-muted block truncate">
              {t('dashboard.totalChecked') || 'Total Checked'}
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[28px] font-bold font-mono text-ink leading-none tabular-nums">
                {stats.total}
              </span>
            </div>
            <span className="text-[11px] text-ink-faint mt-1 block">
              Cumulative checks
            </span>
          </div>

          {/* Flagged RED */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-risk-high-border/70 bg-risk-high-bg/30">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-risk-high-text block truncate">
                {t('dashboard.flaggedRed') || 'Flagged RED'}
              </span>
              <ShieldAlert size={14} className="text-risk-high-text shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[28px] font-bold font-mono text-risk-high-text leading-none tabular-nums">
                {stats.red}
              </span>
            </div>
            <span className="text-[11px] text-risk-high-text/80 mt-1 block font-medium">
              High risk verdicts
            </span>
          </div>

          {/* Warned YELLOW */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-risk-medium-border/70 bg-risk-medium-bg/30">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-risk-medium-text block truncate">
                {t('dashboard.warnedYellow') || 'Warned YELLOW'}
              </span>
              <AlertTriangle size={14} className="text-risk-medium-text shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[28px] font-bold font-mono text-risk-medium-text leading-none tabular-nums">
                {stats.yellow}
              </span>
            </div>
            <span className="text-[11px] text-risk-medium-text/80 mt-1 block font-medium">
              Review carefully
            </span>
          </div>

          {/* Looked Clean */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-risk-low-border/70 bg-risk-low-bg/30">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-risk-low-text block truncate">
                {t('dashboard.lookedClean') || 'Looked Clean'}
              </span>
              <ShieldCheck size={14} className="text-risk-low-text shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[26px] sm:text-[28px] font-bold font-mono text-risk-low-text leading-none tabular-nums">
                {stats.green}
              </span>
            </div>
            <span className="text-[11px] text-risk-low-text/80 mt-1 block font-medium">
              Static checks passed
            </span>
          </div>
        </div>

        {/* Source Attribution Breakdown */}
        <div className="pt-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-ink-muted">
              {t('dashboard.sourceAttribution') || 'Source Attribution'}
            </span>
            <span className="text-[11.5px] text-ink-muted">
              Origin distribution
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg border border-line bg-sunken/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link2 size={14} className="text-brand shrink-0" />
                <span className="text-[12.5px] font-medium text-ink truncate">Link</span>
              </div>
              <span className="text-[13px] font-bold font-mono text-ink ml-1 tabular-nums">
                {stats.sources.link}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-line bg-sunken/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <MessageSquareWarning size={14} className="text-brand shrink-0" />
                <span className="text-[12.5px] font-medium text-ink truncate">SMS</span>
              </div>
              <span className="text-[13px] font-bold font-mono text-ink ml-1 tabular-nums">
                {stats.sources.sms}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-line bg-sunken/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail size={14} className="text-brand shrink-0" />
                <span className="text-[12.5px] font-medium text-ink truncate">Email</span>
              </div>
              <span className="text-[13px] font-bold font-mono text-ink ml-1 tabular-nums">
                {stats.sources.email}
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-line bg-sunken/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileUp size={14} className="text-brand shrink-0" />
                <span className="text-[12.5px] font-medium text-ink truncate">Manual</span>
              </div>
              <span className="text-[13px] font-bold font-mono text-ink ml-1 tabular-nums">
                {stats.sources.manual}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Static Disclaimer Notice */}
        <div className="text-[11.5px] text-ink-muted border-t border-line/60 pt-2.5 leading-snug">
          * {t('dashboard.cleanDisclaimer') || 'A clean result indicates no suspicious patterns were detected in static checks. This does not guarantee safety.'}
        </div>
      </section>

      {/* 4. Recent Activity (Existing Data Only - Never Invented) */}
      <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="activity-heading">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-brand" />
            <h2 id="activity-heading" className="text-[15px] sm:text-[16px] font-bold text-ink tracking-tight">
              {t('dashboard.recentActivity') || 'Recent Activity'}
            </h2>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="text-[12.5px] font-semibold text-brand hover:underline"
            >
              {t('home.seeAll')} ({history.length})
            </button>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-line bg-sunken/20 text-center space-y-3">
            <Inbox size={28} className="mx-auto text-ink-faint" />
            <div>
              <p className="text-[13.5px] font-bold text-ink">
                {t('dashboard.noActivity') || 'No inspections recorded yet'}
              </p>
              <p className="text-[12.5px] text-ink-muted mt-0.5">
                {t('dashboard.noActivityHint') || 'Start by inspecting an APK file, web link, or message below.'}
              </p>
            </div>

            {onSelectMockScenario && (
              <div className="pt-2">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-ink-muted block mb-2">
                  Test sample scenarios:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectMockScenario('low')}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-risk-low-border bg-risk-low-bg/40 text-risk-low-text hover:bg-risk-low-bg transition-colors"
                  >
                    Calculator (Low Risk)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMockScenario('medium')}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-risk-medium-border bg-risk-medium-bg/40 text-risk-medium-text hover:bg-risk-medium-bg transition-colors"
                  >
                    Clean Master (Medium Risk)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMockScenario('high')}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-lg border border-risk-high-border bg-risk-high-bg/40 text-risk-high-text hover:bg-risk-high-bg transition-colors"
                  >
                    Flashlight Pro (Repackaged / Red)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {recentItems.map((item) => {
              const SourceIcon = getSourceIcon(item.source)
              const sourceLabel = getSourceLabel(item.source)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenReportById(item.id)}
                  className="w-full p-3 sm:p-3.5 rounded-xl border border-line bg-sunken/40 hover:bg-sunken flex items-center justify-between gap-3 text-left transition-colors active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-line text-brand flex items-center justify-center shrink-0">
                      <SourceIcon size={16} strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-ink truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-line text-ink-muted">
                          {sourceLabel}
                        </span>
                        <RiskBadge band={item.band} size="sm" />
                      </div>
                      <p className="text-[12px] text-ink-muted truncate mt-0.5">
                        Score: <span className="font-semibold text-ink">{item.score}/100</span>
                        {item.subtitle ? ` • ${item.subtitle}` : ''}
                        {item.createdAt ? ` • ${formatTimeAgo(item.createdAt)}` : ''}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-ink-muted shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* 5. Core Inspection Triggers */}
      <section className="space-y-3" aria-label="Inspection Options">
        <h2 className="text-[14px] font-bold text-ink-muted uppercase tracking-wider px-1">
          {t('home.primaryAction') || 'Inspection Tools'}
        </h2>

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

      {/* 6. On-Device Privacy Architecture Card */}
      <section className="card p-5 sm:p-6 border-line bg-surface" aria-labelledby="privacy-model-heading">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={18} className="text-brand shrink-0" />
          <h2 id="privacy-model-heading" className="text-[16px] font-bold text-ink tracking-tight">
            {t('privacy.title') || 'On-Device Privacy Model'}
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 ml-auto">
            Verified Offline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          <div className="p-3 rounded-xl border border-line bg-sunken/30">
            <h3 className="font-bold text-ink flex items-center gap-1.5">
              <Cpu size={14} className="text-brand" />
              {t('privacy.point1Title') || 'Analysis happens on-device'}
            </h3>
            <p className="text-ink-muted text-[12.5px] mt-1 leading-relaxed">
              {t('privacy.point1Desc') || 'Static decompilation, pattern detection, and permission baseline comparisons are evaluated locally.'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-line bg-sunken/30">
            <h3 className="font-bold text-ink flex items-center gap-1.5">
              <UserX size={14} className="text-brand" />
              {t('privacy.point2Title') || 'No user accounts'}
            </h3>
            <p className="text-ink-muted text-[12.5px] mt-1 leading-relaxed">
              {t('privacy.point2Desc') || 'No login, email, phone number, or credentials are required or requested.'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-line bg-sunken/30">
            <h3 className="font-bold text-ink flex items-center gap-1.5">
              <EyeOff size={14} className="text-brand" />
              {t('privacy.point3Title') || 'No telemetry or tracking'}
            </h3>
            <p className="text-ink-muted text-[12.5px] mt-1 leading-relaxed">
              {t('privacy.point3Desc') || 'Zero analytics, behavioral beacons, third-party trackers, or advertising SDKs.'}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-line bg-sunken/30">
            <h3 className="font-bold text-ink flex items-center gap-1.5">
              <Lock size={14} className="text-brand" />
              {t('privacy.point4Title') || 'User data is never transmitted'}
            </h3>
            <p className="text-ink-muted text-[12.5px] mt-1 leading-relaxed">
              {t('privacy.point4Desc') || 'APK bytes, checked URLs, and suspicious message texts never leave your device.'}
            </p>
          </div>
        </div>
      </section>

      {/* 7. Mandatory Disclaimer */}
      <Disclaimer prominent className="mt-2" />
    </div>
  )
}

export default Home
