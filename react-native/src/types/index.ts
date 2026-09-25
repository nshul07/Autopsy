export type Verdict = 'green' | 'yellow' | 'red'
export type Band = 'low' | 'medium' | 'high'
export type ScanSource = 'link' | 'sms' | 'email' | 'manual'
export type ScanType = 'link' | 'message' | 'apk'
export type Lang = 'en' | 'hi' | 'pa'

export interface ReasonItem {
  iconType: 'building' | 'globe' | 'search' | 'shield' | 'info' | 'link' | 'alert' | 'refresh' | 'check'
  text: string
}

export interface ScanResult {
  id: string
  type: ScanType
  source: ScanSource
  target: string // e.g. "microsoft-secure-login.xyz", "Your KYC is pending...", "PaymentApp.apk"
  verdict: Verdict
  band: Band
  score: number
  levelLabel: string // "High risk", "Medium risk", "No suspicious patterns detected"
  summary?: string
  reasons: ReasonItem[]
  disclaimer: string
  timestamp: string
}

export interface HistoryItem {
  id: string
  title: string
  source: ScanSource
  timeAgo: string
  verdict: Verdict
  band: Band
  score: number
  target: string
  type: ScanType
  reasons: ReasonItem[]
}

export interface DashboardStats {
  total: number
  flaggedRed: number
  warnedYellow: number
  lookedClean: number
}
