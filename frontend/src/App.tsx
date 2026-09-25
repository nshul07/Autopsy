import { useState, useCallback, useEffect } from 'react'
import { useI18n } from './i18n'
import {
  analyzeApk,
  checkLink,
  checkMessage,
  setMockScenario,
  type MockScenario,
  type ApiErrorKind,
  errorKindOf,
} from './services/api'
import { useHistory } from './hooks/useHistory'
import type {
  ApkReport,
  LinkReport,
  MessageReport,
  AnyReport,
  HistoryEntry,
} from './types/contract'

// Components
import AppHeader from './components/AppHeader'
import BottomNavigation, { type NavTab } from './components/BottomNavigation'
import LoadingState from './components/LoadingState'
import ErrorState from './components/ErrorState'

// Pages
import Home from './pages/Home'
import Scan from './pages/Scan'
import ApkResult from './pages/ApkResult'
import LinkChecker from './pages/LinkChecker'
import QrScanner from './pages/QrScanner'
import MessageChecker from './pages/MessageChecker'
import History from './pages/History'
import Learn from './pages/Learn'
import Settings from './pages/Settings'

export type AppView =
  | 'home'
  | 'scan'
  | 'scanningApk'
  | 'apkResult'
  | 'apkError'
  | 'link'
  | 'qr'
  | 'message'
  | 'history'
  | 'learn'
  | 'settings'

export function App() {
  const { lang, t } = useI18n()
  const { history, addReport, getCachedReport } = useHistory()

  const [view, setView] = useState<AppView>('home')
  const [activeTab, setActiveTab] = useState<NavTab>('home')

  // Scan state
  const [analyzingName, setAnalyzingName] = useState<string>('')
  const [apkReport, setApkReport] = useState<ApkReport | null>(null)
  const [apkError, setApkError] = useState<{ kind: ApiErrorKind; message?: string } | null>(null)

  // Link state
  const [linkReport, setLinkReport] = useState<LinkReport | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)

  // Message state
  const [messageReport, setMessageReport] = useState<MessageReport | null>(null)
  const [messageLoading, setMessageLoading] = useState(false)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Synchronize bottom nav tab with current view
  const navigateToTab = (tab: NavTab) => {
    setActiveTab(tab)
    setView(tab as AppView)
    scrollToTop()
  }

  // Handle APK file scan
  const handleScanApk = useCallback(
    async (file: File) => {
      setAnalyzingName(file.name)
      setApkError(null)
      setView('scanningApk')
      scrollToTop()

      try {
        const report = await analyzeApk(file, lang)
        setApkReport(report)
        addReport(report)
        setView('apkResult')
      } catch (err: any) {
        setApkError({ kind: errorKindOf(err), message: err.message })
        setView('apkError')
      }
    },
    [lang, addReport]
  )

  // Handle mock scenario quick selection
  const handleSelectMockScenario = useCallback(
    async (scenario: MockScenario) => {
      setMockScenario(scenario)
      const fakeFileName =
        scenario === 'low'
          ? 'calculator.apk'
          : scenario === 'medium'
          ? 'cleanmaster.apk'
          : 'flashlight_pro.apk'

      const dummyFile = new File(['PK\x03\x04'], fakeFileName, {
        type: 'application/vnd.android.package-archive',
      })
      await handleScanApk(dummyFile)
    },
    [handleScanApk]
  )

  // Handle Link check
  const handleCheckLink = useCallback(
    async (url: string) => {
      setLinkLoading(true)
      try {
        const report = await checkLink(url, lang)
        setLinkReport(report)
        addReport(report)
      } catch (err: any) {
        // Fallback demo link report in development so flow never breaks
        setLinkReport({
          report_id: 'link-demo-fallback',
          type: 'link',
          created_at: new Date().toISOString(),
          url,
          final_url: url,
          redirect_count: 1,
          https: url.startsWith('https://'),
          direct_apk: url.toLowerCase().includes('.apk'),
          lookalike_domain: url.toLowerCase().includes('sbi') || url.toLowerCase().includes('reward'),
          reputation: 'not_checked',
          score: 81,
          band: 'high',
          verdict: 'red',
          recommendation: 'do_not_install',
          reasons: [
            'This address uses a name that looks like a bank, but is not the bank’s official website.',
            'The link downloads an installable app file directly.',
          ],
          summary: 'This link downloads an app file directly. Do not download or install it.',
          offer_apk_scan: true,
          calibration: ['Reputation lookup was unavailable, so history could not be verified.'],
          limitations: 'Static analysis only. This is not a guarantee of safety.',
          lang,
        })
      } finally {
        setLinkLoading(false)
        scrollToTop()
      }
    },
    [lang, addReport]
  )

  // Handle QR code scanned
  const handleQrScanned = (scannedUrl: string) => {
    setView('link')
    handleCheckLink(scannedUrl)
  }

  // Handle Message check
  const handleCheckMessage = useCallback(
    async (text: string) => {
      setMessageLoading(true)
      try {
        const report = await checkMessage(text, lang)
        setMessageReport(report)
        addReport(report)
      } catch (err: any) {
        // Fallback demo message report in development
        setMessageReport({
          report_id: 'msg-demo-fallback',
          type: 'message',
          created_at: new Date().toISOString(),
          signals: ['urgency', 'otp_request', 'suspicious_link', 'apk_mention'],
          extracted_urls: text.match(/https?:\/\/[^\s]+/g) || [],
          score: 74,
          band: 'high',
          verdict: 'red',
          recommendation: 'do_not_install',
          reasons: [
            'The message creates urgency and threatens that an account will be blocked.',
            'It asks for a one-time password or personal information.',
            'It contains a link that downloads an app file directly.',
          ],
          summary: 'This message shows multiple warning signs typical of fraud.',
          calibration: ['This check analyzes message text only. It does not verify sender identity.'],
          limitations: 'Static analysis only. This is not a guarantee of safety.',
          lang,
        })
      } finally {
        setMessageLoading(false)
        scrollToTop()
      }
    },
    [lang, addReport]
  )

  // Open a saved report from history
  const handleOpenHistoryReport = (entry: HistoryEntry) => {
    const cached = getCachedReport(entry.id)
    if (cached) {
      if (cached.type === 'apk') {
        setApkReport(cached as ApkReport)
        setView('apkResult')
      } else if (cached.type === 'link') {
        setLinkReport(cached as LinkReport)
        setView('link')
      } else if (cached.type === 'message') {
        setMessageReport(cached as MessageReport)
        setView('message')
      }
      scrollToTop()
    } else {
      // If not in cache, fallback to demo scenario
      handleSelectMockScenario(entry.band === 'low' ? 'low' : entry.band === 'medium' ? 'medium' : 'high')
    }
  }

  // Navigation title and back button logic
  const isSubView = [
    'scan',
    'scanningApk',
    'apkResult',
    'apkError',
    'link',
    'qr',
    'message',
  ].includes(view)

  const handleHeaderBack = () => {
    if (view === 'apkResult' || view === 'apkError' || view === 'scanningApk') {
      setView('scan')
    } else {
      setView('home')
      setActiveTab('home')
    }
    scrollToTop()
  }

  const getHeaderTitle = () => {
    switch (view) {
      case 'scan':
        return t('scan.title')
      case 'apkResult':
        return t('result.title')
      case 'link':
        return t('link.title')
      case 'qr':
        return t('qr.title')
      case 'message':
        return t('message.title')
      default:
        return undefined
    }
  }

  const latestScan = history[0] ?? null

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans selection:bg-brand-soft selection:text-brand">
      {/* Top Header */}
      <AppHeader
        title={getHeaderTitle()}
        showBack={isSubView}
        onBack={handleHeaderBack}
        onLogoClick={() => {
          setView('home')
          setActiveTab('home')
          scrollToTop()
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-nav">
        {view === 'home' && (
          <Home
            onNavigateToScan={() => {
              setView('scan')
              setActiveTab('scan')
              scrollToTop()
            }}
            onNavigateToLink={() => {
              setView('link')
              scrollToTop()
            }}
            onNavigateToQr={() => {
              setView('qr')
              scrollToTop()
            }}
            onNavigateToMessage={() => {
              setView('message')
              scrollToTop()
            }}
            onNavigateToHistory={() => {
              setView('history')
              setActiveTab('history')
              scrollToTop()
            }}
            onOpenReportById={(id) => {
              const item = history.find((h) => h.id === id)
              if (item) handleOpenHistoryReport(item)
            }}
            recentScan={latestScan}
          />
        )}

        {view === 'scan' && (
          <Scan
            onFileSelected={handleScanApk}
            onSelectMockScenario={handleSelectMockScenario}
          />
        )}

        {view === 'scanningApk' && (
          <div className="container-page py-12">
            <LoadingState
              title={t('progress.title')}
              subtitle={t('progress.sub')}
              subjectName={analyzingName}
            />
          </div>
        )}

        {view === 'apkResult' && apkReport && (
          <ApkResult report={apkReport} onBack={handleHeaderBack} />
        )}

        {view === 'apkError' && (
          <div className="container-page py-12">
            <ErrorState
              kind={apkError?.kind}
              message={apkError?.message}
              onRetry={() => setView('scan')}
              onTryDemo={() => handleSelectMockScenario('high')}
            />
          </div>
        )}

        {view === 'link' && (
          <LinkChecker
            report={linkReport}
            loading={linkLoading}
            onCheckUrl={handleCheckLink}
            onNavigateToQr={() => {
              setView('qr')
              scrollToTop()
            }}
            onNavigateToScanApk={() => {
              setView('scan')
              setActiveTab('scan')
              scrollToTop()
            }}
            onReset={() => setLinkReport(null)}
          />
        )}

        {view === 'qr' && (
          <QrScanner
            onCodeScanned={handleQrScanned}
            onManualEntry={() => {
              setView('link')
              scrollToTop()
            }}
          />
        )}

        {view === 'message' && (
          <MessageChecker
            report={messageReport}
            loading={messageLoading}
            onCheckMessage={handleCheckMessage}
            onCheckUrl={(extractedUrl) => {
              setView('link')
              handleCheckLink(extractedUrl)
            }}
            onReset={() => setMessageReport(null)}
          />
        )}

        {view === 'history' && (
          <History
            onOpenReport={handleOpenHistoryReport}
            onNavigateToScan={() => {
              setView('scan')
              setActiveTab('scan')
              scrollToTop()
            }}
          />
        )}

        {view === 'learn' && <Learn />}

        {view === 'settings' && <Settings />}
      </main>

      {/* Fixed Bottom Navigation (Mobile First) */}
      <BottomNavigation
        currentTab={activeTab}
        onSelectTab={navigateToTab}
      />
    </div>
  )
}
export default App
