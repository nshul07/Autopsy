import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { AppLogoIcon, WifiOffIcon, UserIcon, ShieldCheckIcon } from '../components/Icons'
import { translations } from '../i18n/translations'
import type { Lang } from '../types'

interface WelcomeScreenProps {
  onGetStarted: () => void
  lang: Lang
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, lang }) => {
  const t = translations[lang]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Main Content Area */}
      <View style={styles.centerSection}>
        {/* Glow Logo */}
        <View style={styles.logoWrapper}>
          <AppLogoIcon size={84} glow={true} />
        </View>

        {/* Title & Tagline */}
        <Text style={styles.appName}>{t.appName}</Text>
        <Text style={styles.tagline}>{t.tagline}</Text>

        {/* 3 Privacy Pillars */}
        <View style={styles.pillarsContainer}>
          <View style={styles.pillarItem}>
            <View style={styles.pillarIconCircle}>
              <WifiOffIcon size={18} color="#38BDF8" />
            </View>
            <Text style={styles.pillarText}>{t.noCloud}</Text>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarIconCircle}>
              <UserIcon size={18} color="#38BDF8" />
            </View>
            <Text style={styles.pillarText}>{t.noAccounts}</Text>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarIconCircle}>
              <ShieldCheckIcon size={18} color="#38BDF8" />
            </View>
            <Text style={styles.pillarText}>{t.noTelemetry}</Text>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={onGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.getStartedText}>{t.getStarted}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 36,
  },
  pillarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillarIconCircle: {
    marginRight: 6,
  },
  pillarText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  bottomSection: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  getStartedBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})
