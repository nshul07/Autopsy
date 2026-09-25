import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native'
import { translations } from '../i18n/translations'
import type { Lang, ScanType } from '../types'

interface ScanInputModalProps {
  visible: boolean
  scanType: ScanType | null
  currentLang: Lang
  onClose: () => void
  onSubmit: (type: ScanType, value: string) => void
}

export const ScanInputModal: React.FC<ScanInputModalProps> = ({
  visible,
  scanType,
  currentLang,
  onClose,
  onSubmit,
}) => {
  const [inputValue, setInputValue] = useState('')
  const t = translations[currentLang]

  if (!scanType) return null

  const getTitle = () => {
    switch (scanType) {
      case 'link':
        return t.scanLink
      case 'message':
        return t.scanMessage
      case 'apk':
        return t.scanApk
    }
  }

  const getPlaceholder = () => {
    switch (scanType) {
      case 'link':
        return t.enterUrlPlaceholder
      case 'message':
        return t.enterMsgPlaceholder
      case 'apk':
        return t.selectApkHint
    }
  }

  const presets = {
    link: [
      { label: 'Phishing: microsoft-secure-login.xyz', value: 'microsoft-secure-login.xyz' },
      { label: 'Clean: https://www.google.com', value: 'https://www.google.com' },
      { label: 'Suspicious Bank: http://sbi-online-kyc-verify.top/login', value: 'http://sbi-online-kyc-verify.top/login' },
    ],
    message: [
      {
        label: 'KYC Urgent Phishing SMS',
        value: 'Your KYC is pending, update now to avoid account suspension: http://bit.ly/sbi-kyc-up',
      },
      {
        label: 'Normal Delivery SMS',
        value: 'Your package 48291 has been dispatched and will arrive tomorrow. Track at official courier.',
      },
    ],
    apk: [
      { label: 'Repackaged Trojan: PaymentApp.apk', value: 'PaymentApp.apk' },
      { label: 'Clean Utility: Calculator.apk', value: 'Calculator.apk' },
    ],
  }

  const currentPresets = presets[scanType] || []

  const handleRun = () => {
    const val = inputValue.trim() || (currentPresets[0]?.value ?? '')
    onSubmit(scanType, val)
    setInputValue('')
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{getTitle()}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>
                  {scanType === 'link'
                    ? 'Target URL'
                    : scanType === 'message'
                    ? 'Message Content'
                    : 'Target APK Name'}
                </Text>

                <TextInput
                  style={[
                    styles.inputField,
                    scanType === 'message' && styles.inputFieldMultiline,
                  ]}
                  placeholder={getPlaceholder()}
                  placeholderTextColor="#94A3B8"
                  value={inputValue}
                  onChangeText={setInputValue}
                  multiline={scanType === 'message'}
                  numberOfLines={scanType === 'message' ? 4 : 1}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {/* Quick Presets */}
                <View style={styles.presetsSection}>
                  <Text style={styles.presetsTitle}>Quick Sample Presets:</Text>
                  <View style={styles.presetsList}>
                    {currentPresets.map((p, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.presetChip}
                        onPress={() => setInputValue(p.value)}
                      >
                        <Text style={styles.presetChipText}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                  style={styles.analyzeBtn}
                  onPress={handleRun}
                  activeOpacity={0.85}
                >
                  <Text style={styles.analyzeBtnText}>{t.runAnalysis}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    fontSize: 18,
    color: '#64748B',
    padding: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
  },
  inputFieldMultiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  presetsList: {
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  presetChipText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  analyzeBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
