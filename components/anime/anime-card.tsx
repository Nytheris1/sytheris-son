'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { Star } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, pickTitle } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePreview } from './preview-provider'

export function AnimeCard({ media, className, badge, priority }: { media: MediaCard; className?: string; badge?: string; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const preview = usePreview()
  const title = pickTitle(media.title)
  return (
    <Link
      ref={ref}
      href={`/anime/${media.id}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && ref.current && preview?.show(media, ref.current)}
      onPointerLeave={() => preview?.cancelShow()}
      onFocus={() => preview?.hide()}
      className={cn('group/card flex flex-col gap-3 outline-none', className)}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border transition duration-500 group-hover/card:-translate-y-1 group-hover/card:shadow-xl group-focus-visible/card:ring-2 group-focus-visible/card:ring-primary"
        style={{ backgroundColor: media.coverImage.color ?? undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.coverImage.extraLarge || media.coverImage.large || '/placeholder.svg'}
          alt={title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover transition duration-700 group-hover/card:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/50 via-transparent to-transparent opacity-0 transition group-hover/card:opacity-100" />
        {media.averageScore ? (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-scrim/70 px-2 py-1 font-mono text-[11px] font-semibold text-on-scrim backdrop-blur-md">
            <Star className="size-3 fill-primary text-primary" />
            {media.averageScore}
          </span>
        ) : null}
        {badge && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">{badge}</span>
        )}
        {media.nextAiringEpisode && !badge && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-scrim/70 px-2 py-1 font-mono text-[10px] text-on-scrim backdrop-blur-md">Bölüm {media.nextAiringEpisode.episode}</span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <p className="line-clamp-2 text-[15px] font-medium leading-snug transition-colors group-hover/card:text-ink">{title}</p>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{[media.seasonYear, formatTr(media.format)].filter(Boolean).join(' · ')}</p>
      </div>
    </Link>
  )
}
