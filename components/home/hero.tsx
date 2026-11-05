'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Info, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, genreTr, pickTitle, splitTitle, stripHtml } from '@/lib/format'
import { setPrefs, usePrefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'
import { BackdropImage } from '@/components/media/backdrop-image'
import { YTTrailer, isTrailerBroken, type YTHandle } from '@/components/media/yt-trailer'

const SLIDE_MS = 9000

export function Hero({ items }: { items: MediaCard[] }) {
  const slides = items.slice(0, 5)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [trailerOn, setTrailerOn] = useState(false)
  const [trailerPlaying, setTrailerPlaying] = useState(false)
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const yt = useRef<YTHandle>(null)
  const prefs = usePrefs()
  const media = slides[index]

  const go = useCallback(
    (i: number) => {
      setIndex((i + slides.length) % slides.length)
      setTrailerOn(false)
      setTrailerPlaying(false)
    },
    [slides.length],
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

  if (!media) return null
  const title = pickTitle(media.title)
  const { head, tail } = splitTitle(title)
  const trailerId = media.trailer?.site === 'youtube' ? media.trailer.id : null
  const showTrailer = Boolean(trailerId) && trailerOn && prefs.autoplayTrailers && !failed[media.id] && !isTrailerBroken(trailerId)
  const barStyle: React.CSSProperties = {
    animation: `hero-progress ${SLIDE_MS}ms linear forwards`,
    animationPlayState: paused || trailerPlaying ? 'paused' : 'running',
  }
  const onBarEnd = () => go(index + 1)

  return (
    <section className="dark relative isolate overflow-hidden bg-scrim text-foreground" aria-roledescription="carousel" aria-label="Öne çıkan animeler">
      <div className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          <motion.div
            key={media.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.9 }, scale: { duration: 8, ease: 'linear' } }}
          >
            <BackdropImage media={media} priority={index === 0} />
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
        <div className="absolute inset-0 bg-gradient-to-r from-scrim via-scrim/70 to-transparent lg:via-scrim/40" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-page to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-scrim/60 to-transparent" />
        <div className="grain absolute inset-0" />
      </div>

      <div className="mx-auto grid min-h-[min(86svh,860px)] max-w-[1440px] grid-cols-1 items-end gap-10 px-4 pb-14 pt-24 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:px-10 lg:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={media.id}
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{ show: { transition: { staggerChildren: 0.07 } }, exit: { opacity: 0, transition: { duration: 0.2 } } }}
            className="flex max-w-2xl flex-col gap-6"
          >
            <motion.p variants={fade} className="label-mono flex items-center gap-3 text-ink">
              <span className="h-px w-10 bg-primary" />
              Öne çıkan <span className="text-foreground/40">/</span> <span className="text-foreground/70">0{index + 1}</span>
            </motion.p>
            <motion.h1 variants={fade} className="text-balance text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl xl:text-[84px]">
              {head} <span className="font-serif font-normal italic tracking-[-0.01em] text-primary">{tail}</span>
            </motion.h1>
            <motion.div variants={fade} className="flex flex-wrap items-center gap-2">
              {[media.seasonYear, formatTr(media.format), media.episodes ? `${media.episodes} bölüm` : null].filter(Boolean).map((t) => (
                <span key={String(t)} className="rounded-full border border-foreground/20 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-foreground/80 backdrop-blur">
                  {t}
                </span>
              ))}
              {media.averageScore ? (
                <span className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary backdrop-blur">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {media.averageScore} / 100
                </span>
              ) : null}
              {media.genres?.slice(0, 2).map((g) => (
                <span key={g} className="hidden px-1 text-sm text-foreground/60 sm:inline">
                  {genreTr(g)}
                </span>
              ))}
            </motion.div>
            <motion.p variants={fade} className="line-clamp-3 max-w-xl text-pretty leading-relaxed text-foreground/75 sm:text-lg">
              {stripHtml(media.description)}
            </motion.p>
            <motion.div variants={fade} className="flex flex-wrap items-center gap-3">
              <Link
                href={`/anime/${media.id}`}
                className="group flex h-13 items-center gap-2.5 rounded-full bg-primary px-7 font-medium text-primary-foreground shadow-[0_10px_40px_-10px_var(--primary)] transition hover:brightness-110 active:scale-[0.98]"
              >
                <Play className="size-4 fill-current" />
                Detayları gör
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/ara" className="flex h-13 items-center gap-2 rounded-full border border-foreground/25 px-6 font-medium backdrop-blur transition hover:bg-foreground/10">
                <Info className="size-4" />
                Katalogda ara
              </Link>
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

        <div className="hidden flex-col gap-2 justify-self-end lg:flex lg:w-full lg:max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="label-mono text-foreground/60">Şu an trend</p>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Otomatik geçişi başlat' : 'Otomatik geçişi durdur'}
              className="flex items-center gap-2 font-mono text-[11px] text-foreground/60 transition hover:text-foreground"
            >
              {paused ? <Play className="size-3" /> : <Pause className="size-3" />}0{index + 1} / 0{slides.length}
            </button>
          </div>
          <ol className="flex flex-col gap-2">
            {slides.map((s, i) => {
              const active = i === index
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={active}
                    className={cn(
                      'group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-2.5 pr-4 text-left backdrop-blur-md transition',
                      active ? 'border-primary/50 bg-foreground/10' : 'border-foreground/10 bg-scrim/30 hover:bg-foreground/5',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.coverImage.large || '/placeholder.svg'} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate font-medium', active ? 'text-foreground' : 'text-foreground/75')}>{pickTitle(s.title)}</span>
                      <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wider text-foreground/50">{[s.seasonYear, formatTr(s.format)].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className={cn('font-mono text-xs', active ? 'text-primary' : 'text-foreground/40')}>0{i + 1}</span>
                    {active && <span key={index} className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-primary" style={barStyle} onAnimationEnd={onBarEnd} />}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="flex items-center gap-2 lg:hidden" role="tablist" aria-label="Slaytlar">
          {slides.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={i === index} aria-label={`${i + 1}. slayt`} onClick={() => go(i)} className="relative h-1 flex-1 overflow-hidden rounded-full bg-foreground/20">
              {i < index && <span className="absolute inset-0 bg-primary" />}
              {i === index && <span key={index} className="absolute inset-0 origin-left bg-primary" style={barStyle} onAnimationEnd={onBarEnd} />}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

const fade = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] as const } },
}
