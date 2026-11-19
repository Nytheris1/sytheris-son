'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { Film } from '@/lib/films'
import { usePrefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'

const SLIDE_MS = 11000
const OUT = [0.16, 1, 0.3, 1] as const

/**
 * Cinema-mode hero. Each slide shows the poster as a blurred projection, the sharp one-sheet on the right,
 * and after a beat starts the official trailer muted behind the title (respecting the autoplay preference).
 */
export function FilmHero({ items }: { items: Film[] }) {
  const slides = items.filter((f) => f.poster).slice(0, 5)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [muted, setMuted] = useState(true)
  const video = useRef<HTMLVideoElement>(null)
  const prefs = usePrefs()
  const film = slides[index]

  const go = useCallback((i: number) => {
    setRolling(false)
    setIndex(((i % slides.length) + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (paused || rolling) return
    const id = window.setTimeout(() => go(index + 1), SLIDE_MS)
    return () => window.clearTimeout(id)
  }, [index, paused, rolling, go])

  useEffect(() => {
    if (!film?.trailer || !prefs.autoplayTrailers || prefs.dataSaver) return
    const id = window.setTimeout(() => setRolling(true), 2600)
    return () => window.clearTimeout(id)
  }, [film?.trailer, prefs.autoplayTrailers, prefs.dataSaver, index])

  if (!film) return null

  return (
    <section className="dark relative isolate flex min-h-[88svh] flex-col overflow-hidden bg-scrim text-foreground" aria-roledescription="carousel" aria-label="Öne çıkan filmler" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <AnimatePresence mode="popLayout">
        <motion.div key={film.id} className="absolute inset-0 -z-20" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: OUT }} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={film.posterLg || '/placeholder.svg'} alt="" className="size-full scale-125 object-cover opacity-45 blur-3xl saturate-125" />
        </motion.div>
      </AnimatePresence>

      {rolling && film.trailer && (
        <motion.video
          key={`v-${film.id}`}
          ref={video}
          src={film.trailer}
          autoPlay
          muted={muted}
          playsInline
          onEnded={() => go(index + 1)}
          onError={() => setRolling(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ duration: 1.6 }}
          className="absolute inset-0 -z-10 size-full object-cover"
          aria-hidden="true"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--scrim)_0%,color-mix(in_oklch,var(--scrim)_75%,transparent)_45%,transparent_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-page to-transparent" aria-hidden="true" />
      <div className="cine-beam absolute inset-0 -z-10" aria-hidden="true" />
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
      <span className="cine-letterbox top-0" aria-hidden="true" />
      <span className="cine-letterbox bottom-0" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:px-10">
        <AnimatePresence mode="wait">
          <motion.div key={film.id} className="flex max-w-2xl flex-col gap-6" initial="hidden" animate="show" exit="hidden" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
            <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.6, ease: OUT }} className="label-mono flex items-center gap-3 text-primary">
              <span className="font-semibold">#{index + 1}</span>
              <span className="h-px w-8 bg-primary" />
              Türkiye listesinde · {film.genreTr}
            </motion.p>
            <motion.h1 variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.8, ease: OUT }} className="text-balance text-5xl font-bold leading-[0.92] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
              {film.title}
            </motion.h1>
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.6, ease: OUT }} className="cine-ticket flex w-fit items-stretch rounded-lg font-mono text-[10px] uppercase tracking-[0.2em]" style={{ '--stub': 'calc(100% - 4.5rem)' } as React.CSSProperties}>
              <span className="flex flex-col justify-center gap-1 px-4 py-2.5">
                <span className="text-foreground/50">Yönetmen</span>
                <span className="text-foreground/90">{film.director || 'Bilinmiyor'}</span>
              </span>
              <span className="my-2 w-px bg-foreground/15" aria-hidden="true" />
              <span className="flex flex-col justify-center gap-1 px-4 py-2.5">
                <span className="text-foreground/50">Tür</span>
                <span className="text-foreground/90">{film.genreTr}</span>
              </span>
              <span className="my-1 border-l border-dashed border-foreground/25" aria-hidden="true" />
              <span className="flex w-[4.5rem] flex-col items-center justify-center gap-1 py-2.5 text-ink">
                <span className="text-foreground/50">Yıl</span>
                <span className="text-sm font-semibold tracking-[0.1em]">{film.year ?? '—'}</span>
              </span>
            </motion.div>
            {film.summary && (
              <motion.p variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.6, ease: OUT }} className="line-clamp-3 max-w-xl text-pretty leading-relaxed text-foreground/75">
                {film.summary}
              </motion.p>
            )}
            <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.6, ease: OUT }} className="flex flex-wrap items-center gap-3">
              <Link href={`/film/${film.id}`} className="group flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                <Play className="size-4 fill-current" /> Fragmanı izle
              </Link>
              <Link href={`/film/${film.id}`} className="group flex h-12 items-center gap-2 rounded-full border border-foreground/20 px-5 text-sm font-medium transition hover:border-foreground/60">
                Detaylar <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              {rolling && (
                <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Sesi aç' : 'Sesi kapat'} className="grid size-12 place-items-center rounded-full border border-foreground/20 transition hover:border-foreground/60">
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="relative hidden justify-self-end lg:block">
          <AnimatePresence mode="wait">
            <motion.div key={film.id} initial={{ opacity: 0, rotate: 4, y: 30 }} animate={{ opacity: 1, rotate: -2, y: 0 }} exit={{ opacity: 0, rotate: -6, y: -20 }} transition={{ duration: 0.9, ease: OUT }} className="relative w-[300px] xl:w-[340px]">
              <span className="absolute -inset-4 -z-10 rounded-xl border border-primary/25 bg-scrim/60 shadow-[0_0_80px_-20px_var(--primary)]" aria-hidden="true" />
              <span className="cine-bulbs absolute inset-x-0 -top-4 h-4 -translate-y-1/2" aria-hidden="true" />
              <span className="cine-bulbs absolute inset-x-0 -bottom-4 h-4 translate-y-1/2" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={film.posterLg || '/placeholder.svg'} alt={`${film.title} afişi`} className="aspect-[2/3] w-full rounded-md object-cover shadow-[0_50px_100px_-30px_rgb(0_0_0/0.9)]" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] items-end gap-3 px-4 pb-16 sm:px-6 lg:px-10">
        <ol className="scrollbar-none flex flex-1 gap-3 overflow-x-auto" aria-label="Slaytlar">
          {slides.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <button type="button" onClick={() => go(i)} aria-current={i === index} aria-label={`${i + 1}. ${s.title}`} className={cn('group flex w-56 items-center gap-3 rounded-2xl p-2 text-left transition', i === index ? 'bg-foreground/10' : 'opacity-60 hover:opacity-100')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.poster || '/placeholder.svg'} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-xs font-semibold">{s.title}</span>
                  <span className="h-0.5 overflow-hidden rounded-full bg-foreground/15">
                    {i === index && <span key={`${index}-${paused}-${rolling}`} className={cn('block h-full origin-left bg-primary', !paused && !rolling && 'animate-[hero-progress_linear_forwards]')} style={{ animationDuration: `${SLIDE_MS}ms`, transform: paused || rolling ? 'scaleX(1)' : undefined }} />}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Oynat' : 'Duraklat'} className="hidden size-10 shrink-0 place-items-center rounded-full border border-foreground/20 transition hover:border-foreground/60 sm:grid">
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    </section>
  )
}
