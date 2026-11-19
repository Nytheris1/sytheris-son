import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HORROR_FILMS, horrorRuntime, type HorrorFilm } from '@/lib/horror'

const STRIP = 16

/** A different slice of the programme every day, stable for the whole day so SSR and cache agree. */
function tonightsProgramme(): HorrorFilm[] {
  const day = Math.floor(Date.now() / 86_400_000)
  const start = (day * 7) % HORROR_FILMS.length
  return Array.from({ length: Math.min(STRIP, HORROR_FILMS.length) }, (_, i) => HORROR_FILMS[(start + i * 5) % HORROR_FILMS.length])
}

function Poster({ film, hidden }: { film: HorrorFilm; hidden?: boolean }) {
  return (
    <li className="shrink-0" aria-hidden={hidden || undefined}>
      <Link
        href="/korku"
        tabIndex={hidden ? -1 : undefined}
        className="gs-poster group/p relative block aspect-[16/9] w-[78vw] max-w-[420px] overflow-hidden rounded-lg bg-scrim outline-none ring-1 ring-on-scrim/10 transition duration-500 hover:ring-[var(--hx)] focus-visible:ring-2 focus-visible:ring-[var(--hx)] sm:w-[420px]"
        aria-label={`${film.title} — ${film.director}. Gece Sineması'nda izle`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/korku/still/${film.slug}`}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full scale-[1.06] object-cover grayscale-[0.6] transition duration-[900ms] ease-out group-hover/p:scale-100 group-hover/p:grayscale-0"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/30 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--hx)]">{film.kind}</span>
            <span className="truncate text-lg font-semibold tracking-tight text-on-scrim">{film.title}</span>
          </span>
          <span className="shrink-0 rounded-sm border border-on-scrim/20 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-on-scrim/75">{horrorRuntime(film.duration)}</span>
        </span>
      </Link>
    </li>
  )
}

export function HorrorTeaser() {
  const programme = tonightsProgramme()

  return (
    <section
      className="dark relative isolate overflow-hidden bg-scrim py-16 text-foreground sm:py-24"
      aria-labelledby="gs-title"
      style={{ '--hx': 'oklch(0.62 0.22 25)' } as React.CSSProperties}
    >
      <div aria-hidden="true" className="hx-grain absolute inset-0 -z-10" />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-10">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[var(--hx)]">Sytheris+ · Kısa korku seçkisi</p>
          <h2 id="gs-title" className="text-balance text-5xl font-bold leading-[0.9] tracking-[-0.05em] sm:text-7xl">
            Gece <span className="hx-flicker font-serif font-normal italic text-[var(--hx)]">Sineması</span>
          </h2>
          <p className="max-w-lg text-pretty leading-relaxed text-foreground/65">
            Dünyanın dört bir yanından seçilmiş {HORROR_FILMS.length} kısa korku filmi, tek bir karanlık salonda. Program her gece yenilenir — ışıkları kapat, sesi aç.
          </p>
        </div>

        <Link
          href="/korku"
          className="group flex w-fit shrink-0 items-center gap-3 rounded-full bg-[var(--hx)] py-2 pl-6 pr-2 text-sm font-semibold text-on-scrim shadow-[0_18px_50px_-14px_var(--hx)] outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-on-scrim"
        >
          Salona gir
          <span className="grid size-9 place-items-center rounded-full bg-scrim/80 transition-transform duration-500 group-hover:translate-x-0.5">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <div className="gs-track mt-12 sm:mt-14" role="region" aria-label="Bu gecenin kısa korku filmleri">
        <ul className="gs-rail flex w-max gap-4 sm:gap-5">
          {programme.map((film) => (
            <Poster key={film.slug} film={film} />
          ))}
          {programme.map((film) => (
            <Poster key={`${film.slug}-loop`} film={film} hidden />
          ))}
        </ul>
      </div>
    </section>
  )
}
