import Link from 'next/link'
import { Star } from 'lucide-react'
import type { Series } from '@/lib/series'
import { cn } from '@/lib/utils'
import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'

export function SeriesCard({ series, className, rank }: { series: Series; className?: string; rank?: number }) {
  return (
    <Link href={`/dizi/${series.id}`} className={cn('group flex flex-col gap-3 outline-none', className)}>
      <span className="relative block aspect-[2/3] overflow-hidden rounded-md bg-muted ring-1 ring-border transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_-24px_rgb(0_0_0/0.8),0_0_0_1px_var(--primary)] group-focus-visible:ring-2 group-focus-visible:ring-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={series.poster || '/placeholder.svg'} alt="" loading="lazy" decoding="async" className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <span className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-scrim via-scrim/70 to-transparent p-3 text-on-scrim opacity-0 transition duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
          {series.summary && <span className="line-clamp-4 text-[12px] leading-relaxed text-on-scrim/85">{series.summary}</span>}
          <span className="flex flex-wrap gap-1">
            {series.genresTr.slice(0, 2).map((g) => (
              <span key={g} className="rounded-full border border-on-scrim/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]">
                {g}
              </span>
            ))}
          </span>
        </span>
        <span className="cine-card-light pointer-events-none absolute inset-0" aria-hidden="true" />
        {series.rating ? (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-scrim/75 px-2 py-1 font-mono text-[10px] font-semibold text-on-scrim backdrop-blur">
            <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
            {series.rating.toFixed(1)}
            <span className="sr-only">puan</span>
          </span>
        ) : null}
        {rank && <span className="absolute left-2.5 top-2 font-mono text-[11px] font-semibold text-on-scrim [text-shadow:0_1px_6px_rgb(0_0_0/0.7)]">#{rank}</span>}
      </span>
      <span className="flex flex-col gap-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-ink">{series.name}</span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="truncate">{series.network ?? series.genresTr[0] ?? 'Dizi'}</span>
          {series.year ? (
            <>
              <span className="size-1 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
              <span>{series.year}</span>
            </>
          ) : null}
        </span>
      </span>
    </Link>
  )
}

export function SeriesRow({ eyebrow, title, accent, description, href, items }: { eyebrow?: string; title: string; accent?: string; description?: string; href?: string; items: Series[] }) {
  if (!items.length) return null
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10">
      <SectionHeading eyebrow={eyebrow} title={title} accent={accent} description={description} href={href} />
      <ScrollRow label={`${title} ${accent ?? ''}`}>
        {items.map((s) => (
          <SeriesCard key={s.id} series={s} className="w-[42vw] shrink-0 snap-start sm:w-[190px] lg:w-[208px]" />
        ))}
      </ScrollRow>
    </section>
  )
}
