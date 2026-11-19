import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { FILM_GENRES, type Film } from '@/lib/films'
import { SectionHeading } from '@/components/anime/section-heading'

/** Genre index styled like a cinema programme: each tile is backed by a poster from that genre's chart. */
export function FilmGenres({ covers }: { covers: Partial<Record<string, Film | undefined>> }) {
  const tiles = FILM_GENRES.slice(0, 8)
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:px-10" aria-labelledby="film-genres">
      <SectionHeading eyebrow="Program" title="Türüne göre" accent="seans seç" href="/filmler" hrefLabel="Tüm filmler" />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((g, i) => {
          const cover = covers[g.id]
          return (
            <li key={g.id} className={[0, 3, 6, 7].includes(i) ? 'md:col-span-2' : undefined}>
              <Link href={`/filmler?tur=${g.id}`} className="dark group relative flex h-44 flex-col justify-end overflow-hidden rounded-lg bg-scrim p-5 text-foreground ring-1 ring-foreground/10 transition hover:ring-primary/60 sm:h-52">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover.posterLg || cover.poster || '/placeholder.svg'} alt="" loading="lazy" className="absolute inset-0 -z-0 size-full object-cover object-top opacity-45 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-75 group-hover:grayscale-0" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/50 to-transparent" />
                <span className="cine-bulbs absolute inset-x-5 top-4 h-2.5 opacity-0 transition duration-500 group-hover:opacity-100" aria-hidden="true" />
                <span className="relative flex items-end justify-between gap-3">
                  <span className="flex flex-col gap-1">
                    <span className="text-xl font-semibold tracking-tight sm:text-2xl">{g.label}</span>
                    <span className="text-sm text-foreground/65">{g.blurb}</span>
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-foreground/60 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
