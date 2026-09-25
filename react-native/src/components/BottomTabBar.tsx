import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { HomeNavIcon, ScanNavIcon, HistoryNavIcon } from './Icons'
import { translations } from '../i18n/translations'
import type { Lang } from '../types'

export type TabKey = 'home' | 'scan' | 'history'

interface BottomTabBarProps {
  activeTab: TabKey
  onSelectTab: (tab: TabKey) => void
  lang: Lang
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelectTab, lang }) => {
  const t = translations[lang]

  return (
    <View style={styles.container}>
      {/* Home Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('home')}
        activeOpacity={0.7}
      >
        <HomeNavIcon active={activeTab === 'home'} />
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
          {t.home}
        </Text>
      </TouchableOpacity>

      {/* Scan Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('scan')}
        activeOpacity={0.7}
      >
        <ScanNavIcon active={activeTab === 'scan'} />
        <Text style={[styles.tabLabel, activeTab === 'scan' && styles.tabLabelActive]}>
          {t.scan}
        </Text>
      </TouchableOpacity>

      {/* History Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => onSelectTab('history')}
        activeOpacity={0.7}
      >
        <HistoryNavIcon active={activeTab === 'history'} />
        <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
          {t.history}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
})
