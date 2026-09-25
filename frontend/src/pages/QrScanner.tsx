import { useEffect, useRef, useState } from 'react'
import { QrCode, CameraOff, Image as ImageIcon, ArrowRight, RefreshCw, Globe } from 'lucide-react'
import { useI18n } from '../i18n'
import { useQrScanner } from '../hooks/useQrScanner'
import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import Disclaimer from '../components/Disclaimer'

interface QrScannerProps {
  onCodeScanned: (url: string) => void
  onManualEntry: () => void
}

export function QrScanner({ onCodeScanned, onManualEntry }: QrScannerProps) {
  const { t } = useI18n()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const {
    videoRef,
    scanning,
    permissionDenied,
    hasCamera,
    startScan,
    stopScan,
    decodeImage,
  } = useQrScanner({
    onScan: (data) => {
      setDetectedUrl(data)
    },
  })

  useEffect(() => {
    startScan()
    return () => stopScan()
  }, [startScan, stopScan])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null)
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await decodeImage(file)
      if (result) {
        setDetectedUrl(result)
      } else {
        setImageError('No valid QR code was detected in this image.')
      }
    } catch {
      setImageError('Failed to process image file.')
    }
  }

  const handleProceed = () => {
    if (detectedUrl) {
      onCodeScanned(detectedUrl)
    }
  }

  const handleScanAgain = () => {
    setDetectedUrl(null)
    setImageError(null)
    startScan()
  }

  return (
    <div className="container-page py-6 space-y-6 animate-fade-in">
      <header>
        <span className="text-[12px] font-bold text-brand uppercase tracking-wider block mb-1">
          {t('qr.title')}
        </span>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-tight">
          Scan a QR Code
        </h1>
        <p className="text-[14.5px] text-ink-muted mt-1 leading-relaxed">
          {t('qr.sub')}
        </p>
      </header>

      {/* Hidden file picker for QR code images */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Camera Viewport or Fallback State */}
      <section className="card overflow-hidden border-line bg-surface">
        {detectedUrl ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-risk-low-bg text-risk-low-text flex items-center justify-center mx-auto">
              <QrCode size={32} strokeWidth={2.2} />
            </div>

            <div>
              <span className="text-[12px] font-bold uppercase tracking-wider text-risk-low-text">
                {t('qr.found')}
              </span>
              <h3 className="text-[18px] font-bold text-ink mt-1">
                {t('qr.detected')}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl border border-line bg-sunken break-all font-mono text-[13.5px] text-ink max-w-md mx-auto flex items-center gap-2">
              <Globe size={16} className="text-ink-muted shrink-0" />
              <span>{detectedUrl}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto pt-2">
              <PrimaryButton
                fullWidth
                onClick={handleProceed}
                icon={<ArrowRight size={18} />}
              >
                {t('qr.checkIt')}
              </PrimaryButton>

              <SecondaryButton
                fullWidth
                size="md"
                onClick={handleScanAgain}
                icon={<RefreshCw size={16} />}
              >
                {t('qr.scanAgain')}
              </SecondaryButton>
            </div>
          </div>
        ) : permissionDenied || !hasCamera ? (
          <div className="p-8 sm:p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-risk-medium-bg text-risk-medium-text flex items-center justify-center mx-auto">
              <CameraOff size={30} strokeWidth={2} />
            </div>

            <div>
              <h3 className="text-[18px] font-bold text-ink">
                {permissionDenied ? t('qr.deniedTitle') : t('qr.noCamera')}
              </h3>
              <p className="text-[13.5px] text-ink-muted max-w-xs mx-auto mt-1">
                {t('qr.deniedBody')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto pt-3">
              <PrimaryButton fullWidth onClick={onManualEntry}>
                {t('qr.deniedAction')}
              </PrimaryButton>

              <SecondaryButton
                fullWidth
                size="md"
                onClick={() => imageInputRef.current?.click()}
                icon={<ImageIcon size={16} />}
              >
                Upload QR Image
              </SecondaryButton>
            </div>
          </div>
        ) : (
          <div className="relative bg-black flex flex-col items-center justify-center min-h-[340px] sm:min-h-[400px]">
            {/* Live Camera View */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover max-h-[420px]"
              autoPlay
              muted
              playsInline
            />

            {/* Targeting Finder Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-white/80 rounded-2xl relative shadow-2xl">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand rounded-br-lg" />

                {/* Scanning Laser Animation Line */}
                <div className="w-full h-0.5 bg-brand animate-pulse mt-28 opacity-75 shadow-sm" />
              </div>
            </div>

            {/* Hint message overlay */}
            <div className="absolute bottom-4 inset-x-4 text-center">
              <span className="inline-block px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[12px] font-medium">
                {scanning ? 'Align QR code within the frame' : t('qr.starting')}
              </span>
            </div>
          </div>
        )}

        {/* Footer fallback actions */}
        {!detectedUrl && (
          <div className="p-4 border-t border-line flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-ink-muted hover:text-ink font-medium"
            >
              <ImageIcon size={16} />
              Upload QR code image
            </button>

            <button
              type="button"
              onClick={onManualEntry}
              className="text-brand font-semibold hover:underline"
            >
              {t('qr.deniedAction')}
            </button>
          </div>
        )}
      </section>

      {imageError && (
        <div className="p-3.5 rounded-xl bg-risk-high-bg border border-risk-high-border text-[13px] text-risk-high-text font-medium text-center">
          {imageError}
        </div>
      )}

      <Disclaimer />
    </div>
  )
}
export default QrScanner
