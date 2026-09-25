import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { AppHeader } from '../components/AppHeader'
import { BottomTabBar, TabKey } from '../components/BottomTabBar'
import {
  BlueLinkIcon,
  BlueMessageIcon,
  AndroidIcon,
  ChevronRightIcon,
} from '../components/Icons'
import { translations } from '../i18n/translations'
import type { Lang, ScanType } from '../types'

interface ScanHubScreenProps {
  currentLang: Lang
  onOpenLanguage: () => void
  onSelectTab: (tab: TabKey) => void
  onStartScan: (type: ScanType) => void
}

export const ScanHubScreen: React.FC<ScanHubScreenProps> = ({
  currentLang,
  onOpenLanguage,
  onSelectTab,
  onStartScan,
}) => {
  const t = translations[currentLang]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader currentLang={currentLang} onOpenLanguage={onOpenLanguage} />

      <View style={styles.content}>
        {/* Title & Description */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t.scanTitle}</Text>
          <Text style={styles.subtitle}>{t.scanSub}</Text>
        </View>

        {/* 3 Scan Action Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1: Scan Link */}
          <TouchableOpacity
            style={styles.scanCard}
            onPress={() => onStartScan('link')}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <BlueLinkIcon size={46} />
              <View style={styles.cardTexts}>
                <Text style={styles.cardTitle}>{t.scanLink}</Text>
                <Text style={styles.cardSub}>{t.scanLinkSub}</Text>
              </View>
            </View>
            <ChevronRightIcon size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 2: Scan Message */}
          <TouchableOpacity
            style={styles.scanCard}
            onPress={() => onStartScan('message')}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <BlueMessageIcon size={46} />
              <View style={styles.cardTexts}>
                <Text style={styles.cardTitle}>{t.scanMessage}</Text>
                <Text style={styles.cardSub}>{t.scanMessageSub}</Text>
              </View>
            </View>
            <ChevronRightIcon size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Card 3: Scan APK */}
          <TouchableOpacity
            style={styles.scanCard}
            onPress={() => onStartScan('apk')}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <AndroidIcon size={46} color="#10B981" />
              <View style={styles.cardTexts}>
                <Text style={styles.cardTitle}>{t.scanApk}</Text>
                <Text style={styles.cardSub}>{t.scanApkSub}</Text>
              </View>
            </View>
            <ChevronRightIcon size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Nav */}
      <BottomTabBar activeTab="scan" onSelectTab={onSelectTab} lang={currentLang} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 14,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cardTexts: {
    marginLeft: 14,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
  },
})
