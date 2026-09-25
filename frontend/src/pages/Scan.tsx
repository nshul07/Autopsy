import React, { useState, useRef } from 'react'
import { FileUp, Shield, HelpCircle, ChevronDown, Check, FileCheck } from 'lucide-react'
import { useI18n } from '../i18n'
import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import Disclaimer from '../components/Disclaimer'
import { validateApkFile, MAX_APK_MB } from '../lib/validate'
import { formatBytes } from '../lib/format'
import { setMockScenario, type MockScenario } from '../services/api'

interface ScanProps {
  onFileSelected: (file: File) => void
  onSelectMockScenario: (scenario: MockScenario) => void
}

export function Scan({ onFileSelected, onSelectMockScenario }: ScanProps) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePickedFile(file)
  }

  const handlePickedFile = (file: File) => {
    setErrorMsg(null)
    const check = validateApkFile(file)
    if (!check.ok) {
      if (check.reason === 'too_large') {
        setErrorMsg(t('scan.fileTooLarge'))
      } else if (check.reason === 'not_apk') {
        setErrorMsg(t('scan.notApk'))
      } else {
        setErrorMsg('Invalid file')
      }
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handlePickedFile(file)
  }

  const handleStartScan = () => {
    if (selectedFile) {
      onFileSelected(selectedFile)
    }
  }

  const triggerPicker = () => {
    fileInputRef.current?.click()
  }

  const handleDemoSelect = (scenario: MockScenario) => {
    setMockScenario(scenario)
    onSelectMockScenario(scenario)
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      <header>
        <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('scan.title')}
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
          Select an APK File
        </h1>
        <p className="text-[14.5px] text-ink-muted mt-1 leading-relaxed">
          {t('scan.sub')}
        </p>
      </header>

      {/* Upload Box */}
      <section className="card p-6 sm:p-8 text-center border-dashed border-2 relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`py-8 px-4 rounded-xl transition-all ${
            isDragging ? 'bg-brand-soft/40 border-brand' : ''
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto mb-4">
            <FileUp size={32} strokeWidth={2} />
          </div>

          {selectedFile ? (
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="p-3.5 rounded-xl border border-line bg-surface text-left flex items-center gap-3">
                <FileCheck size={22} className="text-risk-low-text shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-ink truncate">{selectedFile.name}</p>
                  <p className="text-[12px] text-ink-muted">{formatBytes(selectedFile.size)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <PrimaryButton fullWidth onClick={handleStartScan}>
                  {t('scan.startScan')}
                </PrimaryButton>
                <SecondaryButton fullWidth size="md" onClick={triggerPicker}>
                  {t('scan.changeFile')}
                </SecondaryButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-sm mx-auto">
              <div>
                <h3 className="text-[16px] font-bold text-ink">
                  {t('scan.chooseHint')}
                </h3>
                <p className="text-[12.5px] text-ink-muted mt-1">
                  Supports .apk files up to {MAX_APK_MB} MB
                </p>
              </div>

              <PrimaryButton fullWidth onClick={triggerPicker} icon={<FileUp size={18} />}>
                {t('scan.choose')}
              </PrimaryButton>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-risk-high-bg border border-risk-high-border text-[13px] text-risk-high-text font-medium">
              {errorMsg}
            </div>
          )}
        </div>
      </section>

      {/* Demo Quick Test Picker */}
      <section className="card p-5 border-line bg-surface">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-[14.5px] font-bold text-ink">
              {t('scan.demoPicker')}
            </h3>
            <p className="text-[12px] text-ink-muted">
              {t('scan.demoPickerHint')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleDemoSelect('low')}
            className="p-3 rounded-xl border border-risk-low-border bg-risk-low-bg/30 hover:bg-risk-low-bg/60 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-risk-low-text">
                Low Risk
              </span>
              <span className="text-[11px] font-bold text-risk-low-text">8 / 100</span>
            </div>
            <p className="text-[13.5px] font-bold text-ink mt-1 truncate">Calculator Demo</p>
            <p className="text-[11.5px] text-ink-muted">No sensitive access</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('medium')}
            className="p-3 rounded-xl border border-risk-medium-border bg-risk-medium-bg/30 hover:bg-risk-medium-bg/60 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-risk-medium-text">
                Medium Risk
              </span>
              <span className="text-[11px] font-bold text-risk-medium-text">48 / 100</span>
            </div>
            <p className="text-[13.5px] font-bold text-ink mt-1 truncate">Clean Master Tool</p>
            <p className="text-[11.5px] text-ink-muted">Unusual overlay & location</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemoSelect('high')}
            className="p-3 rounded-xl border border-risk-high-border bg-risk-high-bg/30 hover:bg-risk-high-bg/60 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-risk-high-text">
                High Risk
              </span>
              <span className="text-[11px] font-bold text-risk-high-text">78 / 100</span>
            </div>
            <p className="text-[13.5px] font-bold text-ink mt-1 truncate">Flashlight Pro</p>
            <p className="text-[11.5px] text-risk-high-text font-medium">Repackaged + OTP stealer</p>
          </button>
        </div>
      </section>

      {/* How it Works Accordion */}
      <section className="card p-5 border-line bg-surface">
        <button
          type="button"
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={showHowItWorks}
        >
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-brand shrink-0" />
            <h3 className="text-[14.5px] font-bold text-ink">
              {t('scan.howItWorks')}
            </h3>
          </div>
          <ChevronDown
            size={18}
            className={`text-ink-muted transition-transform duration-200 ${
              showHowItWorks ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showHowItWorks && (
          <div className="mt-3.5 pt-3 border-t border-line text-[13.5px] text-ink-soft leading-relaxed space-y-2">
            <p>{t('scan.howItWorksBody')}</p>
            <ul className="space-y-1.5 list-disc list-inside text-ink-muted text-[13px] pt-1">
              <li>Inspects app permissions, services, receivers, activities</li>
              <li>Checks certificate identity against known brand signatures</li>
              <li>Detects OTP stealers, overlay trojans and spyware combinations</li>
            </ul>
          </div>
        )}
      </section>

      <Disclaimer />
    </div>
  )
}
export default Scan
