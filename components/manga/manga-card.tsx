import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { MangaCard as Manga } from '@/lib/manga'

export function MangaCard({ manga, className, rank, priority }: { manga: Manga; className?: string; rank?: number; priority?: boolean }) {
  return (
    <Link href={`/manga/${manga.id}`} className={cn('mg-card group/mg flex flex-col gap-3 outline-none', className)}>
      <span className="mg-spine relative block aspect-[5/7] overflow-hidden rounded-md bg-muted ring-1 ring-border transition duration-500 group-hover/mg:-translate-y-1.5 group-focus-visible/mg:ring-2 group-focus-visible/mg:ring-primary">
        {manga.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={manga.cover}
            alt={manga.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="size-full object-cover transition duration-700 group-hover/mg:scale-[1.04]"
          />
        ) : (
          <span className="halftone grid size-full place-items-center p-4 text-center text-sm font-semibold text-muted-foreground">{manga.title}</span>
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-scrim/70 via-transparent to-transparent opacity-0 transition duration-500 group-hover/mg:opacity-100" />
        {typeof rank === 'number' && (
          <span className="absolute left-0 top-0 bg-foreground px-2 py-1 font-mono text-xs font-bold tabular-nums text-background">{String(rank).padStart(2, '0')}</span>
        )}
        {manga.hasTurkish && (
          <span className="absolute right-1.5 top-1.5 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-primary-foreground">TR</span>
        )}
        {manga.lastChapter && (
          <span className="absolute inset-x-1.5 bottom-1.5 translate-y-2 rounded-sm bg-scrim/80 px-1.5 py-1 text-center font-mono text-[10px] text-on-scrim opacity-0 backdrop-blur transition duration-500 group-hover/mg:translate-y-0 group-hover/mg:opacity-100">
            {manga.lastChapter}. bölümde bitiyor
          </span>
        )}
      </span>
      <span className="flex flex-col gap-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight transition group-hover/mg:text-ink">{manga.title}</span>
        <span className="line-clamp-1 text-xs text-muted-foreground">{[manga.year, manga.tags[0]].filter(Boolean).join(' · ') || 'Manga'}</span>
      </span>
    </Link>
  )
}
