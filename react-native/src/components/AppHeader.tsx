import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SmallAppLogo, GlobeIcon, ChevronDownIcon } from './Icons'
import type { Lang } from '../types'

interface AppHeaderProps {
  currentLang: Lang
  onOpenLanguage: () => void
}

const langLabels: Record<Lang, string> = {
  en: 'English',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentLang, onOpenLanguage }) => {
  return (
    <View style={styles.header}>
      {/* Brand: Logo + App Name */}
      <View style={styles.brandRow}>
        <SmallAppLogo size={24} />
        <Text style={styles.brandTitle}>AppAutopsy</Text>
      </View>

      {/* Language Trigger */}
      <TouchableOpacity
        style={styles.langPill}
        onPress={onOpenLanguage}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Change language"
      >
        <GlobeIcon size={15} color="#475569" />
        <Text style={styles.langText}>{langLabels[currentLang]}</Text>
        <ChevronDownIcon size={12} color="#64748B" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  langText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginLeft: 4,
    marginRight: 2,
  },
})
