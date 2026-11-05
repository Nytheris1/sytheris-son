'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import type { ScheduleItem } from '@/lib/anilist'
import { formatTr, pickTitle } from '@/lib/format'
import { cn } from '@/lib/utils'

const TZ = 'Europe/Istanbul'
const dayKey = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: TZ })

export function ScheduleView({ items }: { items: ScheduleItem[] }) {
  const [now, setNow] = useState(0)
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

  if (!days.length) return <p className="text-muted-foreground">Takvim şu an yüklenemedi.</p>

  return (
    <div className="flex flex-col gap-8">
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Günler">
        {days.map(([k, list]) => {
          const d = new Date(`${k}T12:00:00`)
          const isActive = k === current?.[0]
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(k)}
              className={cn('relative flex shrink-0 flex-col items-start rounded-2xl border px-5 py-3 text-left transition', isActive ? 'border-primary text-primary-foreground' : 'border-border hover:border-primary/50')}
            >
              {isActive && <motion.span layoutId="day" className="absolute inset-0 -z-10 rounded-2xl bg-primary" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="text-sm font-semibold">{k === todayKey ? 'Bugün' : d.toLocaleDateString('tr-TR', { weekday: 'long' })}</span>
              <span className={cn('font-mono text-[11px]', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {list.length}
              </span>
            </button>
          )
        })}
      </div>

      <ol className="relative flex flex-col gap-3 border-l border-border pl-6 sm:pl-8">
        {current?.[1].map((it) => {
          const aired = now > 0 && it.airingAt <= now
          const time = new Date(it.airingAt * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
          return (
            <li key={it.id} className="relative">
              <span className={cn('absolute -left-[31px] top-7 size-3 rounded-full border-2 border-background sm:-left-[39px]', aired ? 'bg-muted-foreground/40' : 'bg-primary shadow-[0_0_12px_var(--primary)]')} />
              <Link href={`/anime/${it.media.id}`} className={cn('group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition hover:border-primary sm:gap-6', aired && 'opacity-60')}>
                <span className="w-14 shrink-0 font-mono text-lg font-semibold tabular-nums sm:w-16 sm:text-xl">{time}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.media.coverImage.large || '/placeholder.svg'} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium group-hover:text-ink">{pickTitle(it.media.title)}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Bölüm {it.episode}
                    {it.media.episodes ? ` / ${it.media.episodes}` : ''} · {formatTr(it.media.format)}
                  </span>
                </span>
                <span className={cn('hidden rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider sm:inline', aired ? 'bg-muted text-muted-foreground' : 'bg-accent text-ink')}>{aired ? 'Yayınlandı' : 'Yakında'}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
