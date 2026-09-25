import React from 'react'
import Svg, { Path, Circle, Rect, G } from 'react-native-svg'

interface IconProps {
  size?: number
  color?: string
  style?: any
}

// 1. AppAutopsy Shield with Chain Link Logo
export const AppLogoIcon: React.FC<{ size?: number; glow?: boolean }> = ({ size = 64, glow = false }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {glow && (
      <Circle cx="32" cy="32" r="30" fill="#2563EB" opacity="0.15" />
    )}
    {/* Shield outer boundary */}
    <Path
      d="M32 6L48 13.5V28.5C48 40.5 41.2 51.5 32 58C22.8 51.5 16 40.5 16 28.5V13.5L32 6Z"
      fill="#1E293B"
      stroke="#38BDF8"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Internal link chain */}
    <Path
      d="M27 35L37 25M24 38L21 41C18.7909 43.2091 18.7909 46.7909 21 49C23.2091 51.2091 26.7909 51.2091 29 49L32 46M35 27L38 24C40.2091 21.7909 43.7909 21.7909 46 24C48.2091 26.2091 48.2091 29.7909 46 32L43 35"
      stroke="#38BDF8"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export const SmallAppLogo: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <Path
      d="M14 2L22 5.5V12C22 17.5 18.5 22.5 14 25.5C9.5 22.5 6 17.5 6 12V5.5L14 2Z"
      fill="#2563EB"
    />
    <Path
      d="M12 15L16 11M10.5 16.5L9.5 17.5C8.67157 18.3284 8.67157 19.6716 9.5 20.5C10.3284 21.3284 11.6716 21.3284 12.5 20.5L13.5 19.5M14.5 12.5L15.5 11.5C16.3284 10.6716 17.6716 10.6716 18.5 11.5C19.3284 12.3284 19.3284 13.6716 18.5 14.5L17.5 15.5"
      stroke="#FFFFFF"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </Svg>
)

// Document / File icon (for Total checked)
export const DocumentIcon: React.FC<IconProps> = ({ size = 20, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      fill="#CBD5E1"
    />
    <Path d="M14 2V8H20" fill="#94A3B8" />
    <Path d="M8 13H16M8 17H13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
)

// Red circle with exclamation icon
export const RedExclamationIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#EF4444" />
    <Path d="M12 7V13" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    <Circle cx="12" cy="16.5" r="1.2" fill="#FFFFFF" />
  </Svg>
)

// Yellow warning triangle icon
export const YellowWarningIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L22 20H2L12 3Z"
      fill="#F59E0B"
      stroke="#F59E0B"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <Path d="M12 9V14" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    <Circle cx="12" cy="17" r="1.2" fill="#FFFFFF" />
  </Svg>
)

// Green check circle icon
export const GreenCheckIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#10B981" />
    <Path d="M8 12.5L10.5 15L16 9.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

// Chain Link Icon (in blue circle)
export const BlueLinkIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#E0F2FE" />
    <Path
      d="M16 20L20 16M13.5 22.5L12 24C10.6193 25.3807 10.6193 27.6193 12 29C13.3807 30.3807 15.6193 30.3807 17 29L18.5 27.5M17.5 14.5L19 13C20.3807 11.6193 22.6193 11.6193 24 13C25.3807 14.3807 25.3807 16.6193 24 18L22.5 19.5"
      stroke="#0284C7"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </Svg>
)

// Message / SMS Icon (in blue circle)
export const BlueMessageIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#E0F2FE" />
    <Path
      d="M26 18C26 22.4183 22.4183 26 18 26C16.4834 26 15.0569 25.5779 13.8407 24.8465L10 26L11.2335 22.3813C10.4578 21.1166 10 19.6105 10 18C10 13.5817 13.5817 10 18 10C22.4183 10 26 13.5817 26 18Z"
      fill="#0284C7"
    />
    <Path d="M14 17H22M14 20H19" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
)

// Email Icon (in blue circle)
export const BlueEmailIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#E0F2FE" />
    <Rect x="10" y="12" width="16" height="12" rx="2" fill="#0284C7" />
    <Path d="M10.5 13L18 18.5L25.5 13" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
)

// Android Robot Icon (Green / Dark)
export const AndroidIcon: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = '#10B981' }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <Circle cx="18" cy="18" r="18" fill="#ECFDF5" />
    {/* Android Head */}
    <Path d="M13 18C13 15.2386 15.2386 13 18 13C20.7614 13 23 15.2386 23 18H13Z" fill={color} />
    {/* Antennas */}
    <Path d="M15 11L14 13M21 11L22 13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    {/* Eyes */}
    <Circle cx="15.5" cy="16" r="0.8" fill="#FFFFFF" />
    <Circle cx="20.5" cy="16" r="0.8" fill="#FFFFFF" />
    {/* Body */}
    <Rect x="13" y="19" width="10" height="7" rx="1.5" fill={color} />
  </Svg>
)

// Bottom Navigation Icons
export const HomeNavIcon: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
      fill={active ? '#2563EB' : 'none'}
      stroke={active ? '#2563EB' : '#94A3B8'}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
)

export const ScanNavIcon: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="11"
      cy="11"
      r="7"
      stroke={active ? '#2563EB' : '#94A3B8'}
      strokeWidth="2"
    />
    <Path
      d="M16 16L21 21"
      stroke={active ? '#2563EB' : '#94A3B8'}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </Svg>
)

export const HistoryNavIcon: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle
      cx="12"
      cy="12"
      r="9"
      stroke={active ? '#2563EB' : '#94A3B8'}
      strokeWidth="2"
    />
    <Path
      d="M12 7V12L15.5 14"
      stroke={active ? '#2563EB' : '#94A3B8'}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
)

// General Icons
export const GlobeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M2 12H22M12 2C14.5 5.5 15.5 8.5 15.5 12C15.5 15.5 14.5 18.5 12 22C9.5 18.5 8.5 15.5 8.5 12C8.5 8.5 9.5 5.5 12 2Z" stroke={color} strokeWidth="1.8" />
  </Svg>
)

export const ChevronDownIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const ChevronRightIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const BackArrowIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#0F172A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const ShareIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#0F172A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2" />
    <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={color} strokeWidth="2" />
  </Svg>
)

export const BuildingIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21H21M4 21V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V21M9 7H10M14 7H15M9 11H10M14 11H15M9 15H10M14 15H15M9 21V18H15V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
)

export const SearchIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
    <Path d="M16 16L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
)

export const ShieldLockIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L20 5.5V12C20 17.5 16.5 22 12 23.5C7.5 22 4 17.5 4 12V5.5L12 2Z" stroke={color} strokeWidth="2" />
    <Path d="M10 11V9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9V11M9 11H15C15.5523 11 16 11.4477 16 12V16C16 16.5523 15.5523 17 15 17H9C8.44772 17 8 16.5523 8 16V12C8 11.4477 8.44772 11 9 11Z" stroke={color} strokeWidth="1.6" />
  </Svg>
)

export const InfoCircleIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 8V12M12 16H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
)

export const RefreshIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = '#64748B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12C4 7.58172 7.58172 4 12 4C15.5 4 18.5 6.2 19.5 9.5M20 4V10H14M20 12C20 16.4183 16.4183 20 12 20C8.5 20 5.5 17.8 4.5 14.5M4 20V14H10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const UserIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <Path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
)

export const WifiOffIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 2L22 22M10.66 5C14.7 5.16 18.42 6.78 21.2 9.5M16.5 13.5C17.65 14.35 18.58 15.5 19.18 16.82M8.5 8.5C6.9 9.3 5.48 10.45 4.3 11.8M1.42 9C2.66 7.78 4.08 6.78 5.64 6M12 19.5H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
)

export const ShieldCheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#94A3B8' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L20 5.5V12C20 17.5 16.5 22 12 23.5C7.5 22 4 17.5 4 12V5.5L12 2Z" stroke={color} strokeWidth="2" />
    <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)
