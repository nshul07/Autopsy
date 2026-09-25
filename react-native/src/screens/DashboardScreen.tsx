import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import {
  DocumentIcon,
  RedExclamationIcon,
  YellowWarningIcon,
  GreenCheckIcon,
  BlueLinkIcon,
  BlueMessageIcon,
  AndroidIcon,
  ChevronRightIcon,
} from '../components/Icons'
import { AppHeader } from '../components/AppHeader'
import { BottomTabBar, TabKey } from '../components/BottomTabBar'
import { translations } from '../i18n/translations'
import type { Lang, HistoryItem, DashboardStats } from '../types'

interface DashboardScreenProps {
  stats: DashboardStats
  recentActivity: HistoryItem[]
  currentLang: Lang
  onOpenLanguage: () => void
  onSelectTab: (tab: TabKey) => void
  onSelectHistoryItem: (item: HistoryItem) => void
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  stats,
  recentActivity,
  currentLang,
  onOpenLanguage,
  onSelectTab,
  onSelectHistoryItem,
}) => {
  const t = translations[currentLang]

  const renderSourceIcon = (source: string, type: string) => {
    if (type === 'apk') {
      return <AndroidIcon size={38} color="#10B981" />
    }
    if (source === 'sms' || type === 'message') {
      return <BlueMessageIcon size={38} />
    }
    return <BlueLinkIcon size={38} />
  }

  const renderVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'red':
        return (
          <View style={[styles.verdictBadge, styles.badgeRed]}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        )
      case 'yellow':
        return (
          <View style={[styles.verdictBadge, styles.badgeYellow]}>
            <Text style={styles.badgeText}>⚠</Text>
          </View>
        )
      case 'green':
      default:
        return (
          <View style={[styles.verdictBadge, styles.badgeGreen]}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
        )
    }
  }

  const formatSourceLabel = (source: string) => {
    switch (source) {
      case 'sms':
        return 'SMS'
      case 'email':
        return 'Email'
      case 'manual':
        return 'Manual'
      case 'link':
      default:
        return 'Link'
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader currentLang={currentLang} onOpenLanguage={onOpenLanguage} />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Checked */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <DocumentIcon size={20} />
            </View>
            <Text style={styles.statLabel}>{t.totalChecked}</Text>
          </View>

          {/* Flagged Red */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{stats.flaggedRed}</Text>
              <RedExclamationIcon size={22} />
            </View>
            <Text style={styles.statLabel}>{t.flaggedRed}</Text>
          </View>

          {/* Warned Yellow */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{stats.warnedYellow}</Text>
              <YellowWarningIcon size={22} />
            </View>
            <Text style={styles.statLabel}>{t.warnedYellow}</Text>
          </View>

          {/* Looked Clean */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statNumber}>{stats.lookedClean}</Text>
              <GreenCheckIcon size={22} />
            </View>
            <Text style={styles.statLabel}>{t.lookedClean}</Text>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
        </View>

        <View style={styles.activityList}>
          {recentActivity.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.activityRow}
              onPress={() => onSelectHistoryItem(item)}
              activeOpacity={0.7}
            >
              <View style={styles.activityLeft}>
                {renderSourceIcon(item.source, item.type)}
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle} numberOfLines={1} ellipsizeMode="tail">
                    {item.title}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {formatSourceLabel(item.source)} • {item.timeAgo}
                  </Text>
                </View>
              </View>

              <View style={styles.activityRight}>
                {renderVerdictBadge(item.verdict)}
                <ChevronRightIcon size={16} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomTabBar activeTab="home" onSelectTab={onSelectTab} lang={currentLang} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  activityDetails: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  activityMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  activityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verdictBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRed: {
    backgroundColor: '#EF4444',
  },
  badgeYellow: {
    backgroundColor: '#F59E0B',
  },
  badgeGreen: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
})
