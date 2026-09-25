import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import type { Verdict } from '../types'

interface VerdictBannerProps {
  verdict: Verdict
  levelLabel: string
  score: number
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({
  verdict,
  levelLabel,
  score,
}) => {
  const getBannerStyle = () => {
    switch (verdict) {
      case 'red':
        return {
          backgroundColor: '#DC2626',
          label: 'RED',
        }
      case 'yellow':
        return {
          backgroundColor: '#D97706',
          label: 'YELLOW',
        }
      case 'green':
      default:
        return {
          backgroundColor: '#059669',
          label: 'GREEN',
        }
    }
  }

  const renderIcon = () => {
    switch (verdict) {
      case 'red':
        return (
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="2.2" />
            <Path d="M12 7V13" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <Circle cx="12" cy="16.5" r="1.2" fill="#FFFFFF" />
          </Svg>
        )
      case 'yellow':
        return (
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 3L22 20H2L12 3Z"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <Path d="M12 9V14" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            <Circle cx="12" cy="17" r="1.2" fill="#FFFFFF" />
          </Svg>
        )
      case 'green':
      default:
        return (
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="2.2" />
            <Path
              d="M8 12.5L10.5 15L16 9.5"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )
    }
  }

  const banner = getBannerStyle()

  return (
    <View style={[styles.card, { backgroundColor: banner.backgroundColor }]}>
      <View style={styles.leftCol}>
        <View style={styles.iconWrapper}>{renderIcon()}</View>
        <View style={styles.textContainer}>
          <Text style={styles.verdictTitle}>
            {banner.label} <Text style={styles.slash}>/</Text>{' '}
            <Text style={styles.levelSubtitle}>{levelLabel}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreNumber}>{score}</Text>
        <Text style={styles.scoreOutOf}>/ 100</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  verdictTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  slash: {
    fontWeight: '400',
    opacity: 0.8,
  },
  levelSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreOutOf: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 3,
  },
})
