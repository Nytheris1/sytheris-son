'use client'

import { useSyncExternalStore } from 'react'

export type Prefs = {
  autoplayTrailers: boolean
  trailerSound: boolean
  reduceMotion: boolean
  intro: boolean
  subtitleSize: 'sm' | 'md' | 'lg' | 'xl'
  subtitleBg: boolean
  aiProvider: 'auto' | 'ollama' | 'gemini'
  ollamaUrl: string
  ollamaModel: string
  synopsisLang: 'tr' | 'en' | 'ja' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'ko' | 'az'
  textScale: 'sm' | 'md' | 'lg' | 'xl'
  resumePlayback: boolean
  defaultSpeed: number
  dataSaver: boolean
  underlineLinks: boolean
  strongFocus: boolean
  hideScores: boolean
}

/** Prefs that are expressed purely as CSS hooks on <html>; see the `.pref-*` rules in globals.css. */
const CLASS_PREFS = { dataSaver: 'pref-data-saver', underlineLinks: 'pref-underline', strongFocus: 'pref-focus', hideScores: 'pref-hide-scores' } as const

export function applyPrefClasses(p: Prefs) {
  const root = document.documentElement
  for (const [key, cls] of Object.entries(CLASS_PREFS)) root.classList.toggle(cls, Boolean(p[key as keyof typeof CLASS_PREFS]))
}

export const TEXT_SCALES: Record<Prefs['textScale'], string> = { sm: '93.75%', md: '100%', lg: '106.25%', xl: '112.5%' }

export const DEFAULT_PREFS: Prefs = {
  autoplayTrailers: true,
  trailerSound: false,
  reduceMotion: false,
  intro: true,
  subtitleSize: 'md',
  subtitleBg: true,
  aiProvider: 'auto',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  synopsisLang: 'tr',
  textScale: 'md',
  resumePlayback: true,
  defaultSpeed: 1,
  dataSaver: false,
  underlineLinks: false,
  strongFocus: false,
  hideScores: false,
}

const KEY = 'sy-prefs'
const listeners = new Set<() => void>()
let cache: Prefs | null = null

function read(): Prefs {
  if (cache) return cache
  try {
    cache = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    cache = DEFAULT_PREFS
  }
  return cache as Prefs
}

export function setPrefs(patch: Partial<Prefs>) {
  cache = { ...read(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
    if ('reduceMotion' in patch) {
      localStorage.setItem('sy-reduce-motion', patch.reduceMotion ? '1' : '0')
      document.documentElement.classList.toggle('reduce-motion', Boolean(patch.reduceMotion))
    }
    if ('intro' in patch) localStorage.setItem('sy-intro', patch.intro ? '1' : '0')
    if (patch.textScale) document.documentElement.style.fontSize = TEXT_SCALES[patch.textScale]
    applyPrefClasses(cache)
  } catch {}
  listeners.forEach((l) => l())
}

export function resetPrefs() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
  setPrefs({ ...DEFAULT_PREFS })
}

export function getPrefs() {
  return typeof window === 'undefined' ? DEFAULT_PREFS : read()
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => DEFAULT_PREFS,
  )
}
