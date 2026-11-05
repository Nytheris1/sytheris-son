'use client'

import Link from 'next/link'
import { useRef } from 'react'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, pickTitle } from '@/lib/format'
import { SectionHeading } from '@/components/anime/section-heading'
import { ScrollRow } from '@/components/anime/scroll-row'
import { usePreview } from '@/components/anime/preview-provider'

function TopItem({ media, rank }: { media: MediaCard; rank: number }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const preview = usePreview()
  const title = pickTitle(media.title)

  return (
    <Link
      ref={ref}
      href={`/anime/${media.id}`}
      onPointerEnter={(e) => e.pointerType === 'mouse' && ref.current && preview?.show(media, ref.current)}
      onPointerLeave={() => preview?.cancelShow()}
      className="group relative flex w-[160px] shrink-0 snap-start flex-col outline-none sm:w-[200px] lg:w-[220px]"
    >
      {/* Resim ve Sayı Alanı */}
      <div className="relative flex aspect-[4/3] w-full items-end">
        
        {/* Arkadaki Devasa Sayı */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 -left-4 z-0 select-none font-sans text-[130px] font-black leading-[0.75] tracking-tighter text-transparent transition-all duration-500 group-hover:-translate-y-2 sm:text-[170px] lg:text-[190px]"
          style={{ WebkitTextStroke: '4px var(--primary)' }}
        >
          {rank}
        </span>

        {/* Sağa Yaslanmış Anime Posteri */}
        <div className="relative z-10 ml-auto w-[75%] overflow-hidden rounded-xl bg-muted shadow-2xl ring-1 ring-border transition-all duration-500 group-hover:scale-[1.03] group-hover:ring-primary/50">
          <div className="aspect-[2/3] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.coverImage.extraLarge || media.coverImage.large || '/placeholder.svg'}
              alt={title}
              loading="lazy"
              className="size-full object-cover transition duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Alt Bilgi */}
      <div className="mt-4 flex flex-col pr-2 pl-1">
        <span className="line-clamp-2 text-[14px] font-semibold leading-snug transition-colors group-hover:text-ink">
          {title}
        </span>
        <span className="mt-1 line-clamp-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {[media.seasonYear, formatTr(media.format), media.averageScore ? `${media.averageScore}%` : null].filter(Boolean).join(' · ')}
        </span>
      </div>
    </Link>
  )
}

export function TopTen({ items }: { items: MediaCard[] }) {
  if (!items.length) return null
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })
  
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10" aria-labelledby="top10">
      <div id="top10">
        <SectionHeading 
          eyebrow={`Top 10 · ${today}`} 
          title="Bugün Türkiye'de" 
          accent="Top 10" 
          description="Bugün en çok izlenen ve konuşulan animeler. Liste her gün yenilenir." 
          href="/ara?sort=TRENDING_DESC" 
        />
      </div>
      
      {/* Yana Kaydırmalı Alan */}
      <ScrollRow label="Bugün Türkiye'de Top 10" className="gap-4 sm:gap-6 lg:gap-8">
        {items.slice(0, 10).map((m, i) => (
          <TopItem key={m.id} media={m} rank={i + 1} />
        ))}
      </ScrollRow>
    </section>
  )
}