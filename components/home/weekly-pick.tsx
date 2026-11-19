import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, genreTr, pickTitle, splitTitle, stripHtml } from '@/lib/format'

export function WeeklyPick({ media }: { media: MediaCard | null }) {
  if (!media) return null
  const title = pickTitle(media.title)
  const { head, tail } = splitTitle(title)
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-card">
        {media.bannerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.bannerImage || '/placeholder.svg'} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover opacity-[0.08] blur-sm" />
        )}
        <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-10 -z-10 select-none text-[16rem] font-bold leading-none tracking-tighter text-foreground/[0.04] sm:text-[22rem]">
          01
        </span>
        <div className="grid items-center gap-8 p-6 sm:p-10 md:grid-cols-[280px_1fr] lg:gap-14 lg:p-14">
          <Link href={`/anime/${media.id}`} className="group relative mx-auto block w-48 sm:w-56 md:w-full">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/25 opacity-0 blur-2xl transition duration-700 group-hover:opacity-100" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.coverImage.extraLarge || media.coverImage.large || '/placeholder.svg'}
              alt={title}
              loading="lazy"
              className="aspect-[2/3] w-full rounded-3xl object-cover shadow-2xl transition duration-700 group-hover:-rotate-1 group-hover:scale-[1.02]"
            />
          </Link>
          <div className="flex flex-col gap-5">
            <p className="label-mono flex items-center gap-3 text-ink">
              <span className="h-px w-8 bg-primary" />
              Haftanın seçkisi
            </p>
            <h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              {head} <span className="accent-serif">{tail}</span>
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {[media.seasonYear, formatTr(media.format), media.episodes ? `${media.episodes} bölüm` : null].filter(Boolean).map((t, i) => (
                <span key={i} className="flex items-center gap-3">
                  {i > 0 && <span className="size-1 rounded-full bg-border" />}
                  {t}
                </span>
              ))}
              {media.averageScore ? <span className="text-ink">· {media.averageScore} / 100</span> : null}
            </p>
            <p className="line-clamp-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{stripHtml(media.description)}</p>
            <div className="flex flex-wrap gap-2">
              {media.genres?.slice(0, 4).map((g) => (
                <Link key={g} href={`/ara?genre=${encodeURIComponent(g)}`} className="rounded-full border border-border px-3 py-1 text-sm transition hover:border-primary hover:text-ink">
                  {genreTr(g)}
                </Link>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href={`/anime/${media.id}`} className="group flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition hover:brightness-110">
                Detayları gör
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/ara" className="flex h-12 items-center rounded-full border border-border px-6 font-medium transition hover:bg-muted">
                Tüm katalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
