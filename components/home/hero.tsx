'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Pause, Play, Star, Volume2, VolumeX } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, genreTr, pickTitle, stripHtml } from '@/lib/format'
import { setPrefs, usePrefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'
import { BackdropImage } from '@/components/media/backdrop-image'
import { YTTrailer, isTrailerBroken, type YTHandle } from '@/components/media/yt-trailer'
import { StyledTitle } from '@/components/anime/styled-title'

const SLIDE_MS = 9000
const OUT = [0.16, 1, 0.3, 1] as const

export function Hero({ items }: { items: MediaCard[] }) {
  const slides = items.slice(0, 5)
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)
  const [trailerOn, setTrailerOn] = useState(false)
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const yt = useRef<YTHandle>(null)
  const prefs = usePrefs()
  const media = slides[index]

  const go = useCallback(
    (i: number) => {
      setDir(i >= index ? 1 : -1)
      setIndex((i + slides.length) % slides.length)
      setTrailerOn(false)
      setTrailerPlaying(false)
    },
    [index, slides.length],
  )

  useEffect(() => {
    if (document.documentElement.classList.contains('reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true)
  }, [])

  useEffect(() => {
    if (!media) return
    const id = window.setTimeout(() => setTrailerOn(true), 2600)
    return () => window.clearTimeout(id)
  }, [media])

  useEffect(() => {
    if (!trailerPlaying) return
    if (prefs.trailerSound) yt.current?.unMute()
    else yt.current?.mute()
  }, [prefs.trailerSound, trailerPlaying])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [role="dialog"]')) return
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index])

  if (!media) return null
  const title = pickTitle(media.title)
  const trailerId = media.trailer?.site === 'youtube' ? media.trailer.id : null
  const showTrailer = Boolean(trailerId) && trailerOn && prefs.autoplayTrailers && !prefs.dataSaver && !failed[media.id] && !isTrailerBroken(trailerId)
  const barStyle: React.CSSProperties = {
    animation: `hero-progress ${SLIDE_MS}ms linear forwards`,
    animationPlayState: paused || trailerPlaying ? 'paused' : 'running',
  }

  return (
    <section className="dark relative isolate overflow-hidden bg-scrim text-foreground" aria-roledescription="carousel" aria-label="Öne çıkan animeler">
      <div className="absolute inset-0 -z-10">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={media.id}
            custom={dir}
            className="absolute inset-0"
            variants={{
              enter: (d: number) => ({ clipPath: d > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }),
              center: { clipPath: 'inset(0% 0% 0% 0%)' },
              exit: { opacity: 0.6 },
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ clipPath: { duration: 1, ease: [0.76, 0, 0.24, 1] }, opacity: { duration: 1 } }}
          >
            <motion.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 9, ease: 'linear' }}>
              <BackdropImage media={media} priority={index === 0} />
            </motion.div>
            {showTrailer && trailerId && (
              <YTTrailer
                ref={yt}
                videoId={trailerId}
                start={6}
                loop={false}
                onPlaying={() => setTrailerPlaying(true)}
                onEnded={() => go(index + 1)}
                onError={() => {
                  setFailed((f) => ({ ...f, [media.id]: true }))
                  setTrailerPlaying(false)
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-scrim via-scrim/70 to-transparent lg:via-scrim/35" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-page via-page/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-scrim/70 to-transparent" />
        <div className="grain absolute inset-0" />
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-28 hidden select-none font-mono text-[11px] uppercase tracking-[0.5em] text-foreground/40 [writing-mode:vertical-rl] 2xl:block"
      >
        Trend · {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </span>

      <div className="mx-auto grid min-h-[min(94svh,920px)] max-w-[1440px] grid-cols-1 content-end gap-10 px-4 pb-8 pt-24 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:px-10 lg:pb-10">
        {/* Outgoing and incoming slides share one grid cell, so the block never collapses to zero height mid-swap.
            A collapse here shifted everything below the hero and made the page jump while scrolling. */}
        <div className="grid min-h-[30rem] items-end sm:min-h-[28rem] [&>*]:[grid-area:1/1]">
        <AnimatePresence initial={false}>
          <motion.div
            key={media.id}
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{ show: { transition: { staggerChildren: 0.08 } }, exit: { opacity: 0, y: -10, transition: { duration: 0.25 } } }}
            className="flex max-w-3xl flex-col gap-6"
          >
            <motion.div variants={fade} className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                #{String(index + 1).padStart(2, '0')} Trend
              </span>
              {[media.seasonYear, formatTr(media.format), media.episodes ? `${media.episodes} bölüm` : null].filter(Boolean).map((t) => (
                <span key={String(t)} className="rounded-full border border-foreground/20 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-foreground/80 backdrop-blur">
                  {t}
                </span>
              ))}
              {media.averageScore ? (
                <span className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary backdrop-blur">
                  <Star className="size-3 fill-current" />
                  {media.averageScore}
                </span>
              ) : null}
            </motion.div>

            <div style={{ ['--cover-color' as string]: media.coverImage.color ?? 'var(--primary)' }}>
              <StyledTitle title={title} genres={media.genres} className="text-5xl sm:text-6xl lg:text-7xl xl:text-[88px]" />
            </div>

            <motion.p variants={fade} className="line-clamp-3 max-w-xl text-pretty leading-relaxed text-foreground/75 sm:text-lg">
              {stripHtml(media.description)}
            </motion.p>
            <motion.div variants={fade} className="flex flex-wrap items-center gap-2 text-sm text-foreground/60">
              {media.genres?.slice(0, 4).map((g, i) => (
                <span key={g} className="flex items-center gap-2">
                  {i > 0 && <span className="size-1 rounded-full bg-primary" />}
                  {genreTr(g)}
                </span>
              ))}
            </motion.div>
            <motion.div variants={fade} className="flex flex-wrap items-center gap-3">
              <Link
                href={`/anime/${media.id}`}
                className="group flex h-13 items-center gap-3 rounded-full bg-primary pl-6 pr-2 font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_var(--primary)] transition hover:brightness-110 active:scale-[0.98]"
              >
                <Play className="size-4 fill-current" />
                Detayları gör
                <span className="grid size-9 place-items-center rounded-full bg-primary-foreground text-primary transition-transform duration-500 group-hover:rotate-[-45deg]">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Otomatik geçişi başlat' : 'Otomatik geçişi durdur'}
                className="grid size-13 place-items-center rounded-full border border-foreground/25 backdrop-blur transition hover:bg-foreground/10"
              >
                {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              </button>
              {trailerPlaying && (
                <button
                  type="button"
                  onClick={() => setPrefs({ trailerSound: !prefs.trailerSound })}
                  aria-label={prefs.trailerSound ? 'Fragman sesini kapat' : 'Fragman sesini aç'}
                  className="grid size-13 place-items-center rounded-full border border-foreground/25 backdrop-blur transition hover:bg-foreground/10"
                >
                  {prefs.trailerSound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
        </div>

        <PosterCard media={media} index={index} total={slides.length} />

        <ol className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:col-span-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0" aria-label="Slaytlar">
          {slides.map((s, i) => {
            const active = i === index
            return (
              <li key={s.id} className="w-[64vw] shrink-0 snap-start sm:w-[40vw] lg:w-auto">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={active}
                  aria-label={`${i + 1}. slayt: ${pickTitle(s.title)}`}
                  className={cn('group relative flex w-full items-center gap-3 rounded-2xl p-2 text-left transition', active ? 'bg-foreground/10 backdrop-blur' : 'opacity-60 hover:bg-foreground/5 hover:opacity-100')}
                >
                  <span className={cn('relative block aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-lg ring-1 transition', active ? 'ring-primary' : 'ring-foreground/10')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.coverImage.large || s.coverImage.extraLarge || '/placeholder.svg'} alt="" className="size-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="font-mono text-[10px] text-foreground/50">{String(i + 1).padStart(2, '0')} · {active ? 'Şimdi' : i === (index + 1) % slides.length ? 'Sıradaki' : formatTr(s.format) || 'Anime'}</span>
                    <span className="truncate text-sm font-medium">{pickTitle(s.title)}</span>
                    <span className="relative h-0.5 w-full overflow-hidden rounded-full bg-foreground/15">
                      {i < index && <span className="absolute inset-0 bg-foreground/50" />}
                      {active && <span key={index} className="absolute inset-0 origin-left bg-primary" style={barStyle} onAnimationEnd={() => go(index + 1)} />}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function PosterCard({ media, index, total }: { media: MediaCard; index: number; total: number }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const cover = media.coverImage.extraLarge || media.coverImage.large
  if (!cover) return null
  return (
    <div className="relative hidden lg:block" style={{ perspective: '1200px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={media.id}
          initial={{ opacity: 0, rotateY: -35, x: 60 }}
          animate={{ opacity: 1, rotateY: -10 + tilt.x, rotateX: tilt.y, x: 0 }}
          exit={{ opacity: 0, rotateY: 25, x: -40, transition: { duration: 0.35 } }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: -((e.clientY - r.top) / r.height - 0.5) * 12 })
          }}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
          className="sy-holo relative aspect-[2/3] w-[260px] overflow-hidden rounded-[1.4rem] shadow-[0_40px_80px_-20px_rgb(0_0_0/0.7)] ring-1 ring-foreground/20 xl:w-[300px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-scrim/80">Vol. {String(index + 1).padStart(2, '0')}</span>
            <span className="font-mono text-[10px] text-on-scrim/60">
              {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const fade = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: OUT } },
}
