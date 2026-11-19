import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Heart, Play, Star, StarHalf } from 'lucide-react'
import { compact } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ShowcaseArt } from './character-showcase'
import { GalleryGrid } from './gallery-grid'

export type CastLink = { id: number; name: string }

function starsFor(favourites: number) {
  if (favourites >= 60000) return 5
  if (favourites >= 25000) return 4.5
  if (favourites >= 10000) return 4
  if (favourites >= 4000) return 3.5
  if (favourites >= 1000) return 3
  return 2.5
}

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${value} / 5 yıldız`}>
      {[1, 2, 3, 4, 5].map((n) =>
        value >= n ? (
          <Star key={n} className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />
        ) : value >= n - 0.5 ? (
          <StarHalf key={n} className="size-3.5 fill-foreground text-foreground" aria-hidden="true" />
        ) : null,
      )}
    </span>
  )
}

/**
 * Character-select spread: an index counter with prev/next through the anime's cast,
 * a second full-body pose, and the name card with gallery — like a game's roster screen.
 */
export function CharacterSelect({
  name,
  native,
  art,
  roleLabel,
  favourites,
  index,
  total,
  prev,
  next,
  cast,
  currentId,
  gallery,
  primaryHref,
  seriesTitle,
}: {
  name: string
  native?: string | null
  art: ShowcaseArt | null
  roleLabel: string
  favourites: number
  index: number
  total: number
  prev?: CastLink | null
  next?: CastLink | null
  cast: CastLink[]
  currentId: number
  gallery: string[]
  primaryHref?: string
  seriesTitle?: string | null
}) {
  const words = name.trim().toUpperCase().split(/\s+/)
  const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <section id="kadro" aria-labelledby="kadro-baslik" className="relative isolate scroll-mt-16 overflow-clip border-b border-border bg-background">

      <div className="mx-auto grid w-full max-w-[1440px] lg:min-h-[760px] lg:grid-cols-[150px_minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* Counter */}
        <div className="order-2 flex items-center justify-between gap-6 px-5 py-6 sm:px-8 lg:order-1 lg:flex-col lg:justify-center lg:gap-10 lg:py-0 lg:pl-12 lg:pr-0">
          <p className="flex items-end gap-1 font-bold" aria-label={`Kadroda ${index}. sırada, toplam ${total}`}>
            <span className="flex flex-col gap-2">
              <span aria-hidden="true" className="h-[3px] w-12 bg-foreground" />
              <span className="text-5xl tabular-nums leading-none tracking-tight">{pad(index)}/</span>
            </span>
            <span className="mb-6 text-sm tabular-nums text-muted-foreground">{pad(total)}</span>
          </p>
          <div className="flex gap-2 lg:flex-col">
            {prev ? (
              <Link href={`/karakter/${prev.id}`} aria-label={`Önceki karakter: ${prev.name}`} className="grid size-11 place-items-center rounded-full border-2 border-foreground transition hover:bg-foreground hover:text-background">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border-2 border-foreground/15 text-foreground/25">
                <ArrowLeft className="size-4" />
              </span>
            )}
            {next ? (
              <Link href={`/karakter/${next.id}`} aria-label={`Sonraki karakter: ${next.name}`} className="grid size-11 place-items-center rounded-full bg-foreground text-background transition hover:opacity-85">
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border-2 border-foreground/15 text-foreground/25">
                <ArrowRight className="size-4" />
              </span>
            )}
          </div>
        </div>

        {/* Pose */}
        <div className="relative order-1 h-[60svh] min-h-[420px] lg:order-2 lg:h-auto">
          {art?.transparent ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={art.src || '/placeholder.svg'}
              alt={`${name}, tam boy poz`}
              loading="lazy"
              className="absolute inset-x-0 bottom-0 mx-auto h-[96%] w-auto max-w-full select-none object-contain object-bottom drop-shadow-[0_30px_40px_rgb(0_0_0/0.25)]"
              draggable={false}
            />
          ) : art ? (
            <div className="char-select-stage absolute inset-x-5 inset-y-8 overflow-hidden bg-muted sm:inset-x-8 lg:inset-x-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art.src || '/placeholder.svg'} alt={`${name}, tam boy çizim`} loading="lazy" className="size-full object-cover object-top" />
            </div>
          ) : null}
        </div>

        {/* Name card */}
        <div className="order-3 flex flex-col justify-center gap-5 px-5 pb-14 sm:px-8 lg:py-16 lg:pl-4 lg:pr-12">
          <span aria-hidden="true" className="flex gap-1">
            <span className="size-1.5 rounded-full bg-foreground" />
            <span className="size-1.5 rounded-full bg-foreground" />
            <span className="size-1.5 rounded-full bg-foreground/30" />
          </span>
          <p className="flex flex-wrap items-center gap-3 text-xs font-medium">
            <span>
              #{pad(index)} {roleLabel}
            </span>
            <Stars value={starsFor(favourites)} />
          </p>
          <h2 id="kadro-baslik" lang="en" className="text-[clamp(34px,3.6vw,56px)] font-black leading-[0.95] tracking-[-0.02em]">
            {lines.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {primaryHref && (
              <Link href={primaryHref} className="flex h-7 items-center gap-1.5 bg-foreground px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-background transition hover:opacity-85">
                <Play className="size-3 fill-current" aria-hidden="true" /> İzle
              </Link>
            )}
            <a href="#yapimlar" className="flex h-7 items-center gap-1.5 border-2 border-foreground px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] transition hover:bg-foreground hover:text-background">
              <Check className="size-3" aria-hidden="true" /> Yapımlar
            </a>
            <span className="ml-1 flex items-center gap-1.5 text-xs font-semibold">
              <Heart className="size-4" aria-hidden="true" />
              {compact(favourites)}
            </span>
          </div>

          <GalleryGrid images={gallery} name={name} />

          <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {seriesTitle ? `${seriesTitle} · ` : ''}Görseller: hayran çizimleri
          </p>
        </div>
      </div>

      {cast.length > 1 && (
        <nav aria-label="Kadro" className="border-t border-border">
          <ol className="scrollbar-none mx-auto flex max-w-[1440px] snap-x gap-1 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12">
            {cast.map((m, i) => {
              const current = m.id === currentId
              return (
                <li key={m.id} className="shrink-0 snap-start">
                  <Link
                    href={`/karakter/${m.id}`}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'relative flex h-10 items-center gap-2 px-3 text-sm transition',
                      current ? 'font-bold text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className="font-mono text-[10px] tabular-nums">{pad(i + 1)}</span>
                    <span className="whitespace-nowrap">{m.name}</span>
                    {current && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-[3px] bg-[var(--tone,var(--primary))]" />}
                  </Link>
                </li>
              )
            })}
          </ol>
        </nav>
      )}
    </section>
  )
}
