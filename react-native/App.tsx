import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import type { Lang, HistoryItem, ScanResult, ScanType } from './src/types'
import {
  initialHistory,
  computeDashboardStats,
  analyzeUrl,
  analyzeMessage,
  analyzeApk,
} from './src/services/analysisEngine'
import { translations } from './src/i18n/translations'

import { WelcomeScreen } from './src/screens/WelcomeScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { ScanHubScreen } from './src/screens/ScanHubScreen'
import { HistoryScreen } from './src/screens/HistoryScreen'
import { ScanResultScreen } from './src/screens/ScanResultScreen'
import { ScanInputModal } from './src/screens/ScanInputModal'
import { LanguageModal } from './src/components/LanguageModal'
import { TabKey } from './src/components/BottomTabBar'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'dashboard' | 'scanhub' | 'history' | 'result'>('welcome')
  const [previousScreen, setPreviousScreen] = useState<'dashboard' | 'scanhub' | 'history'>('dashboard')
  const [currentLang, setCurrentLang] = useState<Lang>('en')
  const [langModalVisible, setLangModalVisible] = useState(false)

  // Scan input modal state
  const [scanModalVisible, setScanModalVisible] = useState(false)
  const [activeScanType, setActiveScanType] = useState<ScanType | null>(null)

  // History & active scan result
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory)
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null)

  const stats = computeDashboardStats(history)

  // Handlers
  const handleGetStarted = () => {
    setCurrentScreen('dashboard')
  }

  const handleSelectTab = (tab: TabKey) => {
    if (tab === 'home') {
      setCurrentScreen('dashboard')
    } else if (tab === 'scan') {
      setCurrentScreen('scanhub')
    } else if (tab === 'history') {
      setCurrentScreen('history')
    }
  }

  const handleStartScan = (type: ScanType) => {
    setActiveScanType(type)
    setScanModalVisible(true)
  }

  const handleRunScan = (type: ScanType, value: string) => {
    let result: ScanResult
    if (type === 'link') {
      result = analyzeUrl(value, currentLang)
    } else if (type === 'message') {
      result = analyzeMessage(value, currentLang)
    } else {
      result = analyzeApk(value, currentLang)
    }

    // Add to history list at the top
    const newHistoryItem: HistoryItem = {
      id: result.id,
      title: result.target.length > 36 ? result.target.substring(0, 36) + '...' : result.target,
      target: result.target,
      source: result.source,
      type: result.type,
      timeAgo: 'Just now',
      verdict: result.verdict,
      band: result.band,
      score: result.score,
      reasons: result.reasons,
    }

    setHistory((prev) => [newHistoryItem, ...prev])
    setActiveResult(result)
    setPreviousScreen(currentScreen === 'result' ? 'dashboard' : (currentScreen as any))
    setCurrentScreen('result')
  }

  const handleSelectHistoryItem = (item: HistoryItem) => {
    const t = translations[currentLang]
    const levelLabel =
      item.verdict === 'red'
        ? t.highRisk
        : item.verdict === 'yellow'
        ? t.mediumRisk
        : t.lowRisk

    const disclaimer =
      item.verdict === 'green'
        ? t.disclaimerClean
        : t.disclaimerWarning

    const result: ScanResult = {
      id: item.id,
      type: item.type,
      source: item.source,
      target: item.target,
      verdict: item.verdict,
      band: item.band,
      score: item.score,
      levelLabel,
      reasons: item.reasons,
      disclaimer,
      timestamp: item.timeAgo,
    }

    setActiveResult(result)
    setPreviousScreen(currentScreen === 'result' ? 'dashboard' : (currentScreen as any))
    setCurrentScreen('result')
  }

  const handleBackFromResult = () => {
    setCurrentScreen(previousScreen || 'dashboard')
  }

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        {/* Screen Routing */}
        {currentScreen === 'welcome' && (
          <WelcomeScreen onGetStarted={handleGetStarted} lang={currentLang} />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            stats={stats}
            recentActivity={history.slice(0, 4)}
            currentLang={currentLang}
            onOpenLanguage={() => setLangModalVisible(true)}
            onSelectTab={handleSelectTab}
            onSelectHistoryItem={handleSelectHistoryItem}
          />
        )}

        {currentScreen === 'scanhub' && (
          <ScanHubScreen
            currentLang={currentLang}
            onOpenLanguage={() => setLangModalVisible(true)}
            onSelectTab={handleSelectTab}
            onStartScan={handleStartScan}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            history={history}
            currentLang={currentLang}
            onOpenLanguage={() => setLangModalVisible(true)}
            onSelectTab={handleSelectTab}
            onSelectHistoryItem={handleSelectHistoryItem}
          />
        )}

        {currentScreen === 'result' && activeResult && (
          <ScanResultScreen
            result={activeResult}
            currentLang={currentLang}
            onBack={handleBackFromResult}
          />
        )}

        {/* Modals */}
        <LanguageModal
          visible={langModalVisible}
          currentLang={currentLang}
          onSelectLang={setCurrentLang}
          onClose={() => setLangModalVisible(false)}
        />

        <ScanInputModal
          visible={scanModalVisible}
          scanType={activeScanType}
          currentLang={currentLang}
          onClose={() => setScanModalVisible(false)}
          onSubmit={handleRunScan}
        />
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
})
