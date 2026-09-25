import { useState, useRef, useCallback, useEffect } from 'react'
import jsQR from 'jsqr'

interface UseQrScannerOptions {
  onScan?: (data: string) => void
}

export function useQrScanner({ onScan }: UseQrScannerOptions = {}) {
  const [scanning, setScanning] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  const stopScan = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setScanning(false)
  }, [])

  const scanFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })

      if (code && code.data) {
        onScanRef.current?.(code.data)
        stopScan()
        return
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame)
  }, [stopScan])

  const startScan = useCallback(async () => {
    setError(null)
    setPermissionDenied(false)

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false)
      setError('Camera is not supported on this device')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
        setScanning(true)
        animFrameRef.current = requestAnimationFrame(scanFrame)
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true)
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setHasCamera(false)
      } else {
        setError(err.message || 'Failed to start camera')
      }
      setScanning(false)
    }
  }, [scanFrame])

  const decodeImage = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context unavailable'))
          return
        }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        resolve(code ? code.data : null)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }, [])

  useEffect(() => {
    return () => {
      stopScan()
    }
  }, [stopScan])

  return {
    videoRef,
    scanning,
    permissionDenied,
    hasCamera,
    error,
    startScan,
    stopScan,
    decodeImage,
  }
}
