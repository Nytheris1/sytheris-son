'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Pause, Play, Star } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, genreTr, pickTitle, stripHtml } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SectionHeading } from '@/components/anime/section-heading'

const OUT = [0.16, 1, 0.3, 1] as const
const CYCLE_MS = 7000

function cover(m: MediaCard) {
  return m.coverImage.extraLarge || m.coverImage.large || '/placeholder.svg'
}

function Slice({
  media,
  rank,
  active,
  paused,
  onSelect,
}: {
  media: MediaCard
  rank: number
  active: boolean
  paused: boolean
  onSelect: () => void
}) {
  const title = pickTitle(media.title)
  const art = active ? media.bannerImage || cover(media) : cover(media)
  const meta = [media.seasonYear, formatTr(media.format), media.episodes ? `${media.episodes} bölüm` : null].filter(Boolean)
  const synopsis = stripHtml(media.description)

  return (
    <li
      className={cn(
        'relative min-w-0 overflow-hidden rounded-[1.4rem] bg-scrim transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
        active ? 'grow-[9]' : 'grow',
      )}
      style={{ flexBasis: 0 }}
    >
      <button
        type="button"
        onClick={onSelect}
        onPointerEnter={onSelect}
        onFocus={onSelect}
        aria-current={active ? 'true' : undefined}
        aria-label={`${rank}. sıra: ${title}`}
        className={cn('absolute inset-0 z-20 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary', active && 'pointer-events-none')}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={art}
        src={art || '/placeholder.svg'}
        alt=""
        loading={rank <= 3 ? 'eager' : 'lazy'}
        className={cn(
          'absolute inset-0 size-full object-cover transition duration-[1.2s] ease-out',
          active ? 'scale-100 opacity-70 grayscale-0' : 'scale-110 opacity-45 grayscale-[0.6]',
          active && media.bannerImage ? 'object-[50%_30%]' : 'object-top',
        )}
      />
      <div aria-hidden="true" className={cn('absolute inset-0 transition-opacity duration-700', active ? 'bg-gradient-to-t from-scrim via-scrim/45 to-scrim/10' : 'bg-gradient-to-t from-scrim via-scrim/60 to-scrim/30')} />
      {active && <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-scrim/90 via-scrim/30 to-transparent" />}
      <div aria-hidden="true" className="grain absolute inset-0" />

      {/* Collapsed face: vertical title over the cover, rank at the foot */}
      <div className={cn('pointer-events-none absolute inset-0 flex flex-col items-center justify-between py-5 transition-opacity duration-300', active ? 'opacity-0' : 'opacity-100 delay-200')}>
        <span className="line-clamp-1 max-h-[60%] text-sm font-semibold tracking-tight text-on-scrim/85 [writing-mode:vertical-rl]">{title}</span>
        <span className="top10-slice-numeral text-[56px] font-black leading-none tracking-[-0.08em] xl:text-[68px]">{rank}</span>
      </div>

      {/* Expanded face */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={media.id}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}
            className="pointer-events-none absolute inset-0 z-30 flex items-end gap-6 p-7 xl:p-9"
          >
            <motion.span
              aria-hidden="true"
              variants={{ hidden: { opacity: 0, x: -40 }, show: { opacity: 1, x: 0, transition: { duration: 0.9, ease: OUT } } }}
              className="top10-giant pointer-events-none absolute -bottom-[0.14em] right-4 select-none text-[clamp(180px,22vw,330px)] font-black leading-none tracking-[-0.09em]"
            >
              {String(rank).padStart(2, '0')}
            </motion.span>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 30, rotate: -3 }, show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.8, ease: OUT } } }}
              className="relative hidden aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-xl shadow-[0_30px_60px_-20px_rgb(0_0_0/0.85)] ring-1 ring-on-scrim/20 xl:block xl:w-44"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover(media) || '/placeholder.svg'} alt="" className="size-full object-cover" />
            </motion.div>

            <div className="relative flex min-w-0 max-w-xl flex-col gap-3 text-on-scrim">
              <motion.p variants={item} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
                <span className="h-px w-8 bg-primary" />
                {rank === 1 ? 'Zirvede' : `${rank}. sırada`}
              </motion.p>
              <motion.h3 variants={item} className="line-clamp-2 text-balance text-3xl font-bold leading-[1] tracking-[-0.035em] xl:text-5xl">
                {title}
              </motion.h3>
              <motion.p variants={item} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-scrim/70">
                {media.averageScore ? (
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Star className="size-3.5 fill-current" aria-hidden="true" />
                    {(media.averageScore / 10).toFixed(1)}
                  </span>
                ) : null}
                {meta.map((t) => (
                  <span key={String(t)} className="flex items-center gap-3">
                    <span aria-hidden="true" className="size-1 rounded-full bg-on-scrim/30" />
                    {t}
                  </span>
                ))}
              </motion.p>
              {synopsis && (
                <motion.p variants={item} className="line-clamp-2 max-w-md text-pretty text-sm leading-relaxed text-on-scrim/60">
                  {synopsis}
                </motion.p>
              )}
              <motion.div variants={item} className="pointer-events-auto mt-1 flex flex-wrap items-center gap-2">
                <Link
                  href={`/anime/${media.id}`}
                  className="group/cta flex h-11 items-center gap-2 rounded-full bg-primary pl-5 pr-1.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  Detaylar
                  <span className="grid size-8 place-items-center rounded-full bg-primary-foreground/15 transition-transform duration-500 group-hover/cta:rotate-45">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
                {(media.genres ?? []).slice(0, 2).map((g) => (
                  <span key={g} className="rounded-full border border-on-scrim/20 px-3 py-1.5 text-xs text-on-scrim/75 backdrop-blur">
                    {genreTr(g)}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {active && (
        <motion.span
          key={`${media.id}-${paused}`}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-40 h-1 origin-left bg-primary"
          initial={{ scaleX: paused ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: paused ? 0 : CYCLE_MS / 1000, ease: 'linear' }}
        />
      )}
    </li>
  )
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: OUT } },
}

function MobileCard({ media, rank }: { media: MediaCard; rank: number }) {
  const title = pickTitle(media.title)
  return (
    <li className="w-[62vw] max-w-[260px] shrink-0 snap-start">
      <Link href={`/anime/${media.id}`} className="group relative block overflow-hidden rounded-[1.4rem] bg-scrim">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover(media) || '/placeholder.svg'} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover opacity-80 transition duration-700 group-active:scale-105" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/30 to-transparent" />
        <span aria-hidden="true" className="top10-giant absolute -bottom-[0.16em] -right-1 select-none text-[120px] font-black leading-none tracking-[-0.09em]">
          {rank}
        </span>
        <span className="absolute inset-x-4 bottom-4 flex flex-col gap-1 pr-14 text-on-scrim">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{rank === 1 ? 'Zirvede' : `${rank}. sıra`}</span>
          <span className="line-clamp-2 text-base font-bold leading-tight tracking-tight">{title}</span>
          {media.averageScore ? (
            <span className="flex items-center gap-1 text-xs text-on-scrim/70">
              <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
              {(media.averageScore / 10).toFixed(1)}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  )
}

export function TopTen({ items }: { items: MediaCard[] }) {
  const list = items.slice(0, 10)
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [manualPause, setManualPause] = useState(false)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const paused = hovering || manualPause || !visible

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (paused || list.length < 2) return
    const id = window.setTimeout(() => setActive((a) => (a + 1) % list.length), CYCLE_MS)
    return () => clearTimeout(id)
  }, [active, paused, list.length])

  const select = useCallback((i: number) => setActive(i), [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    setActive((a) => (a + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length)
  }

  if (!list.length) return null
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:px-10" aria-labelledby="top10">
      <div id="top10" className="flex items-end justify-between gap-6">
        <SectionHeading eyebrow={`Top 10 · ${today}`} title="Bugün Türkiye'de" accent="Top 10" description="Bir dilimin üzerine gel ya da ok tuşlarını kullan; sahne o seriye açılsın." href="/ara?sort=TRENDING_DESC" />
        <div className="hidden shrink-0 items-center gap-3 pb-1 lg:flex">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            <span className="text-foreground">{String(active + 1).padStart(2, '0')}</span> / {String(list.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => setManualPause((p) => !p)}
            aria-label={manualPause ? 'Otomatik geçişi başlat' : 'Otomatik geçişi durdur'}
            className="grid size-10 place-items-center rounded-full border border-border transition hover:border-primary hover:text-ink"
          >
            {manualPause ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div ref={ref} className="dark hidden lg:block" onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
        <ol className="flex h-[520px] gap-2 xl:h-[560px]" aria-label="Bugün Türkiye'de Top 10" onKeyDown={onKeyDown}>
          {list.map((m, i) => (
            <Slice key={m.id} media={m} rank={i + 1} active={i === active} paused={paused} onSelect={() => select(i)} />
          ))}
        </ol>
      </div>

      <ol className="scrollbar-none dark -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:hidden" aria-label="Bugün Türkiye'de Top 10">
        {list.map((m, i) => (
          <MobileCard key={m.id} media={m} rank={i + 1} />
        ))}
      </ol>
    </section>
  )
}
