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
}

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
  } catch {}
  listeners.forEach((l) => l())
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
