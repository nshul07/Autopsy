import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import type { Lang, HistoryItem, Verdict } from '../types'

interface HistoryScreenProps {
  history: HistoryItem[]
  currentLang: Lang
  onOpenLanguage: () => void
  onSelectTab: (tab: TabKey) => void
  onSelectHistoryItem: (item: HistoryItem) => void
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  currentLang,
  onOpenLanguage,
  onSelectTab,
  onSelectHistoryItem,
}) => {
  const [filter, setFilter] = useState<'all' | Verdict>('all')
  const t = translations[currentLang]

  const filtered = history.filter((item) => {
    if (filter === 'all') return true
    return item.verdict === filter
  })

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppHeader currentLang={currentLang} onOpenLanguage={onOpenLanguage} />

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>{t.history}</Text>
          <Text style={styles.screenSubtitle}>On-device scan logs (stored locally)</Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              All ({history.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'red' && styles.filterChipActiveRed]}
            onPress={() => setFilter('red')}
          >
            <Text style={[styles.filterChipText, filter === 'red' && styles.filterChipTextRed]}>
              Red ({history.filter((h) => h.verdict === 'red').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'yellow' && styles.filterChipActiveYellow]}
            onPress={() => setFilter('yellow')}
          >
            <Text style={[styles.filterChipText, filter === 'yellow' && styles.filterChipTextYellow]}>
              Yellow ({history.filter((h) => h.verdict === 'yellow').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'green' && styles.filterChipActiveGreen]}
            onPress={() => setFilter('green')}
          >
            <Text style={[styles.filterChipText, filter === 'green' && styles.filterChipTextGreen]}>
              Clean ({history.filter((h) => h.verdict === 'green').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of items */}
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.listCard}>
            {filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No scans found for this filter.</Text>
              </View>
            ) : (
              filtered.map((item) => (
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
                        {item.source.toUpperCase()} • {item.timeAgo}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activityRight}>
                    {renderVerdictBadge(item.verdict)}
                    <ChevronRightIcon size={16} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Bottom Nav */}
      <BottomTabBar activeTab="history" onSelectTab={onSelectTab} lang={currentLang} />
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
    paddingTop: 16,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipActiveRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  filterChipActiveYellow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  filterChipActiveGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipTextRed: {
    color: '#DC2626',
  },
  filterChipTextYellow: {
    color: '#D97706',
  },
  filterChipTextGreen: {
    color: '#059669',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  listCard: {
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
})
