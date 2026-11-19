'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { THEME_IDS, themeHex, themeName, type ThemeId, type ThemeMode } from '@/lib/themes'
import { CUSTOM_THEME_KEY, CUSTOM_VAR_NAMES, customThemeVars, type CustomTheme } from '@/lib/custom-theme'

type Ctx = {
  theme: ThemeId
  mode: ThemeMode
  dark: boolean
  setTheme: (id: ThemeId, origin?: { x: number; y: number }) => void
  setMode: (m: ThemeMode, origin?: { x: number; y: number }) => void
  /** Active user-made theme (Sytheris+), or null when a preset is active. */
  custom: CustomTheme | null
  applyCustom: (t: CustomTheme, origin?: { x: number; y: number }) => void
  themeLabel: string
}

function clearCustomVars() {
  const style = document.documentElement.style
  CUSTOM_VAR_NAMES.forEach((k) => style.removeProperty(k))
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
  const [custom, setCustom] = useState<CustomTheme | null>(null)

  useEffect(() => {
    const t = (localStorage.getItem('sy-theme') as ThemeId) || 'green'
    const m = (localStorage.getItem('sy-mode') as ThemeMode) || 'system'
    setThemeState(THEME_IDS.includes(t) ? t : 'green')
    if ((t as string) === 'custom') {
      try {
        const saved = JSON.parse(localStorage.getItem(CUSTOM_THEME_KEY) || 'null') as (CustomTheme & { base?: ThemeId }) | null
        if (saved?.hex) {
          setCustom({ id: saved.id, name: saved.name, hex: saved.hex })
          if (saved.base && THEME_IDS.includes(saved.base)) setThemeState(saved.base)
        }
      } catch {}
    }
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
    if (meta) meta.setAttribute('content', custom?.hex ?? themeHex(theme))
  }, [theme, custom])

  const setTheme = useCallback((id: ThemeId, origin?: { x: number; y: number }) => {
    withTransition(() => {
      clearCustomVars()
      document.documentElement.dataset.theme = id
      localStorage.setItem('sy-theme', id)
      setThemeState(id)
      setCustom(null)
    }, origin)
  }, [])

  const applyCustom = useCallback(
    (t: CustomTheme, origin?: { x: number; y: number }) => {
      withTransition(() => {
        const vars = customThemeVars(t.hex)
        const root = document.documentElement
        Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
        root.dataset.theme = 'custom'
        localStorage.setItem('sy-theme', 'custom')
        localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify({ ...t, vars, base: theme }))
        setCustom({ id: t.id, name: t.name, hex: t.hex })
      }, origin)
    },
    [theme],
  )

  const setMode = useCallback((m: ThemeMode, origin?: { x: number; y: number }) => {
    withTransition(() => {
      const d = m === 'dark' || (m === 'system' && systemDark())
      document.documentElement.classList.toggle('dark', d)
      localStorage.setItem('sy-mode', m)
      setModeState(m)
      setDark(d)
    }, origin)
  }, [])

  const themeLabel = custom?.name ?? themeName(theme)
  return <ThemeCtx.Provider value={{ theme, mode, dark, setTheme, setMode, custom, applyCustom, themeLabel }}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
