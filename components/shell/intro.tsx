'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

/*
 * SYTHERIS — "Kare" (The Frame) · v6
 * Act I   : a counter climbs to 100 while trending covers flip through one centred frame, faster and faster.
 * Act II  : the last cover bursts out of its frame and becomes the whole screen.
 * Act III : the title rises out of the floor, the chrome slides in.
 * Exit    : the curtain lifts upward onto the site.
 *
 * Drop-in replacement for components/shell/intro.tsx — same props, same "intro-seen" contract.
 */

const TITLE = 'SYTHERIS'.split('')
const EXPO = [0.87, 0, 0.13, 1] as const
const OUT = [0.16, 1, 0.3, 1] as const
const LOAD_MS = 2600
const TITLE_DELAY_MS = 700
const HOLD_MS = 2600
const FLIP_START_MS = 260
const FLIP_DELAYS = [420, 340, 280, 220, 180, 150, 130, 115, 105]
const OPEN_CLIP = 'inset(0px 0px 0px 0px round 0px)'

type Phase = 'load' | 'open' | 'title'

type IntroProps = {
  covers: string[]
  enabled: boolean
  /** Ignores the "already seen" flag and never writes it. Used for replaying the intro on demand. */
  preview?: boolean
  onClose?: () => void
}

function frameClip() {
  if (typeof window === 'undefined') return OPEN_CLIP
  const W = window.innerWidth
  const H = window.innerHeight
  const h = Math.min(H * 0.42, W * 0.6)
  const w = (h * 2) / 3
  const y = (H - h) / 2
  const x = (W - w) / 2
  return `inset(${y}px ${x}px ${y}px ${x}px round 6px)`
}

export function Intro({ covers, enabled, preview = false, onClose }: IntroProps) {
  const reduce = useReducedMotion() ?? false
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState<Phase>('load')
  const [flip, setFlip] = useState(0)
  const [count, setCount] = useState(0)
  const [clock, setClock] = useState('')
  const [clip, setClip] = useState(OPEN_CLIP)
  const finished = useRef(false)
  const enterRef = useRef<HTMLButtonElement>(null)

  const reel = useMemo(() => {
    const list = covers.filter(Boolean).slice(0, FLIP_DELAYS.length + 1)
    return list.length ? list : ['/placeholder.svg']
  }, [covers])
  const finalCover = reel[reel.length - 1]

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    if (!preview) {
      try {
        sessionStorage.setItem('sy-intro-seen', '1')
      } catch {}
    }
    document.body.style.overflow = ''
    setShow(false)
  }, [preview])

  useEffect(() => {
    const seen = !preview && document.documentElement.classList.contains('intro-seen')
    if (!enabled || seen) {
      setShow(false)
      return
    }
    document.body.style.overflow = 'hidden'
    enterRef.current?.focus({ preventScroll: true })
    setClip(frameClip())

    const timers: number[] = []
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms))

    if (reduce) {
      setCount(100)
      setFlip(reel.length - 1)
      setPhase('title')
      later(finish, 2400)
    } else {
      let at = FLIP_START_MS
      for (let i = 1; i < reel.length; i++) {
        at += FLIP_DELAYS[i - 1] ?? 100
        const index = i
        later(() => setFlip(index), Math.min(at, LOAD_MS - 120))
      }
      later(() => setPhase('open'), LOAD_MS)
      later(() => setPhase('title'), LOAD_MS + TITLE_DELAY_MS)
      later(finish, LOAD_MS + TITLE_DELAY_MS + HOLD_MS)
    }

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / LOAD_MS)
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      setCount(Math.round(eased * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    if (!reduce) raf = requestAnimationFrame(tick)

    const fmt = () => setClock(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    fmt()
    const clockId = window.setInterval(fmt, 1000)
    const onResize = () => setClip(frameClip())
    window.addEventListener('resize', onResize)

    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', keys)

    return () => {
      timers.forEach(window.clearTimeout)
      cancelAnimationFrame(raf)
      window.clearInterval(clockId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', keys)
      document.body.style.overflow = ''
    }
  }, [enabled, preview, reduce, reel.length, finish])

  const loading = phase === 'load'
  const titled = phase === 'title'

  return (
    <AnimatePresence onExitComplete={onClose}>
      {show && (
        <motion.div
          id="sy-intro"
          key="intro"
          role="dialog"
          aria-modal="true"
          aria-label="SYTHERIS açılış animasyonu"
          className="dark fixed inset-0 z-[100] overflow-hidden bg-scrim text-on-scrim"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: reduce ? 0.3 : 0.95, ease: EXPO }}
          suppressHydrationWarning
        >
          {/* Act I — the reel inside the frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="relative aspect-[2/3] h-[min(42vh,60vw)] overflow-hidden rounded-md">
              <AnimatePresence initial={false}>
                <motion.img
                  key={flip}
                  src={reel[flip]}
                  alt=""
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                  initial={reduce ? false : { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.25 }}
                  animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
                  exit={{ opacity: 1 }}
                  transition={{ duration: 0.38, ease: OUT }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Act II — the final cover breaks out of the frame */}
          <motion.div
            className="absolute inset-0"
            aria-hidden="true"
            initial={false}
            animate={{ clipPath: loading ? clip : OPEN_CLIP, opacity: loading ? 0 : 1 }}
            transition={{ clipPath: { duration: reduce ? 0 : 1.15, ease: EXPO }, opacity: { duration: 0 } }}
          >
            <motion.img
              src={finalCover}
              alt=""
              decoding="async"
              className="size-full object-cover"
              initial={false}
              animate={{ scale: loading ? 1.35 : 1.04 }}
              transition={{ duration: reduce ? 0 : 2.4, ease: OUT }}
            />
            <div className="absolute inset-0 bg-scrim/45" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-scrim via-scrim/70 to-transparent" />
            <div className="grain absolute inset-0" />
          </motion.div>

          <div className="relative flex h-full flex-col">
            <header className="flex items-center justify-between gap-4 px-5 py-5 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/70 sm:px-10 sm:text-[11px]">
              <motion.span
                className="flex items-center gap-2"
                animate={{ opacity: 1 }}
                initial={reduce ? false : { opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <span className="size-1.5 rounded-full bg-primary" />
                SYTHERIS / V6.0
              </motion.span>
              <motion.span
                className="hidden tabular-nums md:inline"
                animate={{ opacity: titled ? 1 : 0, y: titled ? 0 : -8 }}
                transition={{ duration: 0.6, ease: OUT }}
                suppressHydrationWarning
              >
                TR · {clock || '--:--:--'}
              </motion.span>
              <button
                ref={enterRef}
                type="button"
                onClick={finish}
                className="group flex items-center gap-3 rounded-full border border-on-scrim/25 bg-scrim/40 py-2 pl-4 pr-2 text-on-scrim outline-none backdrop-blur-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-scrim"
              >
                {titled ? 'İçeri gir' : 'Atla'}
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-primary-foreground group-hover:text-primary">
                  <ArrowRight className="size-3" aria-hidden="true" />
                </span>
              </button>
            </header>

            <div className="relative flex-1">
              <motion.p
                className="absolute bottom-6 left-5 max-w-40 font-mono sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 text-[10px] uppercase leading-relaxed tracking-[0.3em] text-on-scrim/60 sm:left-10 sm:text-[11px]"
                animate={{ opacity: loading ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              >
                Trend kapaklar
                <br />
                yükleniyor
              </motion.p>

              <motion.div
                className="absolute bottom-0 right-5 font-bold leading-none tracking-[-0.06em] tabular-nums text-[22vw] sm:right-10 sm:text-[11rem]"
                animate={{ opacity: loading ? 1 : 0, y: loading ? 0 : 40 }}
                transition={{ duration: 0.5, ease: OUT }}
                aria-live="polite"
              >
                {String(count).padStart(3, '0')}
                <span className="sr-only">%</span>
              </motion.div>

              <motion.div
                className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-6 sm:inset-x-10"
                animate={{ opacity: titled ? 1 : 0, y: titled ? 0 : 16 }}
                transition={{ delay: titled ? 0.55 : 0, duration: 0.7, ease: OUT }}
              >
                <p className="max-w-xs text-pretty text-base leading-relaxed text-on-scrim/85 sm:text-lg">
                  Bir sonraki favori animen burada.
                </p>
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60 sm:block sm:text-[11px]">
                  Anime keşif platformu
                </p>
              </motion.div>
            </div>

            <h1 className="relative px-3 pb-3 sm:px-8 sm:pb-6" aria-label="SYTHERIS">
              <span
                className="flex justify-between overflow-hidden font-bold leading-[0.8] tracking-[-0.05em] text-[23.5vw]"
                aria-hidden="true"
              >
                {TITLE.map((letter, i) => (
                  <motion.span
                    key={i}
                    className="inline-block pt-[0.08em]"
                    initial={false}
                    animate={{ y: titled ? '0%' : '110%' }}
                    transition={{ delay: titled ? i * 0.045 : 0, duration: reduce ? 0 : 1.05, ease: OUT }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            </h1>

            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-on-scrim/10" aria-hidden="true">
              <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${count / 100})` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
