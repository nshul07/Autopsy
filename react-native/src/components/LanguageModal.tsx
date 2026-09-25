import React from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { translations } from '../i18n/translations'
import type { Lang } from '../types'

interface LanguageModalProps {
  visible: boolean
  currentLang: Lang
  onSelectLang: (lang: Lang) => void
  onClose: () => void
}

const languages: { key: Lang; label: string; subLabel: string }[] = [
  { key: 'en', label: 'English', subLabel: 'English' },
  { key: 'hi', label: 'हिन्दी', subLabel: 'Hindi' },
  { key: 'pa', label: 'ਪੰਜਾਬੀ', subLabel: 'Punjabi' },
]

export const LanguageModal: React.FC<LanguageModalProps> = ({
  visible,
  currentLang,
  onSelectLang,
  onClose,
}) => {
  const t = translations[currentLang]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>{t.selectLanguage}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {languages.map((item) => {
                  const isSelected = item.key === currentLang
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.langOption, isSelected && styles.langOptionActive]}
                      onPress={() => {
                        onSelectLang(item.key)
                        onClose()
                      }}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={[styles.langName, isSelected && styles.langNameActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.langSub}>{item.subLabel}</Text>
                      </View>

                      {isSelected ? (
                        <View style={styles.radioSelected}>
                          <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
                            <Circle cx="10" cy="10" r="10" fill="#2563EB" />
                            <Path
                              d="M6 10L9 13L14 7"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                      ) : (
                        <View style={styles.radioEmpty} />
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    fontSize: 18,
    color: '#64748B',
    padding: 4,
  },
  optionsList: {
    gap: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  langName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  langNameActive: {
    color: '#1D4ED8',
  },
  langSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  radioSelected: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
})
