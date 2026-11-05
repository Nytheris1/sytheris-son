'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { THEME_IDS, themeHex, type ThemeId, type ThemeMode } from '@/lib/themes'

type Ctx = {
  theme: ThemeId
  mode: ThemeMode
  dark: boolean
  setTheme: (id: ThemeId, origin?: { x: number; y: number }) => void
  setMode: (m: ThemeMode, origin?: { x: number; y: number }) => void
}

const ThemeCtx = createContext<Ctx | null>(null)

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function withTransition(apply: () => void, origin?: { x: number; y: number }) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }
  const reduce = document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce) {
    apply()
    return
  }
  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? 0
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const t = doc.startViewTransition(() => flushSync(apply))
  t.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('green')
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const t = (localStorage.getItem('sy-theme') as ThemeId) || 'green'
    const m = (localStorage.getItem('sy-mode') as ThemeMode) || 'system'
    setThemeState(THEME_IDS.includes(t) ? t : 'green')
    setModeState(m)
    setDark(document.documentElement.classList.contains('dark'))
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if ((localStorage.getItem('sy-mode') || 'system') === 'system') {
        document.documentElement.classList.toggle('dark', mq.matches)
        setDark(mq.matches)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', themeHex(theme))
  }, [theme])

  const setTheme = useCallback((id: ThemeId, origin?: { x: number; y: number }) => {
    withTransition(() => {
      document.documentElement.dataset.theme = id
      localStorage.setItem('sy-theme', id)
      setThemeState(id)
    }, origin)
  }, [])

  const setMode = useCallback((m: ThemeMode, origin?: { x: number; y: number }) => {
    withTransition(() => {
      const d = m === 'dark' || (m === 'system' && systemDark())
      document.documentElement.classList.toggle('dark', d)
      localStorage.setItem('sy-mode', m)
      setModeState(m)
      setDark(d)
    }, origin)
  }, [])

  return <ThemeCtx.Provider value={{ theme, mode, dark, setTheme, setMode }}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
