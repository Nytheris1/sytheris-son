'use client'

/**
 * SYTHERIS — boot sequence.
 *   load    — a small device window floats tilted in the dark; the key art fills it as the counter runs to 100
 *   expand  — the window flattens, drops its bezel and grows past the edges of the screen
 *   exit    — the frame is wiped upward, revealing the site (first-time visitors land on the scroll prologue)
 * The load phase is CSS-driven (app/intro.css) so it plays from first paint; JS only schedules the hand-off,
 * reading the CSS animation's own clock so a slow hydration never leaves the counter frozen or cut short.
 * Keeps the `#sy-intro` id + `sy-intro-seen` session key so the boot script can hide it pre-paint.
 */

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Phase = 'play' | 'exit' | 'done'

/** Mirrors app/intro.css: exit starts at 3070ms and lasts 850ms; a skip wipes in 650ms. */
const EXIT_AT_MS = 3070
const TOTAL_MS = EXIT_AT_MS + 850
const SKIP_MS = 650

const COPY = {
  anime: {
    tagline: 'Anime keşif platformu',
    status: ['Evren hazırlanıyor', 'Kapaklar diziliyor', 'Işıklar kısılıyor', 'Perde açılıyor'],
  },
  film: {
    tagline: 'Film keşif platformu',
    status: ['Projektör ısınıyor', 'Makaralar takılıyor', 'Salon kararıyor', 'Seans başlıyor'],
  },
}

/** How far the CSS timeline has already run — hydration can land well after the intro started playing. */
function elapsed() {
  const el = document.getElementById('sy-intro')
  const anim = el?.getAnimations().find((a) => (a as CSSAnimation).animationName === 'intro-exit')
  const t = anim?.currentTime
  return typeof t === 'number' ? t : 0
}

export function Intro({ covers, keyart, enabled, mode = 'anime' }: { covers: string[]; keyart: string; enabled: boolean; mode?: 'anime' | 'film' }) {
  const [phase, setPhase] = useState<Phase>('play')
  const router = useRouter()
  const pathname = usePathname()
  const timers = useRef<number[]>([])

  const firstVisit = useCallback(() => {
    try {
      return !localStorage.getItem('sy-welcomed') && pathname === '/'
    } catch {
      return false
    }
  }, [pathname])

  const done = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    try {
      sessionStorage.setItem('sy-intro-seen', '1')
    } catch {}
    document.documentElement.style.overflow = ''
    document.documentElement.classList.add('intro-seen')
    setPhase('done')
  }, [])

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    try {
      sessionStorage.setItem('sy-intro-seen', '1')
    } catch {}
    if (firstVisit()) {
      router.push('/hosgeldin')
      return
    }
    document.documentElement.style.overflow = ''
    setPhase('exit')
    timers.current.push(window.setTimeout(done, SKIP_MS + 50))
  }, [done, firstVisit, router])

  useEffect(() => {
    // First-time visitors get the welcome film, which has its own opening slate — never two intros back to back.
    if (enabled && firstVisit()) {
      try {
        sessionStorage.setItem('sy-intro-seen', '1')
      } catch {}
      router.replace('/hosgeldin')
      return
    }
    let skip = !enabled
    try {
      skip ||= Boolean(sessionStorage.getItem('sy-intro-seen')) || localStorage.getItem('sy-intro') === '0'
    } catch {}
    if (skip) {
      setPhase('done')
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion')
    if (reduce) {
      done()
      return
    }

    const t = elapsed()
    if (t < EXIT_AT_MS) document.documentElement.style.overflow = 'hidden'
    timers.current.push(window.setTimeout(() => (document.documentElement.style.overflow = ''), Math.max(0, EXIT_AT_MS - t)))
    timers.current.push(window.setTimeout(done, Math.max(0, TOTAL_MS + 50 - t)))

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      timers.current.forEach(clearTimeout)
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [enabled, done, finish, firstVisit, router])

  if (phase === 'done') return null

  const copy = COPY[mode]
  const strip = covers.filter(Boolean).slice(0, 7)

  return (
    <div
      id="sy-intro"
      role="dialog"
      aria-modal="true"
      aria-label="Sytheris açılış animasyonu"
      data-phase={phase}
      className={cn('intro dark fixed inset-0 z-[200] overflow-hidden bg-scrim text-on-scrim', mode === 'film' && 'cine')}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_oklch,var(--on-scrim)_9%,transparent),transparent_70%)]" />
      <div aria-hidden="true" className="grain absolute inset-0" />

      <div className="absolute inset-0 grid place-items-center [perspective:1400px]">
        <div
          aria-hidden="true"
          className="intro-glow pointer-events-none absolute left-1/2 top-[64%] h-[30vh] w-[70vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_45%,transparent),transparent)] blur-3xl"
        />
        <div className="intro-stage">
          <div className="intro-window relative aspect-[16/10] w-[min(84vw,640px)] bg-on-scrim/[0.07] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)] ring-1 ring-on-scrim/15 backdrop-blur-md">
            <div className="relative size-full overflow-hidden rounded-[inherit] bg-scrim">
              <div className="intro-reveal absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={keyart || '/placeholder.svg'} alt="" fetchPriority="high" className={cn('size-full scale-110 object-cover', mode === 'film' ? 'object-[50%_20%]' : 'object-[50%_30%]')} />
              </div>
              <div className="intro-scan absolute inset-x-0 h-px bg-primary shadow-[0_0_18px_var(--primary)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,color-mix(in_oklch,var(--scrim)_80%,transparent))]" />
              <span className="absolute left-3 top-3 font-mono text-xs sm:left-4 sm:top-4 sm:text-sm">(SYTHERIS)</span>
              <span className="absolute right-3 top-3 font-mono text-[9px] uppercase tracking-[0.24em] text-on-scrim/60 sm:right-4 sm:top-4">
                {mode === 'film' ? '[ sinema ]' : '[ v.26 ]'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="intro-chrome pointer-events-none absolute inset-0">
        <div className="absolute inset-x-5 top-[max(1.25rem,env(safe-area-inset-top))] flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-on-scrim/60 sm:inset-x-10 sm:top-7">
          <span className="flex items-center gap-2">
            <span className="text-on-scrim/35">[</span>
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
            <span className="text-on-scrim/85">SYTHERIS</span>
            <span className="text-on-scrim/35">]</span>
          </span>
          <span className="hidden md:inline">{copy.tagline}</span>
          <span>TR · {new Date().getFullYear()}</span>
        </div>

        {strip.length > 0 && (
          <div aria-hidden="true" className="intro-strip absolute left-5 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:left-10 lg:flex" style={{ '--n': strip.length } as React.CSSProperties}>
            {strip.map((src, i) => (
              <div key={i} className="h-12 w-8 overflow-hidden rounded-md ring-1 ring-on-scrim/15" style={{ '--i': i } as React.CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src || '/placeholder.svg'} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="absolute inset-x-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] flex items-end justify-between gap-6 sm:inset-x-10 sm:bottom-7">
          <div className="flex flex-col gap-2">
            <span className="intro-status grid font-mono text-[10px] uppercase tracking-[0.28em] text-on-scrim/50" role="status">
              {copy.status.map((s, i) => (
                <span key={s} style={{ '--i': i } as React.CSSProperties}>
                  {s}…
                </span>
              ))}
            </span>
            <span className="h-px w-32 overflow-hidden bg-on-scrim/15 sm:w-40">
              <span className="intro-bar block h-full bg-on-scrim" />
            </span>
          </div>
          <span className="intro-counter font-mono text-[clamp(3.5rem,12vw,9rem)] font-medium leading-[0.8] tracking-[-0.06em] tabular-nums" aria-hidden="true" />
        </div>
      </div>

      <button
        type="button"
        onClick={finish}
        className="absolute right-5 top-14 flex items-center gap-2 rounded-full border border-on-scrim/20 bg-scrim/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-on-scrim/75 outline-none backdrop-blur transition hover:border-primary hover:text-on-scrim focus-visible:border-primary sm:right-10 sm:top-16"
      >
        Geç <kbd className="hidden rounded border border-on-scrim/20 px-1 text-[9px] sm:inline">Esc</kbd>
        <span className="sr-only">açılış animasyonunu</span>
      </button>
    </div>
  )
}
