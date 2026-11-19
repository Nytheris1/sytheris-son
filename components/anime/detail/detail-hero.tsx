'use client'

import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Clock, Flame, Heart, Play, Share2, Trophy, Tv } from 'lucide-react'
import { toast } from 'sonner'
import type { MediaDetail } from '@/lib/anilist-types'
import { compact, formatTr, genreTr, pickTitle, statusTr } from '@/lib/format'
import { TITLE_STYLES, titleStyleFor } from '@/lib/title-fonts'
import { StyledTitle } from '@/components/anime/styled-title'
import { ScoreRing } from './score-ring'
import { Countdown } from './countdown'

const OUT = [0.16, 1, 0.3, 1] as const

function TiltPoster({ src, alt, color }: { src: string; alt: string; color?: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [10, -10]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 200, damping: 20 })
  const glareX = useTransform(mx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(my, [0, 1], ['0%', '100%'])

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r || e.pointerType !== 'mouse') return
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => {
        mx.set(0.5)
        my.set(0.5)
      }}
      initial={{ opacity: 0, y: 40, rotateY: -20 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 1, ease: OUT, delay: 0.15 }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="relative mx-auto w-48 sm:w-60 md:mx-0 md:w-full"
    >
      <div className="absolute -inset-3 -z-10 rounded-[2rem] opacity-50 blur-2xl" style={{ background: color ?? 'var(--primary)' }} aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-foreground/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src || '/placeholder.svg'} alt={alt} className="aspect-[2/3] w-full object-cover" fetchPriority="high" />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ background: useTransform([glareX, glareY], ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.45), transparent 55%)`) }}
        />
      </div>
    </motion.div>
  )
}

export function DetailHero({ media, firstEpisode, actions }: { media: MediaDetail; firstEpisode: number | null; actions: React.ReactNode }) {
  const title = pickTitle(media.title)
  const alt = media.title.romaji && media.title.romaji !== title ? media.title.romaji : media.title.english && media.title.english !== title ? media.title.english : null
  const tagNames = (media.tags ?? []).filter((t) => !t.isMediaSpoiler).sort((a, b) => b.rank - a.rank).map((t) => t.name)
  const style = titleStyleFor(media.genres, tagNames)
  const rankTop = media.rankings?.find((r) => r.allTime && r.type === 'RATED')
  const rankPop = media.rankings?.find((r) => r.allTime && r.type === 'POPULAR')
  const cover = media.coverImage.extraLarge || media.coverImage.large || '/placeholder.svg'

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Bağlantı kopyalandı')
      }
    } catch {}
  }

  return (
    <div className="relative mx-auto grid max-w-[1440px] items-end gap-10 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] lg:gap-14 lg:px-10 lg:pb-24 lg:pt-24">
      <TiltPoster src={cover} alt={title} color={media.coverImage.color} />

      <div className="relative flex min-w-0 flex-col gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: OUT }} className="flex flex-wrap items-center gap-2">
          <span className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-10 bg-primary" />
            {[formatTr(media.format), media.seasonYear].filter(Boolean).join(' · ')}
          </span>
          {media.status && (
            <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${media.status === 'RELEASING' ? 'bg-primary text-primary-foreground' : 'border border-foreground/20 text-foreground/70'}`}>
              {statusTr(media.status)}
            </span>
          )}
        </motion.div>

        <div className="relative flex flex-col gap-3" style={{ ['--cover-color' as string]: media.coverImage.color ?? 'var(--primary)' }}>
          <StyledTitle title={title} style={style} className="relative text-5xl sm:text-6xl lg:text-7xl xl:text-8xl" />
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {alt && <p className="text-lg text-foreground/55">{alt}</p>}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: OUT }}
          className="flex flex-wrap items-center gap-x-6 gap-y-4"
        >
          {media.averageScore ? <ScoreRing score={media.averageScore} /> : null}
          <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {[
              { icon: Tv, label: 'Bölüm', value: media.episodes ?? (media.nextAiringEpisode ? `${media.nextAiringEpisode.episode - 1}+` : '—') },
              { icon: Clock, label: 'Süre', value: media.duration ? `${media.duration} dk` : '—' },
              { icon: Flame, label: 'Popülerlik', value: compact(media.popularity) },
              { icon: Heart, label: 'Favori', value: compact(media.favourites) },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <dt className="flex items-center gap-1.5 text-xs text-foreground/50">
                  <s.icon className="size-3.5" />
                  {s.label}
                </dt>
                <dd className="font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          {(rankTop || rankPop) && (
            <div className="flex flex-col gap-1.5">
              {rankTop && (
                <span className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <Trophy className="size-3.5 text-primary" />#{rankTop.rank} tüm zamanların en yüksek puanlısı
                </span>
              )}
              {rankPop && (
                <span className="flex items-center gap-1.5 text-xs text-foreground/70">
                  <Flame className="size-3.5 text-primary" />#{rankPop.rank} en popüler
                </span>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.6 }} className="flex flex-wrap gap-2">
          {media.genres?.map((g) => (
            <Link key={g} href={`/ara?genre=${encodeURIComponent(g)}`} className="rounded-full border border-foreground/20 px-3 py-1 text-sm text-foreground/85 backdrop-blur transition hover:border-primary hover:bg-primary hover:text-primary-foreground">
              {genreTr(g)}
            </Link>
          ))}
        </motion.div>

        {media.nextAiringEpisode && <Countdown episode={media.nextAiringEpisode.episode} airingAt={media.nextAiringEpisode.airingAt} />}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5, ease: OUT }} className="flex flex-wrap items-center gap-3">
          {firstEpisode ? (
            <Link
              href={`/anime/${media.id}/izle/${firstEpisode}`}
              className="group flex h-13 items-center gap-2.5 rounded-full bg-primary px-7 font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_var(--primary)] transition hover:brightness-110 active:scale-[0.98]"
            >
              <Play className="size-4 fill-current" />
              {firstEpisode}. bölümü izle
            </Link>
          ) : (
            <span className="flex h-13 items-center gap-2 rounded-full border border-foreground/15 px-6 text-sm text-foreground/60">Bölümler yakında</span>
          )}
          {actions}
          <button type="button" onClick={share} aria-label="Paylaş" className="grid size-13 place-items-center rounded-full border border-foreground/25 backdrop-blur transition hover:bg-foreground/10">
            <Share2 className="size-4" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
