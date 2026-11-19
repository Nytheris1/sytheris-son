'use client'

import { useEffect, useRef, useState } from 'react'

const KEYART = '/intro/keyart.webp'
/** Mirrors app/intro.css: the exit wipe starts at 2050ms and lasts 900ms; a skip wipes in 600ms. */
const EXIT_AT_MS = 2050
const TOTAL_MS = EXIT_AT_MS + 900
const SKIP_MS = 600
export const FILM_SEEN_KEY = 'sy-film-seen'

type Phase = 'play' | 'skip' | 'done'

/**
 * Opening slate of the welcome film: a counter runs to 100 inside a small tilted frame, then the frame is
 * wiped away upward. The whole timeline is CSS (app/intro.css), so it plays from first paint and leaves on
 * its own even if hydration is slow or a client error happens — the page can never get stuck behind it.
 * JS only unmounts it afterwards and handles Enter/Escape to skip.
 */
export function FilmBoot() {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('play')

  useEffect(() => {
    window.scrollTo(0, 0)
    try {
      sessionStorage.setItem(FILM_SEEN_KEY, '1')
    } catch {}

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion')
    if (reduce || document.documentElement.classList.contains('film-seen')) {
      setPhase('done')
      return
    }

    const exit = ref.current?.getAnimations().find((a) => (a as CSSAnimation).animationName === 'film-boot-exit')
    const played = typeof exit?.currentTime === 'number' ? exit.currentTime : 0
    const timers = [window.setTimeout(() => setPhase('done'), Math.max(0, TOTAL_MS - played + 60))]

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Enter') return
      setPhase('skip')
      timers.push(window.setTimeout(() => setPhase('done'), SKIP_MS + 60))
      window.removeEventListener('keydown', onKey)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Sytheris yükleniyor"
      data-phase={phase}
      className="film-boot dark fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-scrim text-on-scrim"
    >
      <div aria-hidden="true" className="grain absolute inset-0" />

      <p className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/50 sm:left-10 sm:top-8">
        <span lang="en">Sytheris</span> · Sayı 01
      </p>

      <div className="film-boot-frame relative aspect-[4/5] w-[min(56vw,300px)] overflow-hidden rounded-sm border-[6px] border-on-scrim/90 bg-scrim shadow-[0_40px_80px_-20px_rgb(0_0_0/0.8)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={KEYART} alt="" fetchPriority="high" className="film-boot-reveal absolute inset-0 size-full object-cover" />
        <div className="film-boot-scan absolute inset-x-0 h-px bg-primary shadow-[0_0_18px_var(--primary)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/70 to-transparent" />
      </div>

      <div className="absolute inset-x-6 bottom-6 flex items-end justify-between sm:inset-x-10 sm:bottom-8">
        <span aria-hidden="true" className="film-boot-counter text-[clamp(64px,12vw,160px)] font-black leading-[0.8] tracking-[-0.06em] tabular-nums" />
        <span className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/50">Enter · atla</span>
      </div>
    </div>
  )
}
