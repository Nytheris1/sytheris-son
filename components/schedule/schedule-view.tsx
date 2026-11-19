'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Clock, LayoutGrid, List, Moon, Sun, Sunrise, Sunset } from 'lucide-react'
import type { ScheduleItem } from '@/lib/anilist'
import { formatTr, genreTr, pickTitle, timeUntil } from '@/lib/format'
import { cn } from '@/lib/utils'

const TZ = 'Europe/Istanbul'
const dayKey = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: TZ })
const hourOf = (ts: number) => Number(new Date(ts * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: TZ }))
const timeOf = (ts: number) => new Date(ts * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

const BUCKETS = [
  { id: 'morning', label: 'Sabah', range: [5, 12], icon: Sunrise },
  { id: 'noon', label: 'Öğleden sonra', range: [12, 17], icon: Sun },
  { id: 'evening', label: 'Akşam', range: [17, 22], icon: Sunset },
  { id: 'night', label: 'Gece', range: [22, 29], icon: Moon },
] as const

function bucketOf(ts: number) {
  const h = hourOf(ts)
  const hh = h < 5 ? h + 24 : h
  return BUCKETS.find((b) => hh >= b.range[0] && hh < b.range[1])?.id ?? 'night'
}

function Spotlight({ item, now }: { item: ScheduleItem; now: number }) {
  const left = Math.max(0, item.airingAt - now)
  return (
    <Link href={`/anime/${item.media.id}`} className="group dark relative isolate flex min-h-56 overflow-hidden rounded-[2rem] bg-scrim text-foreground">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.media.bannerImage || item.media.coverImage.extraLarge || '/placeholder.svg'} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-60 transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-scrim via-scrim/80 to-transparent" />
      <div className="flex w-full flex-col justify-between gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
        <div className="flex max-w-xl flex-col gap-3">
          <span className="label-mono flex items-center gap-2 text-primary">
            <span className="size-2 animate-pulse rounded-full bg-primary" /> Sıradaki yayın
          </span>
          <p className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{pickTitle(item.media.title)}</p>
          <p className="text-sm text-foreground/70">
            {item.episode}. bölüm · {timeOf(item.airingAt)} · {item.media.genres?.slice(0, 2).map(genreTr).join(', ')}
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="font-mono text-xs uppercase tracking-widest text-foreground/60">Kalan süre</span>
          <span className="font-mono text-4xl font-semibold tabular-nums text-primary sm:text-5xl">{now ? timeUntil(left) : '—'}</span>
        </div>
      </div>
    </Link>
  )
}

function Row({ it, now, index }: { it: ScheduleItem; now: number; index: number }) {
  const aired = now > 0 && it.airingAt <= now
  return (
    <motion.li initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.4 }}>
      <Link
        href={`/anime/${it.media.id}`}
        className={cn('group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary sm:gap-5', aired && 'opacity-60 hover:opacity-100')}
      >
        <span className="flex w-16 shrink-0 flex-col items-center">
          <span className="font-mono text-lg font-semibold tabular-nums">{timeOf(it.airingAt)}</span>
          <span className={cn('mt-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider', aired ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-ink')}>
            {aired ? 'Yayında' : now ? timeUntil(it.airingAt - now) : '—'}
          </span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.media.coverImage.large || '/placeholder.svg'} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-xl object-cover transition duration-500 group-hover:scale-105" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold group-hover:text-ink">{pickTitle(it.media.title)}</span>
          <span className="mt-1 block truncate text-sm text-muted-foreground">
            {it.episode}. bölüm{it.media.episodes ? ` / ${it.media.episodes}` : ''} · {formatTr(it.media.format)}
          </span>
        </span>
        {it.media.averageScore ? <span className="hidden font-mono text-sm text-muted-foreground sm:block">{it.media.averageScore}</span> : null}
      </Link>
    </motion.li>
  )
}

export function ScheduleView({ items }: { items: ScheduleItem[] }) {
  const [now, setNow] = useState(0)
  const [view, setView] = useState<'list' | 'grid'>('list')
  useEffect(() => {
    setNow(Date.now() / 1000)
    const id = window.setInterval(() => setNow(Date.now() / 1000), 30000)
    return () => window.clearInterval(id)
  }, [])

  const days = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>()
    for (const it of items) {
      const k = dayKey(it.airingAt)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(it)
    }
    return [...map.entries()].slice(0, 8)
  }, [items])

  const todayKey = dayKey(Date.now() / 1000)
  const [active, setActive] = useState(todayKey)
  const current = days.find(([k]) => k === active) ?? days[0]
  const next = now ? items.find((i) => i.airingAt > now) : null

  if (!days.length)
    return (
      <div className="rounded-3xl border border-dashed border-border py-20 text-center">
        <p className="text-lg font-semibold">Takvim şu an yüklenemedi</p>
        <p className="mt-1 text-sm text-muted-foreground">Birkaç saniye sonra yenilemeyi dene.</p>
      </div>
    )

  const list = current?.[1] ?? []
  const nowIndex = list.findIndex((i) => i.airingAt > now)

  return (
    <div className="flex flex-col gap-8">
      {next && <Spotlight item={next} now={now} />}

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8" role="tablist" aria-label="Günler">
        {days.map(([k, dayList]) => {
          const d = new Date(`${k}T12:00:00`)
          const isActive = k === current?.[0]
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(k)}
              className={cn('relative isolate flex w-28 shrink-0 flex-col items-start gap-2 overflow-hidden rounded-2xl border p-3 text-left transition sm:w-auto', isActive ? 'border-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/50')}
            >
              {isActive && <motion.span layoutId="day" className="absolute inset-0 -z-10 bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className={cn('label-mono text-[9px]', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{k === todayKey ? 'Bugün' : d.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
              <span className="text-3xl font-bold leading-none tabular-nums">{d.getDate()}</span>
              <span className="flex items-center gap-1">
                <span className="flex -space-x-2">
                  {dayList.slice(0, 3).map((it) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={it.id} src={it.media.coverImage.large || '/placeholder.svg'} alt="" className="size-5 rounded-full object-cover ring-2 ring-card" />
                  ))}
                </span>
                <span className={cn('ml-1 font-mono text-[10px]', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{dayList.length}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" /> Türkiye saati · {list.length} bölüm
        </p>
        <div className="flex gap-1 rounded-full bg-muted p-1" role="radiogroup" aria-label="Görünüm">
          {(
            [
              ['list', 'Zaman çizelgesi', List],
              ['grid', 'Gün dilimleri', LayoutGrid],
            ] as const
          ).map(([v, l, Icon]) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition', view === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{l}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.ol key={`list-${current?.[0]}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            {list.map((it, i) => (
              <Fragment key={it.id}>
                {current?.[0] === todayKey && i === nowIndex && nowIndex > 0 && (
                  <li className="flex items-center gap-3 py-1" aria-label="Şu an">
                    <span className="size-2.5 animate-pulse rounded-full bg-primary" />
                    <span className="label-mono text-[10px] text-ink">Şimdi · {timeOf(now)}</span>
                    <span className="h-px flex-1 bg-primary/50" />
                  </li>
                )}
                <Row it={it} now={now} index={i} />
              </Fragment>
            ))}
          </motion.ol>
        ) : (
          <motion.div key={`grid-${current?.[0]}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BUCKETS.map((b) => {
              const inBucket = list.filter((i) => bucketOf(i.airingAt) === b.id)
              return (
                <section key={b.id} className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4" aria-label={b.label}>
                  <header className="flex items-center gap-2 px-1">
                    <span className="grid size-8 place-items-center rounded-xl bg-accent text-ink">
                      <b.icon className="size-4" />
                    </span>
                    <span className="font-semibold">{b.label}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{inBucket.length}</span>
                  </header>
                  {inBucket.length === 0 ? (
                    <p className="px-1 py-4 text-sm text-muted-foreground">Bu dilimde yayın yok.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {inBucket.map((it) => (
                        <li key={it.id}>
                          <Link href={`/anime/${it.media.id}`} className={cn('group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted', now && it.airingAt <= now && 'opacity-60')}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.media.coverImage.large || '/placeholder.svg'} alt="" loading="lazy" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium group-hover:text-ink">{pickTitle(it.media.title)}</span>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {timeOf(it.airingAt)} · B{it.episode}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
