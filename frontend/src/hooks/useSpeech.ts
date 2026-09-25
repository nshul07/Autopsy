import { useState, useEffect, useCallback, useRef } from 'react'

export function useSpeech(langCode = 'en-IN') {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      setSupported(true)
    }
  }, [])

  const cancel = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setSpeaking(false)
    }
  }, [])

  const speak = useCallback(
    (text: string, overrideLang?: string) => {
      if (!synthRef.current) return
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = overrideLang || langCode
      utterance.rate = 0.95 // slightly slower for better clarity, especially for elder users

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      synthRef.current.speak(utterance)
    },
    [langCode]
  )

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  return { speak, cancel, speaking, supported }
}
