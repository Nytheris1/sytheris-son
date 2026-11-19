'use client'

import { motion } from 'motion/react'
import type { MediaDetail } from '@/lib/anilist-types'
import { compact, seasonTr } from '@/lib/format'

const STATUS: Record<string, { label: string; tone: string }> = {
  CURRENT: { label: 'İzliyor', tone: 'var(--primary)' },
  PLANNING: { label: 'Planlıyor', tone: 'color-mix(in oklch, var(--primary) 55%, var(--muted-foreground))' },
  COMPLETED: { label: 'Tamamladı', tone: 'var(--foreground)' },
  PAUSED: { label: 'Ara verdi', tone: 'var(--muted-foreground)' },
  DROPPED: { label: 'Bıraktı', tone: 'var(--destructive)' },
}

export function StatsPanel({ media }: { media: MediaDetail }) {
  const scores = media.stats?.scoreDistribution ?? []
  const maxScore = Math.max(1, ...scores.map((s) => s.amount))
  const statuses = (media.stats?.statusDistribution ?? []).filter((s) => STATUS[s.status])
  const totalStatus = statuses.reduce((n, s) => n + s.amount, 0) || 1
  const rankings = (media.rankings ?? []).slice(0, 6)

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold">Puan dağılımı</p>
          {media.meanScore ? <p className="font-mono text-xs text-muted-foreground">Ortalama {media.meanScore}/100</p> : null}
        </div>
        {scores.length ? (
          <div className="flex h-48 items-end gap-1 sm:gap-2.5" role="img" aria-label="Puan dağılımı grafiği">
            {scores.map((s, i) => (
              <div key={s.score} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-[10px] text-muted-foreground opacity-0 transition group-hover:opacity-100">{compact(s.amount)}</span>
                <motion.span
                  className="w-full rounded-t-lg"
                  style={{ background: `color-mix(in oklch, var(--primary) ${30 + (s.score / 100) * 70}%, var(--muted))` }}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${Math.max(3, (s.amount / maxScore) * 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
                <span className="font-mono text-[10px] text-muted-foreground">{s.score}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Henüz yeterli puan verisi yok.</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6">
          <p className="font-semibold">Topluluk durumu</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            {statuses.map((s, i) => (
              <motion.span
                key={s.status}
                className="h-full"
                style={{ background: STATUS[s.status].tone }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(s.amount / totalStatus) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {statuses.map((s) => (
              <li key={s.status} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: STATUS[s.status].tone }} />
                <span className="text-muted-foreground">{STATUS[s.status].label}</span>
                <span className="ml-auto font-mono text-xs tabular-nums">{compact(s.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
        {rankings.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card px-6">
            {rankings.map((r) => (
              <li key={r.id} className="flex items-center gap-4 py-3 text-sm">
                <span className="w-12 font-mono text-lg font-semibold text-ink">#{r.rank}</span>
                <span className="text-muted-foreground">
                  {r.type === 'RATED' ? 'En yüksek puanlı' : 'En popüler'} {r.allTime ? '· tüm zamanlar' : [r.season ? seasonTr(r.season) : null, r.year].filter(Boolean).join(' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
