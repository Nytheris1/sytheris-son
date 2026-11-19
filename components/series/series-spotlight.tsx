'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ArrowRight, Layers, Star, Tv } from 'lucide-react'
import type { SeriesDetail } from '@/lib/series'
import { cn } from '@/lib/utils'

const OUT = [0.16, 1, 0.3, 1] as const

/** Home-page feature: a tabbed "now showing" panel for the top series, with backdrop, facts, synopsis and cast. */
export function SeriesSpotlight({ items }: { items: SeriesDetail[] }) {
  const [index, setIndex] = useState(0)
  const s = items[index]
  if (!s) return null
  const seasons = s.seasons.filter((x) => x.number > 0)
  const episodes = seasons.reduce((n, x) => n + (x.episodes ?? 0), 0)
  const span = s.year ? `${s.year}${s.ended ? `–${new Date(s.ended).getFullYear()}` : s.status === 'Running' ? '–' : ''}` : null
  const text = s.summaryTr || s.summary

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10" aria-labelledby="series-spot-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" /> Dizi vitrini
          </p>
          <h2 id="series-spot-title" className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Bu hafta <span className="accent-serif">bölüm bölüm</span>
          </h2>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Öne çıkan diziler">
          {items.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={cn('flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm transition', i === index ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.poster || '/placeholder.svg'} alt="" className="size-7 rounded-full object-cover" />
              {x.name}
            </button>
          ))}
        </div>
      </div>

      <div className="dark relative isolate min-h-[28rem] overflow-hidden rounded-3xl bg-scrim text-foreground ring-1 ring-border" role="tabpanel">
        <AnimatePresence mode="popLayout">
          <motion.div key={s.id} className="absolute inset-0 -z-20" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: OUT }} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.backdrop || s.posterLg || '/placeholder.svg'} alt="" className={cn('size-full object-cover', s.backdrop ? 'opacity-60' : 'scale-125 opacity-45 blur-3xl')} />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--scrim)_0%,color-mix(in_oklch,var(--scrim)_80%,transparent)_50%,color-mix(in_oklch,var(--scrim)_20%,transparent)_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-scrim to-transparent md:hidden" aria-hidden="true" />
        <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            className="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-end"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            <div className="flex flex-col gap-5">
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex flex-wrap items-center gap-2">
                {s.rating ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Star className="size-3.5 fill-current" aria-hidden="true" /> {s.rating.toFixed(1)}
                  </span>
                ) : null}
                {s.genresTr.slice(0, 3).map((g) => (
                  <span key={g} className="rounded-full border border-foreground/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/80">
                    {g}
                  </span>
                ))}
              </motion.div>
              <motion.h3 variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.7, ease: OUT }} className="text-balance text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
                {s.name}
              </motion.h3>
              <motion.dl variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70">
                {s.network && (
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Kanal</dt>
                    <Tv className="size-3.5 text-ink" aria-hidden="true" />
                    <dd>{s.network}</dd>
                  </div>
                )}
                {span && (
                  <div>
                    <dt className="sr-only">Yayın yılları</dt>
                    <dd>{span}</dd>
                  </div>
                )}
                {seasons.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Sezon</dt>
                    <Layers className="size-3.5 text-ink" aria-hidden="true" />
                    <dd>
                      {seasons.length} sezon{episodes ? ` · ${episodes} bölüm` : ''}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="sr-only">Durum</dt>
                  <dd className={s.status === 'Running' ? 'text-ink' : undefined}>{s.statusTr}</dd>
                </div>
              </motion.dl>
              {text && (
                <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="line-clamp-4 max-w-xl text-pretty leading-relaxed text-foreground/80">
                  {text}
                </motion.p>
              )}
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                <Link href={`/dizi/${s.id}`} className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                  Diziyi incele <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </motion.div>
            </div>

            {s.cast.length > 0 && (
              <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="flex flex-col gap-3 md:justify-self-end">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">Başroller</p>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
                  {s.cast.slice(0, 4).map((c) => (
                    <li key={`${c.name}-${c.character}`} className="flex items-center gap-2.5 rounded-2xl bg-foreground/[0.06] p-2 backdrop-blur">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image || '/placeholder.svg'} alt="" loading="lazy" className="size-10 shrink-0 rounded-xl object-cover object-top" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-semibold">{c.name}</span>
                        <span className="truncate text-[11px] text-foreground/60">{c.character}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
