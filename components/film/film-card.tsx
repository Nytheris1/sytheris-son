import Link from 'next/link'
import { Play } from 'lucide-react'
import type { Film } from '@/lib/films'
import { cn } from '@/lib/utils'
import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'

export function FilmCard({ film, className, rank }: { film: Film; className?: string; rank?: number }) {
  return (
    <Link href={`/film/${film.id}`} className={cn('group flex flex-col gap-3 outline-none', className)}>
      <span className="relative block aspect-[2/3] overflow-hidden rounded-md bg-muted ring-1 ring-border transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_-24px_rgb(0_0_0/0.8),0_0_0_1px_var(--primary)] group-focus-visible:ring-2 group-focus-visible:ring-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={film.poster || '/placeholder.svg'} alt="" loading="lazy" decoding="async" className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        <span className="absolute inset-0 flex translate-y-2 flex-col justify-end gap-2.5 bg-gradient-to-t from-scrim via-scrim/70 to-transparent p-3 text-on-scrim opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          {film.director && <span className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-on-scrim/60">{film.director}</span>}
          {film.summary && <span className="line-clamp-4 text-[12px] leading-relaxed text-on-scrim/85">{film.summary}</span>}
          {film.trailer && (
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
              <Play className="size-3 fill-current" /> Fragman
            </span>
          )}
        </span>
        <span className="cine-card-light pointer-events-none absolute inset-0" aria-hidden="true" />
        {rank && <span className="absolute left-2.5 top-2 font-mono text-[11px] font-semibold text-on-scrim [text-shadow:0_1px_6px_rgb(0_0_0/0.7)]">#{rank}</span>}
      </span>
      <span className="flex flex-col gap-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug transition group-hover:text-ink">{film.title}</span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="truncate">{film.genreTr}</span>
          {film.year ? (
            <>
              <span className="size-1 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
              <span>{film.year}</span>
            </>
          ) : null}
        </span>
      </span>
    </Link>
  )
}

export function FilmRow({ eyebrow, title, accent, description, href, items }: { eyebrow?: string; title: string; accent?: string; description?: string; href?: string; items: Film[] }) {
  if (!items.length) return null
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10">
      <SectionHeading eyebrow={eyebrow} title={title} accent={accent} description={description} href={href} />
      <ScrollRow label={`${title} ${accent ?? ''}`}>
        {items.map((f) => (
          <FilmCard key={f.id} film={f} className="w-[42vw] shrink-0 snap-start sm:w-[190px] lg:w-[208px]" />
        ))}
      </ScrollRow>
    </section>
  )
}
