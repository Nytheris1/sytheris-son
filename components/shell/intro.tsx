'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { THEMES } from '@/lib/themes'
import { useTheme } from '@/components/providers/theme-provider'
import { CoverWall } from './cover-wall'

const LETTERS = 'SYTHERIS'.split('')

export function Intro({ covers, enabled }: { covers: string[]; enabled: boolean }) {
  const { theme } = useTheme()
  const [show, setShow] = useState(true)
  const [ready, setReady] = useState(false)
  const [cycle, setCycle] = useState(0)
  const [pct, setPct] = useState(0)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const seen = document.documentElement.classList.contains('intro-seen')
    if (!enabled || seen) {
      setShow(false)
      return
    }
    setReady(true)
    document.body.style.overflow = 'hidden'
    const start = performance.now()
    const total = 3400
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total)
      setPct(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const done = window.setTimeout(() => finish(), total + 300)
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', keys)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(done)
      window.removeEventListener('keydown', keys)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => {
    if (!ready) return
    const fmt = () => setClock(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    fmt()
    const id = window.setInterval(fmt, 1000)
    return () => window.clearInterval(id)
  }, [ready])

  const targetIndex = Math.max(0, THEMES.findIndex((t) => t.id === theme))
  const totalSteps = THEMES.length * 2 + targetIndex
  useEffect(() => {
    if (!ready) return
    if (cycle >= totalSteps) return
    const delay = 120 + Math.pow(cycle / totalSteps, 3) * 360
    const id = window.setTimeout(() => setCycle((c) => c + 1), delay + (cycle === 0 ? 900 : 0))
    return () => window.clearTimeout(id)
  }, [cycle, ready, totalSteps])

  const current = THEMES[cycle % THEMES.length]
  const landed = cycle >= totalSteps

  function finish() {
    try {
      sessionStorage.setItem('sy-intro-seen', '1')
    } catch {}
    document.body.style.overflow = ''
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="sy-intro"
          key="intro"
          className="dark fixed inset-0 z-[100] overflow-hidden bg-scrim text-on-scrim"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          data-theme={current.id}
          suppressHydrationWarning
        >
          <CoverWall covers={covers} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--scrim)_75%)]" />
          <div className="absolute inset-0 bg-scrim/55 backdrop-blur-sm" />
          <div className="grain absolute inset-0" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between px-5 pt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60 sm:px-10 sm:pt-8 sm:text-[11px]">
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary transition-colors duration-300" />
                Sytheris / v4.0
              </span>
              <span className="hidden sm:inline">Kişisel anime evreni</span>
              <span className="tabular-nums">{clock}</span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-4">
              <motion.p
                initial={{ opacity: 0, letterSpacing: '0.1em' }}
                animate={{ opacity: 1, letterSpacing: '0.5em' }}
                transition={{ delay: 0.2, duration: 1.2, ease: 'easeOut' }}
                className="mb-6 flex items-center gap-4 font-mono text-[10px] uppercase text-on-scrim/60 sm:text-xs"
              >
                <span className="h-px w-10 bg-primary transition-colors duration-300" />
                Anime keşif platformu
                <span className="h-px w-10 bg-primary transition-colors duration-300" />
              </motion.p>

              <h1 className="flex overflow-hidden text-[19vw] font-bold leading-[0.85] tracking-[-0.04em] sm:text-[15vw] lg:text-[11rem]">
                {LETTERS.map((l, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: '110%', rotate: 8, opacity: 0 }}
                    animate={{ y: '0%', rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.9, ease: [0.2, 0.9, 0.1, 1] }}
                    className="inline-block"
                  >
                    {l}
                  </motion.span>
                ))}
              </h1>

              <div className="mt-6 flex h-10 items-center gap-3 overflow-hidden rounded-full border border-white/10 bg-white/5 px-5 backdrop-blur-md sm:mt-8">
                <span className="size-2.5 rounded-full bg-primary shadow-[0_0_24px_var(--primary)] transition-colors duration-200" />
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={cycle}
                    initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -24, opacity: 0, filter: 'blur(6px)' }}
                    transition={{ duration: 0.22 }}
                    className="font-serif text-2xl italic text-primary sm:text-3xl"
                  >
                    {current.name}
                  </motion.span>
                </AnimatePresence>
              </div>
              <motion.p
                animate={{ opacity: landed ? 1 : 0, y: landed ? 0 : 6 }}
                className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/50"
              >
                Tema hazır
              </motion.p>
            </div>

            <div className="flex items-end justify-between px-5 pb-6 sm:px-10 sm:pb-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60 sm:text-[11px]">
                <span className="tabular-nums text-on-scrim">{String(pct).padStart(3, '0')}</span> / Yükleniyor
              </div>
              <button
                type="button"
                onClick={finish}
                className="group flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.3em] text-on-scrim backdrop-blur-md transition hover:bg-primary hover:text-primary-foreground"
              >
                İçeri gir
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
              <div className="h-full bg-primary transition-[width,background-color] duration-200" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}