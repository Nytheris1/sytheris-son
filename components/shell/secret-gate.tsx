'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const PHRASE = 'sycore'

/**
 * Hidden entry to the control center. Not linked anywhere in the UI:
 * - Ctrl/Cmd + Shift + Y
 * - typing "sycore" anywhere outside a text field
 * - holding the header logo for ~2.5 seconds (touch devices)
 */
export function SecretGate() {
  const router = useRouter()
  useEffect(() => {
    let buffer = ''
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        router.push('/sy-core')
        return
      }
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.key.length !== 1) return
      buffer = (buffer + e.key.toLowerCase()).slice(-PHRASE.length)
      if (buffer === PHRASE) {
        buffer = ''
        router.push('/sy-core')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])
  return null
}
