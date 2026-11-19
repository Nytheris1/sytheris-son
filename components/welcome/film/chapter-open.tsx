'use client'

import dynamic from 'next/dynamic'
import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react'
import { useSectionProgress } from '@/lib/use-section-progress'
import { useEffect, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { CoverDrift } from '../intro/cover-drift'
import { SceneBoundary, canUseWebGL } from '@/components/three/scene-boundary'

const IntroScene = dynamic(() => import('../intro/intro-scene'), { ssr: false, loading: () => null })

function Beat({ p, range, children, className }: { p: MotionValue<number>; range: [number, number, number, number]; children: React.ReactNode; className?: string }) {
  const opening = range[0] >= range[1]
  const input = opening ? range.slice(1) : range
  const opacity = useTransform(p, input, opening ? [1, 1, 0] : [0, 1, 1, 0])
  const y = useTransform(p, input, opening ? [0, 0, -50] : [50, 0, 0, -50])
  const blur = useTransform(p, input, opening ? ['blur(0px)', 'blur(0px)', 'blur(8px)'] : ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(8px)'])
  return (
    <motion.div style={{ opacity, y, filter: blur }} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Chapter 01 — 開幕. Trending covers spiral around a tower in 3D; scrolling drives the camera down
 * the tower and finally through it, where the white Introduction chapter is waiting.
 */
export function ChapterOpen({ covers, onSkip }: { covers: string[]; onSkip: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = Boolean(useReducedMotion())
  const scrollYProgress = useSectionProgress(ref, ['start start', 'end end'])
  const [active, setActive] = useState(true)
  const [compact, setCompact] = useState(false)
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const pct = useTransform(scrollYProgress, (v) => String(Math.round(v * 100)).padStart(3, '0'))
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])
  const whiteout = useTransform(scrollYProgress, [0.86, 1], [0, 1])

  useEffect(() => {
    setWebgl(canUseWebGL())
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => {
      io.disconnect()
      mq.removeEventListener('change', sync)
    }
  }, [])

  return (
    <section ref={ref} aria-label="Bölüm 01 — Açılış" className="relative h-[340vh] bg-scrim">
      <div data-intro-stage className="dark sticky top-0 h-dvh overflow-hidden bg-scrim text-on-scrim">
        <div className="absolute inset-0">
          {webgl === false && <CoverDrift covers={covers} progress={scrollYProgress} />}
          {webgl && (
            <SceneBoundary fallback={<CoverDrift covers={covers} progress={scrollYProgress} />}>
              <IntroScene covers={covers} progress={scrollYProgress} active={active} reduced={reduced} compact={compact} />
            </SceneBoundary>
          )}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_75%_at_50%_50%,transparent_35%,var(--scrim)_100%)]" />
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
        {/* The dive ends in white, which is where the Introduction chapter begins. */}
        <motion.div aria-hidden="true" style={{ opacity: whiteout }} className="pointer-events-none absolute inset-0 z-20 bg-on-scrim" />

        <header className="absolute inset-x-5 top-5 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] sm:inset-x-10 sm:top-8">
          <span className="flex items-center gap-2">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
            Bölüm 01
          </span>
          <span className="hidden text-on-scrim/50 md:inline">Kaydırarak oynat</span>
          <button type="button" onClick={onSkip} className="rounded-full border border-on-scrim/25 px-4 py-2 text-on-scrim/80 outline-none transition hover:border-on-scrim hover:text-on-scrim focus-visible:border-primary">
            Geç <span className="sr-only">tanıtım filmini</span>
          </button>
        </header>

        <div className="pointer-events-none absolute inset-0 z-10">
          <Beat p={scrollYProgress} range={[0, 0, 0.16, 0.26]} className="absolute inset-x-5 bottom-[16%] flex flex-col items-start gap-6 sm:inset-x-10 md:bottom-auto md:top-1/2 md:max-w-2xl md:-translate-y-1/2">
            <h1 lang="en" className="text-[clamp(64px,13vw,200px)] font-black uppercase leading-[0.8] tracking-[-0.06em]">
              Sytheris
            </h1>
            <p className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.5em] text-on-scrim/60">
              <span className="h-px w-10 bg-primary" />
              Anime · keşif · dergi
            </p>
            <button
              type="button"
              onClick={() => ref.current && window.scrollTo({ top: ref.current.offsetTop + ref.current.offsetHeight * 0.3, behavior: 'smooth' })}
              className="pointer-events-auto mt-2 flex h-12 items-center gap-2 rounded-full bg-on-scrim px-6 text-sm font-semibold text-scrim transition hover:opacity-90"
            >
              Kuleye in <ArrowDown className="size-4" aria-hidden="true" />
            </button>
          </Beat>

          <Beat p={scrollYProgress} range={[0.28, 0.36, 0.5, 0.58]} className="absolute inset-x-5 bottom-[16%] flex flex-col gap-4 sm:inset-x-10 md:bottom-auto md:left-auto md:right-16 md:top-1/2 md:max-w-md md:-translate-y-1/2 md:items-end md:text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">Her kapak bir dünya</p>
            <h2 className="text-balance text-5xl font-bold leading-[0.92] tracking-[-0.045em] sm:text-7xl">Binlerce seri, tek bir kule.</h2>
            <p className="max-w-sm text-pretty leading-relaxed text-on-scrim/65">Etrafında dönen her afiş şu an Türkiye’de konuşulan bir seri. Fareyle üstüne gel; renklensin.</p>
          </Beat>

          <Beat p={scrollYProgress} range={[0.6, 0.68, 0.8, 0.88]} className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-5 text-center">
            <span aria-hidden="true" className="absolute left-1/2 top-1/2 -z-10 h-[160%] w-[min(820px,100%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,var(--scrim)_25%,transparent)]" />
            <h2 className="text-[clamp(56px,10vw,150px)] font-black uppercase leading-[0.82] tracking-[-0.06em]">İçeri dal.</h2>
          </Beat>
        </div>

        <footer aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-5 z-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/55 sm:inset-x-10 sm:bottom-8">
          <motion.span className="tabular-nums text-on-scrim">{pct}</motion.span>
          <span className="relative h-px flex-1 bg-on-scrim/20">
            <motion.span style={{ scaleX: bar }} className="absolute inset-0 origin-left bg-on-scrim" />
          </span>
          <span>Kaydır</span>
        </footer>
      </div>
    </section>
  )
}
