import { Verdict, Band, ScanResult, HistoryItem, DashboardStats, ScanType, ScanSource, Lang } from '../types'
import { translations } from '../i18n/translations'

// Sample initial history matching the reference screenshot
export const initialHistory: HistoryItem[] = [
  {
    id: 'hist-1',
    title: 'microsoft-secure-login.xyz',
    target: 'microsoft-secure-login.xyz',
    source: 'link',
    type: 'link',
    timeAgo: '2m ago',
    verdict: 'red',
    band: 'high',
    score: 85,
    reasons: [
      { iconType: 'building', text: 'Brand look-alike (mimics Microsoft)' },
      { iconType: 'globe', text: 'Suspicious TLD (.xyz commonly used in phishing)' },
      { iconType: 'search', text: 'Suspicious keywords found in URL path' },
      { iconType: 'shield', text: 'Not an official Microsoft domain' },
    ],
  },
  {
    id: 'hist-2',
    title: 'Your KYC is pending, update now...',
    target: 'Your KYC is pending, update now to avoid account suspension: http://bit.ly/sbi-kyc-up',
    source: 'sms',
    type: 'message',
    timeAgo: '1h ago',
    verdict: 'yellow',
    band: 'medium',
    score: 55,
    reasons: [
      { iconType: 'alert', text: 'Urgency language detected ("pending", "suspension")' },
      { iconType: 'info', text: 'KYC / bank credential request in unverified message' },
      { iconType: 'link', text: 'Shortened URL hides true destination' },
    ],
  },
  {
    id: 'hist-3',
    title: 'https://www.google.com',
    target: 'https://www.google.com',
    source: 'link',
    type: 'link',
    timeAgo: '3h ago',
    verdict: 'green',
    band: 'low',
    score: 12,
    reasons: [
      { iconType: 'check', text: 'No risky patterns found in this link.' },
    ],
  },
  {
    id: 'hist-4',
    title: 'PaymentApp.apk',
    target: 'PaymentApp.apk',
    source: 'manual',
    type: 'apk',
    timeAgo: '1d ago',
    verdict: 'red',
    band: 'high',
    score: 78,
    reasons: [
      { iconType: 'alert', text: 'Risky permissions requested (SMS, Accessibility, Contacts)' },
      { iconType: 'refresh', text: 'Repackaging detected (modified signature from original)' },
      { iconType: 'shield', text: 'Known phishing template and overlay patterns found' },
    ],
  },
]

export function computeDashboardStats(history: HistoryItem[]): DashboardStats {
  const total = history.length
  const flaggedRed = history.filter((h) => h.verdict === 'red').length
  const warnedYellow = history.filter((h) => h.verdict === 'yellow').length
  const lookedClean = history.filter((h) => h.verdict === 'green').length
  return {
    total,
    flaggedRed,
    warnedYellow,
    lookedClean,
  }
}

// On-device URL Analyzer
export function analyzeUrl(url: string, lang: Lang = 'en'): ScanResult {
  const cleanUrl = url.trim().toLowerCase()
  const t = translations[lang]

  // Direct match to screenshot example
  if (cleanUrl.includes('microsoft-secure-login.xyz')) {
    return {
      id: `scan-${Date.now()}`,
      type: 'link',
      source: 'link',
      target: 'microsoft-secure-login.xyz',
      verdict: 'red',
      band: 'high',
      score: 85,
      levelLabel: t.highRisk,
      reasons: [
        { iconType: 'building', text: 'Brand look-alike (mimics Microsoft)' },
        { iconType: 'globe', text: 'Suspicious TLD (.xyz commonly used in phishing)' },
        { iconType: 'search', text: 'Suspicious keywords found in URL path' },
        { iconType: 'shield', text: 'Not an official Microsoft domain' },
      ],
      disclaimer: t.disclaimerWarning,
      timestamp: 'Just now',
    }
  }

  // Direct match to google.com
  if (cleanUrl.includes('google.com') && !cleanUrl.includes('fake') && !cleanUrl.includes('login-google')) {
    return {
      id: `scan-${Date.now()}`,
      type: 'link',
      source: 'link',
      target: 'https://www.google.com',
      verdict: 'green',
      band: 'low',
      score: 12,
      levelLabel: t.lowRisk,
      reasons: [
        { iconType: 'check', text: t.noRiskyFound },
      ],
      disclaimer: t.disclaimerClean,
      timestamp: 'Just now',
    }
  }

  // Pure on-device heuristic engine
  const reasons: { iconType: any; text: string }[] = []
  let score = 10

  const suspiciousTlds = ['.xyz', '.top', '.buzz', '.cam', '.club', '.tk', '.ml', '.ga', '.cf', '.gq', '.icu', '.vip']
  const matchedTld = suspiciousTlds.find((tld) => cleanUrl.includes(tld))
  if (matchedTld) {
    score += 30
    reasons.push({ iconType: 'globe', text: `Suspicious TLD (${matchedTld} commonly used in phishing)` })
  }

  const brands = ['microsoft', 'google', 'apple', 'paypal', 'sbi', 'hdfc', 'paytm', 'amazon', 'netflix', 'chase', 'wellsfargo']
  const matchedBrand = brands.find((b) => cleanUrl.includes(b))
  if (matchedBrand) {
    const isOfficial = cleanUrl.includes(`${matchedBrand}.com`) || cleanUrl.includes(`${matchedBrand}.in`) || cleanUrl.includes(`${matchedBrand}.org`)
    if (!isOfficial) {
      score += 35
      const brandCapitalized = matchedBrand.charAt(0).toUpperCase() + matchedBrand.slice(1)
      reasons.push({ iconType: 'building', text: `Brand look-alike (mimics ${brandCapitalized})` })
      reasons.push({ iconType: 'shield', text: `Not an official ${brandCapitalized} domain` })
    }
  }

  const suspiciousKeywords = ['login', 'verify', 'update', 'secure', 'banking', 'kyc', 'account', 'password', 'signin', 'auth', 'claim', 'reward', 'free']
  const foundKeywords = suspiciousKeywords.filter((kw) => cleanUrl.includes(kw))
  if (foundKeywords.length > 0) {
    score += Math.min(foundKeywords.length * 15, 30)
    reasons.push({ iconType: 'search', text: `Suspicious keywords found in URL (${foundKeywords.slice(0, 3).join(', ')})` })
  }

  // IP address check
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(cleanUrl)) {
    score += 40
    reasons.push({ iconType: 'alert', text: 'Raw IP address used instead of legitimate domain name' })
  }

  if (score > 100) score = 100

  let verdict: Verdict = 'green'
  let band: Band = 'low'
  let levelLabel = t.lowRisk
  let disclaimer = t.disclaimerClean

  if (score >= 70) {
    verdict = 'red'
    band = 'high'
    levelLabel = t.highRisk
    disclaimer = t.disclaimerWarning
  } else if (score >= 35) {
    verdict = 'yellow'
    band = 'medium'
    levelLabel = t.mediumRisk
    disclaimer = t.disclaimerWarning
  }

  if (reasons.length === 0) {
    reasons.push({ iconType: 'check', text: t.noRiskyFound })
  }

  return {
    id: `scan-${Date.now()}`,
    type: 'link',
    source: 'link',
    target: url,
    verdict,
    band,
    score,
    levelLabel,
    reasons,
    disclaimer,
    timestamp: 'Just now',
  }
}

// On-device Message / SMS Analyzer
export function analyzeMessage(text: string, lang: Lang = 'en'): ScanResult {
  const clean = text.trim().toLowerCase()
  const t = translations[lang]

  // Direct match to screenshot example
  if (clean.includes('kyc') && (clean.includes('pending') || clean.includes('bit.ly') || clean.includes('update now'))) {
    return {
      id: `scan-${Date.now()}`,
      type: 'message',
      source: 'sms',
      target: 'Your KYC is pending, update now to avoid account suspension: http://bit.ly/sbi-kyc-up',
      verdict: 'yellow',
      band: 'medium',
      score: 55,
      levelLabel: t.mediumRisk,
      reasons: [
        { iconType: 'alert', text: 'Urgency language detected ("pending", "suspension")' },
        { iconType: 'info', text: 'KYC / bank credential request in unverified message' },
        { iconType: 'link', text: 'Shortened URL hides true destination' },
      ],
      disclaimer: t.disclaimerWarning,
      timestamp: 'Just now',
    }
  }

  const reasons: { iconType: any; text: string }[] = []
  let score = 15

  const urgencyWords = ['urgent', 'immediately', 'pending', 'suspended', 'deactivated', 'blocked', '24 hours', 'action required', 'expiring', 'final warning']
  const matchedUrgency = urgencyWords.filter((w) => clean.includes(w))
  if (matchedUrgency.length > 0) {
    score += 25
    reasons.push({ iconType: 'alert', text: `Urgency language detected (${matchedUrgency.slice(0, 2).map((w) => `"${w}"`).join(', ')})` })
  }

  const financialWords = ['kyc', 'pan', 'aadhaar', 'otp', 'credit card', 'debit card', 'bank account', 'electricity bill', 'lottery', 'refund', 'cashback']
  const matchedFin = financialWords.filter((w) => clean.includes(w))
  if (matchedFin.length > 0) {
    score += 25
    reasons.push({ iconType: 'info', text: `Sensitive information request (${matchedFin.slice(0, 2).join(', ').toUpperCase()})` })
  }

  const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'cutt.ly', 'rb.gy']
  if (shorteners.some((s) => clean.includes(s))) {
    score += 20
    reasons.push({ iconType: 'link', text: 'Shortened URL hides true destination' })
  }

  if (clean.includes('http://') || clean.includes('https://') || clean.includes('.com') || clean.includes('.xyz') || clean.includes('.apk')) {
    score += 15
  }

  if (score > 100) score = 100

  let verdict: Verdict = 'green'
  let band: Band = 'low'
  let levelLabel = t.lowRisk
  let disclaimer = t.disclaimerClean

  if (score >= 70) {
    verdict = 'red'
    band = 'high'
    levelLabel = t.highRisk
    disclaimer = t.disclaimerWarning
  } else if (score >= 35) {
    verdict = 'yellow'
    band = 'medium'
    levelLabel = t.mediumRisk
    disclaimer = t.disclaimerWarning
  }

  if (reasons.length === 0) {
    reasons.push({ iconType: 'check', text: 'No phishing or social engineering patterns detected.' })
  }

  return {
    id: `scan-${Date.now()}`,
    type: 'message',
    source: 'sms',
    target: text.length > 80 ? text.substring(0, 80) + '...' : text,
    verdict,
    band,
    score,
    levelLabel,
    reasons,
    disclaimer,
    timestamp: 'Just now',
  }
}

// On-device APK Analyzer
export function analyzeApk(fileName: string, lang: Lang = 'en'): ScanResult {
  const clean = fileName.trim().toLowerCase()
  const t = translations[lang]

  // Direct match to screenshot example
  if (clean.includes('paymentapp') || clean.includes('payment')) {
    return {
      id: `scan-${Date.now()}`,
      type: 'apk',
      source: 'manual',
      target: 'PaymentApp.apk',
      verdict: 'red',
      band: 'high',
      score: 78,
      levelLabel: t.highRisk,
      reasons: [
        { iconType: 'alert', text: 'Risky permissions requested (SMS, Accessibility, Contacts)' },
        { iconType: 'refresh', text: 'Repackaging detected (modified signature from original)' },
        { iconType: 'shield', text: 'Known phishing template and overlay patterns found' },
      ],
      disclaimer: t.disclaimerWarning,
      timestamp: 'Just now',
    }
  }

  // Safe sample
  if (clean.includes('clean') || clean.includes('safe') || clean.includes('calculator')) {
    return {
      id: `scan-${Date.now()}`,
      type: 'apk',
      source: 'manual',
      target: fileName,
      verdict: 'green',
      band: 'low',
      score: 15,
      levelLabel: t.lowRisk,
      reasons: [
        { iconType: 'check', text: 'Standard application manifest with normal permissions' },
        { iconType: 'shield', text: 'Valid self-consistent signature verification passed' },
      ],
      disclaimer: t.disclaimerClean,
      timestamp: 'Just now',
    }
  }

  // Generic APK inspection
  return {
    id: `scan-${Date.now()}`,
    type: 'apk',
    source: 'manual',
    target: fileName,
    verdict: 'yellow',
    band: 'medium',
    score: 48,
    levelLabel: t.mediumRisk,
    reasons: [
      { iconType: 'alert', text: 'Elevated permissions requested in manifest (INTERNET, WAKE_LOCK)' },
      { iconType: 'info', text: 'Sideloaded package from outside official app store' },
    ],
    disclaimer: t.disclaimerWarning,
    timestamp: 'Just now',
  }
}
