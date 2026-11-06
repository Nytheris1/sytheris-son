'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { THEMES } from '@/lib/themes'
import { useTheme } from '@/components/providers/theme-provider'

/*
 * SYTHERIS — "Kesik" (The Cut)
 * Act I   : a single blade of light slices the darkness.
 * Act II  : the cut tears open onto a tilted, drifting wall of trending covers.
 * Act III : the title forges itself, an episode card cycles every theme and lands on the visitor's own.
 * Exit    : the whole world folds back into the diagonal slash.
 */

const TITLE = 'SYTHERIS'.split('')
const EXPO = [0.87, 0, 0.13, 1] as const
const OUT = [0.16, 1, 0.3, 1] as const
const CYCLE_START_MS = 1800
const FULL_FRAME = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
const SLASH_FRAME = 'polygon(0% 58%, 100% 42%, 100% 42%, 0% 58%)'

type IntroProps = {
  covers: string[]
  enabled: boolean
  /** Ignores the "already seen" flag and never writes it. Used for replaying the intro on demand. */
  preview?: boolean
  onClose?: () => void
}

export function Intro({ covers, enabled, preview = false, onClose }: IntroProps) {
  const { theme } = useTheme()
  const reduce = useReducedMotion() ?? false
  const [show, setShow] = useState(true)
  const [ready, setReady] = useState(false)
  const [cycle, setCycle] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [clock, setClock] = useState('')
  const finished = useRef(false)
  const enterRef = useRef<HTMLButtonElement>(null)

  const targetIndex = Math.max(0, THEMES.findIndex((t) => t.id === theme))
  const steps = reduce ? 0 : THEMES.length + targetIndex
  const delays = useMemo(() => Array.from({ length: steps }, (_, i) => 150 + Math.pow(i / Math.max(1, steps), 3) * 420), [steps])
  const runtime = reduce ? 1600 : CYCLE_START_MS + delays.reduce((a, b) => a + b, 0)

  const landed = reduce || cycle >= steps
  const current = THEMES[(reduce ? targetIndex : cycle) % THEMES.length]

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
    setReady(true)
    document.body.style.overflow = 'hidden'
    enterRef.current?.focus({ preventScroll: true })

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = now - start
      setElapsed(t)
      if (t < 12000) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const fmt = () => setClock(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    fmt()
    const clockId = window.setInterval(fmt, 1000)

    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', keys)
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(clockId)
      window.removeEventListener('keydown', keys)
      document.body.style.overflow = ''
    }
  }, [enabled, preview, finish])

  useEffect(() => {
    if (!ready || landed) return
    const id = window.setTimeout(() => setCycle((c) => c + 1), delays[cycle] + (cycle === 0 ? CYCLE_START_MS : 0))
    return () => window.clearTimeout(id)
  }, [ready, landed, cycle, delays])

  useEffect(() => {
    if (!ready || !landed) return
    const id = window.setTimeout(finish, reduce ? 2200 : 1700)
    return () => window.clearTimeout(id)
  }, [ready, landed, reduce, finish])

  const progress = Math.min(1, elapsed / runtime)
  const seconds = Math.floor(elapsed / 1000)
  const frames = Math.floor(((elapsed % 1000) / 1000) * 24)
  const timecode = `00:00:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`

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
          data-theme={current.id}
          initial={{ clipPath: FULL_FRAME }}
          exit={{ clipPath: SLASH_FRAME }}
          transition={{ duration: reduce ? 0.3 : 0.9, ease: EXPO }}
          suppressHydrationWarning
        >
          <motion.div
            className="absolute inset-0"
            initial={reduce ? false : { clipPath: 'inset(50% 0% 50% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ delay: 0.6, duration: 1.15, ease: EXPO }}
          >
            <CoverTunnel covers={covers} still={reduce} />
            <div className="absolute inset-0 bg-scrim/55" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--scrim)_75%)]" />
            <div className="grain absolute inset-0" />
          </motion.div>

          {!reduce && <BladeCut />}

          <div className="relative flex h-full flex-col">
            <motion.header
              initial={reduce ? false : { y: '-100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8, ease: OUT }}
              className="flex items-center justify-between border-b border-on-scrim/10 bg-scrim/70 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60 backdrop-blur-md sm:px-10 sm:py-5 sm:text-[11px]"
            >
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary transition-colors duration-300" />
                SYTHERIS / V5.0
              </span>
              <span className="hidden sm:inline">Kişisel anime evreni</span>
              <span className="tabular-nums" suppressHydrationWarning>
                TR · {clock || '--:--:--'}
              </span>
            </motion.header>

            <div className="flex flex-1 flex-col items-center justify-center px-4">
              <motion.p
                initial={reduce ? false : { opacity: 0, letterSpacing: '0.15em' }}
                animate={{ opacity: 1, letterSpacing: '0.5em' }}
                transition={{ delay: 1.15, duration: 1.4, ease: OUT }}
                className="mb-5 flex items-center gap-4 font-mono text-[10px] uppercase text-on-scrim/70 sm:mb-7 sm:text-xs"
              >
                <span className="h-px w-8 bg-primary transition-colors duration-300 sm:w-12" />
                Anime keşif platformu
                <span className="h-px w-8 bg-primary transition-colors duration-300 sm:w-12" />
              </motion.p>

              <ForgedTitle still={reduce} />

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.45, duration: 0.8, ease: OUT }}
                className="mt-7 flex items-center gap-4 sm:mt-10"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60 tabular-nums sm:text-xs">
                  Ep. {String(((reduce ? targetIndex : cycle) % THEMES.length) + 1).padStart(2, '0')}
                </span>
                <span className="h-6 w-px bg-on-scrim/20" />
                <span className="relative flex h-10 min-w-44 items-center overflow-hidden sm:h-12 sm:min-w-64">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={cycle}
                      initial={{ y: '100%', opacity: 0, filter: 'blur(8px)' }}
                      animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
                      exit={{ y: '-100%', opacity: 0, filter: 'blur(8px)' }}
                      transition={{ duration: 0.24, ease: OUT }}
                      className="whitespace-nowrap font-serif text-3xl italic text-primary sm:text-4xl"
                    >
                      {current.name}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.div>

              <motion.p
                aria-live="polite"
                animate={{ opacity: landed ? 1 : 0, y: landed ? 0 : 8 }}
                transition={{ duration: 0.5, ease: OUT }}
                className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60"
              >
                {landed ? 'Senin temanda — iyi seyirler' : ''}
              </motion.p>
            </div>

            <motion.footer
              initial={reduce ? false : { y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8, ease: OUT }}
              className="relative flex items-center justify-between gap-4 border-t border-on-scrim/10 bg-scrim/70 px-5 py-4 backdrop-blur-md sm:px-10 sm:py-5"
            >
              <div className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.3em] sm:text-[11px]">
                <span className="text-on-scrim/50">TIMECODE</span>
                <span className="tabular-nums text-on-scrim">{timecode}</span>
              </div>

              <ol className="hidden items-center gap-2 md:flex" aria-label="Temalar">
                {THEMES.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span
                      className={`block h-1 rounded-full transition-all duration-300 ${t.id === current.id ? 'w-10 bg-primary' : 'w-4 bg-on-scrim/20'}`}
                    />
                    <span className="sr-only">{t.name}</span>
                  </li>
                ))}
              </ol>

              <button
                ref={enterRef}
                type="button"
                onClick={finish}
                className="group flex items-center gap-3 rounded-full border border-on-scrim/20 bg-on-scrim/5 py-2.5 pl-5 pr-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-on-scrim outline-none backdrop-blur-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-scrim"
              >
                İçeri gir
                <kbd className="hidden rounded-md border border-current/30 px-1.5 py-0.5 text-[9px] tracking-widest opacity-70 sm:inline">ENTER</kbd>
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-primary-foreground group-hover:text-primary">
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>

              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-on-scrim/10">
                <div className="h-full origin-left bg-primary transition-colors duration-200" style={{ transform: `scaleX(${progress})` }} />
              </div>
            </motion.footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BladeCut() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }}
        transition={{ duration: 1.3, times: [0, 0.25, 0.7, 1], ease: 'easeOut' }}
        className="absolute inset-x-0 top-1/2 -mt-10 text-center font-mono text-[10px] uppercase tracking-[0.6em] text-on-scrim/60 sm:text-xs"
      >
        SYTHERIS SUNAR
      </motion.p>
      <motion.div
        className="absolute inset-x-0 top-1/2 h-0.5 origin-left bg-primary"
        style={{ boxShadow: '0 0 18px 2px var(--primary), 0 0 60px 6px var(--primary)' }}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0], scaleY: [1, 1, 6] }}
        transition={{ duration: 1.5, times: [0, 0.4, 1], ease: EXPO }}
      />
    </div>
  )
}

function ForgedTitle({ still }: { still: boolean }) {
  const size = 'text-[19vw] font-bold leading-[0.85] tracking-[-0.04em] sm:text-[15vw] lg:text-[11rem]'
  return (
    <h1 className="relative" aria-label="SYTHERIS">
      <span className={`flex overflow-hidden ${size}`} aria-hidden="true">
        {TITLE.map((l, i) => (
          <motion.span
            key={i}
            initial={still ? false : { y: '110%', opacity: 0, filter: 'blur(14px)' }}
            animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.95 + i * 0.055, duration: 1, ease: OUT }}
            className="inline-block"
          >
            {l}
          </motion.span>
        ))}
      </span>
      {!still && (
        <motion.span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 flex text-primary mix-blend-screen ${size}`}
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: [0, 0.85, 0], x: [-18, 6, 0] }}
          transition={{ delay: 1.35, duration: 0.9, times: [0, 0.35, 1], ease: OUT }}
        >
          {TITLE.join('')}
        </motion.span>
      )}
    </h1>
  )
}

function CoverTunnel({ covers, still }: { covers: string[]; still: boolean }) {
  const columns = 7
  const cols = useMemo(
    () =>
      Array.from({ length: columns }, (_, c) => {
        const list = covers.filter((_, i) => i % columns === c)
        const filled = list.length ? list : covers.slice(0, 5)
        return [...filled, ...filled]
      }),
    [covers],
  )

  if (!covers.length) return null

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-[-45%] flex gap-4 opacity-80"
      style={{ transformPerspective: 1600 }}
      initial={still ? false : { rotateX: 58, rotateZ: -26, scale: 1.5 }}
      animate={{ rotateX: 46, rotateZ: -18, scale: 1.05 }}
      transition={{ duration: 6, ease: OUT }}
    >
      {cols.map((list, c) => (
        <div
          key={c}
          className="flex min-w-0 flex-1 flex-col gap-4"
          style={
            still
              ? undefined
              : {
                  animation: `marquee ${46 + (c % 3) * 12}s linear infinite`,
                  animationDirection: c % 2 ? 'reverse' : 'normal',
                }
          }
        >
          {list.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src || '/placeholder.svg'} alt="" loading="eager" decoding="async" className="aspect-[2/3] w-full rounded-lg object-cover" />
          ))}
        </div>
      ))}
    </motion.div>
  )
}
