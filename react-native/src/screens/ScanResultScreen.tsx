import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Share,
} from 'react-native'
import {
  BackArrowIcon,
  ShareIcon,
  BuildingIcon,
  GlobeIcon,
  SearchIcon,
  ShieldLockIcon,
  RefreshIcon,
  GreenCheckIcon,
  InfoCircleIcon,
  YellowWarningIcon,
} from '../components/Icons'
import { VerdictBanner } from '../components/VerdictBanner'
import { translations } from '../i18n/translations'
import type { Lang, ScanResult } from '../types'

interface ScanResultScreenProps {
  result: ScanResult
  currentLang: Lang
  onBack: () => void
}

export const ScanResultScreen: React.FC<ScanResultScreenProps> = ({
  result,
  currentLang,
  onBack,
}) => {
  const t = translations[currentLang]

  const handleShare = async () => {
    try {
      await Share.share({
        message: `AppAutopsy Scan Result: ${result.target}\nVerdict: ${result.verdict.toUpperCase()} (${result.levelLabel})\nRisk Score: ${result.score}/100\nOffline On-Device Phishing Guard.`,
      })
    } catch {
      // ignore
    }
  }

  const renderReasonIcon = (iconType: string) => {
    switch (iconType) {
      case 'building':
        return <BuildingIcon size={20} color="#64748B" />
      case 'globe':
        return <GlobeIcon size={20} color="#64748B" />
      case 'search':
        return <SearchIcon size={20} color="#64748B" />
      case 'shield':
        return <ShieldLockIcon size={20} color="#64748B" />
      case 'refresh':
        return <RefreshIcon size={20} color="#64748B" />
      case 'check':
        return <GreenCheckIcon size={20} />
      case 'alert':
      default:
        return <YellowWarningIcon size={20} />
    }
  }

  const getTargetLabel = () => {
    switch (result.type) {
      case 'apk':
        return t.scannedFile
      case 'message':
        return t.scannedMessage
      case 'link':
      default:
        return t.scannedLink
    }
  }

  const isGreen = result.verdict === 'green'

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <BackArrowIcon size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t.scanResult}</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityLabel="Share result"
        >
          <ShareIcon size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* 1. Verdict Banner */}
        <VerdictBanner
          verdict={result.verdict}
          levelLabel={result.levelLabel}
          score={result.score}
        />

        {/* 2. Scanned Target Card */}
        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>{getTargetLabel()}</Text>
          <Text style={styles.targetValue} selectable>
            {result.target}
          </Text>
        </View>

        {/* 3. Reasons Section */}
        <View style={styles.reasonsContainer}>
          <Text style={styles.reasonsTitle}>{t.whyFlagged}</Text>

          <View style={styles.reasonsList}>
            {result.reasons.map((item, index) => (
              <View key={index} style={styles.reasonRow}>
                <View style={styles.reasonIconCol}>
                  {renderReasonIcon(item.iconType)}
                </View>
                <Text style={styles.reasonText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Disclaimer Note Banner */}
        <View style={[styles.disclaimerCard, isGreen ? styles.disclaimerGreen : styles.disclaimerWarning]}>
          <View style={styles.disclaimerIcon}>
            <InfoCircleIcon size={18} color={isGreen ? '#0284C7' : '#DC2626'} />
          </View>
          <Text style={[styles.disclaimerText, isGreen ? styles.disclaimerTextGreen : styles.disclaimerTextWarning]}>
            {result.disclaimer}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  targetValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
  },
  reasonsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  reasonsList: {
    gap: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reasonIconCol: {
    width: 28,
    marginRight: 10,
    marginTop: 1,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  disclaimerWarning: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disclaimerGreen: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  disclaimerTextWarning: {
    color: '#991B1B',
  },
  disclaimerTextGreen: {
    color: '#0369A1',
  },
})
