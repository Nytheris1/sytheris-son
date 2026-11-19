import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowRight, Clapperboard, Play, Star, Tv } from 'lucide-react'
import { FILM_GENRES, getTopFilms, searchFilms, type Film } from '@/lib/films'
import { SERIES_GENRES, searchSeries, type Series } from '@/lib/series'
import { FilmCard } from '@/components/film/film-card'
import { SeriesCard } from '@/components/series/series-card'
import { CineSearchBox } from '@/components/cine/cine-search-box'
import { CineHeading } from '@/components/cine/cast-credits'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Film & dizi ara', description: 'Tüm film ve dizi kataloğunda ada, yönetmene ve türe göre ara.' }

type Kind = 'hepsi' | 'film' | 'dizi'
type SP = Promise<{ q?: string; tur?: string }>

const kindOf = (v?: string): Kind => (v === 'film' || v === 'dizi' ? v : 'hepsi')
const GRID = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'

export default async function CinemaSearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const kind = kindOf(sp.tur)

  return (
    <div className="cine dark flex flex-col gap-8 pb-24">
      <section className="relative isolate overflow-hidden bg-scrim text-foreground">
        <div className="cine-beam absolute inset-0 -z-10" aria-hidden="true" />
        <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-page to-transparent" aria-hidden="true" />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-10 pt-14 sm:px-6 lg:pt-20">
          <div className="flex flex-col gap-4">
            <p className="label-mono flex items-center gap-3 text-primary">
              <span className="h-px w-8 bg-primary" aria-hidden="true" />
              Gişe · Arama
            </p>
            <h1 className="text-balance text-5xl font-bold leading-[0.92] tracking-[-0.05em] sm:text-7xl">
              Bu gece ne <span className="accent-serif">izliyoruz?</span>
            </h1>
          </div>
          <CineSearchBox initial={q} kind={kind} />
          <KindTabs q={q} kind={kind} />
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-4 sm:px-6 lg:px-10">
        {q.length >= 2 ? (
          <Suspense key={`${q}-${kind}`} fallback={<ResultsSkeleton />}>
            <Results q={q} kind={kind} />
          </Suspense>
        ) : (
          <Idle />
        )}
      </div>
    </div>
  )
}

function KindTabs({ q, kind }: { q: string; kind: Kind }) {
  const href = (k: Kind) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (k !== 'hepsi') sp.set('tur', k)
    return `/sinema-ara${sp.size ? `?${sp}` : ''}`
  }
  const tabs: { k: Kind; label: string; icon?: typeof Tv }[] = [
    { k: 'hepsi', label: 'Hepsi' },
    { k: 'film', label: 'Filmler', icon: Clapperboard },
    { k: 'dizi', label: 'Diziler', icon: Tv },
  ]
  return (
    <nav aria-label="Arama türü" className="flex w-fit gap-1 rounded-full bg-foreground/[0.06] p-1">
      {tabs.map((t) => (
        <Link
          key={t.k}
          href={href(t.k)}
          scroll={false}
          aria-current={kind === t.k ? 'page' : undefined}
          className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm transition', kind === t.k ? 'bg-primary font-semibold text-primary-foreground' : 'text-foreground/70 hover:text-foreground')}
        >
          {t.icon && <t.icon className="size-4" aria-hidden="true" />}
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

async function Results({ q, kind }: { q: string; kind: Kind }) {
  const [films, series] = await Promise.all([kind !== 'dizi' ? searchFilms(q) : Promise.resolve([] as Film[]), kind !== 'film' ? searchSeries(q) : Promise.resolve([] as Series[])])

  if (!films.length && !series.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-20 text-center">
        <p className="text-balance text-2xl font-semibold tracking-tight">
          {'"'}
          {q}
          {'"'} için <span className="accent-serif">perde kapalı</span>
        </p>
        <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">Yazımı kontrol et ya da filmin orijinal (İngilizce) adını dene. Yönetmen adıyla da arayabilirsin.</p>
      </div>
    )
  }

  const best = pickBest(q, films, series)

  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground" aria-live="polite">
        {films.length} film · {series.length} dizi bulundu
      </p>

      {best && <BestMatch item={best} />}

      {films.length > 0 && (
        <section aria-labelledby="sonuc-film" className="flex flex-col gap-8">
          <CineHeading id="sonuc-film" eyebrow="Filmler" title="Perdede" accent={`${films.length} film`} />
          <ul className={GRID}>
            {films.map((f) => (
              <li key={f.id}>
                <FilmCard film={f} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {series.length > 0 && (
        <section aria-labelledby="sonuc-dizi" className="flex flex-col gap-8">
          <CineHeading id="sonuc-dizi" eyebrow="Diziler" title="Ekranda" accent={`${series.length} dizi`} />
          <ul className={GRID}>
            {series.map((s) => (
              <li key={s.id}>
                <SeriesCard series={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

type Best = { kind: 'film'; film: Film } | { kind: 'dizi'; series: Series }

function pickBest(q: string, films: Film[], series: Series[]): Best | null {
  const n = q.toLocaleLowerCase('tr')
  const exactFilm = films.find((f) => f.title.toLocaleLowerCase('tr') === n)
  const exactSeries = series.find((s) => s.name.toLocaleLowerCase('tr') === n)
  if (exactFilm) return { kind: 'film', film: exactFilm }
  if (exactSeries) return { kind: 'dizi', series: exactSeries }
  if (films[0]) return { kind: 'film', film: films[0] }
  if (series[0]) return { kind: 'dizi', series: series[0] }
  return null
}

function BestMatch({ item }: { item: Best }) {
  const d =
    item.kind === 'film'
      ? { href: `/film/${item.film.id}`, title: item.film.title, poster: item.film.posterLg, meta: [item.film.genreTr, item.film.year, item.film.director].filter(Boolean).join(' · '), text: item.film.summary, label: 'Film', rating: null }
      : { href: `/dizi/${item.series.id}`, title: item.series.name, poster: item.series.posterLg, meta: [item.series.genresTr.slice(0, 2).join(', '), item.series.year, item.series.network].filter(Boolean).join(' · '), text: item.series.summary, label: 'Dizi', rating: item.series.rating }

  return (
    <Link href={d.href} className="dark group relative isolate flex flex-col overflow-hidden rounded-3xl bg-scrim text-foreground ring-1 ring-border outline-none transition focus-visible:ring-2 focus-visible:ring-primary sm:flex-row">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={d.poster || '/placeholder.svg'} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-35 blur-3xl saturate-150" />
      <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
      <div className="relative shrink-0 p-5 sm:p-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={d.poster || '/placeholder.svg'} alt={`${d.title} afişi`} className="aspect-[2/3] w-36 rotate-[-2deg] rounded-md object-cover shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)] transition duration-500 group-hover:rotate-0 sm:w-44" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 px-5 pb-7 sm:py-7 sm:pl-0 sm:pr-10">
        <p className="label-mono flex items-center gap-3 text-primary">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          En iyi eşleşme · {d.label}
        </p>
        <h2 className="text-balance text-3xl font-bold leading-none tracking-[-0.04em] sm:text-5xl">{d.title}</h2>
        <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/60">
          {d.rating ? (
            <span className="flex items-center gap-1 text-primary">
              <Star className="size-3.5 fill-current" aria-hidden="true" />
              {d.rating.toFixed(1)}
            </span>
          ) : null}
          {d.meta}
        </p>
        {d.text && <p className="line-clamp-3 max-w-2xl text-pretty leading-relaxed text-foreground/75">{d.text}</p>}
        <span className="mt-1 flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition group-hover:brightness-110">
          <Play className="size-4 fill-current" aria-hidden="true" /> Sayfasına git
        </span>
      </div>
    </Link>
  )
}

async function Idle() {
  const top = (await getTopFilms(30)).slice(0, 12)
  const suggestions = top.slice(0, 8).map((f) => f.title)

  return (
    <>
      {suggestions.length > 0 && (
        <section aria-labelledby="oneriler" className="flex flex-col gap-5">
          <h2 id="oneriler" className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Bu hafta çok arananlar
          </h2>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <Link href={`/sinema-ara?q=${encodeURIComponent(s)}`} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary hover:text-ink">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="turler" className="grid gap-10 lg:grid-cols-2">
        <h2 id="turler" className="sr-only">
          Türler
        </h2>
        <GenreBoard title="Film" accent="türleri" icon={Clapperboard} items={FILM_GENRES.map((g) => ({ href: `/filmler?tur=${g.id}`, label: g.label, blurb: g.blurb }))} />
        <GenreBoard title="Dizi" accent="türleri" icon={Tv} items={SERIES_GENRES.map((g) => ({ href: `/diziler?tur=${g.id}`, label: g.label, blurb: g.blurb }))} />
      </section>

      {top.length > 0 && (
        <section aria-labelledby="gise" className="flex flex-col gap-8">
          <CineHeading id="gise" eyebrow="Gişe" title="Şu an" accent="zirvedekiler" aside={<Link href="/filmler" className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-ink">Tüm filmler <ArrowRight className="size-4" aria-hidden="true" /></Link>} />
          <ul className={GRID}>
            {top.map((f, i) => (
              <li key={f.id}>
                <FilmCard film={f} rank={i + 1} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function GenreBoard({ title, accent, icon: Icon, items }: { title: string; accent: string; icon: typeof Tv; items: { href: string; label: string; blurb: string }[] }) {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <Icon className="size-5 text-ink" aria-hidden="true" />
        {title} <span className="accent-serif -ml-1.5">{accent}</span>
      </h3>
      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border sm:grid-cols-2">
        {items.map((g) => (
          <li key={g.href}>
            <Link href={g.href} className="group flex h-full items-center justify-between gap-3 bg-card px-5 py-4 transition hover:bg-muted">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold transition group-hover:text-ink">{g.label}</span>
                <span className="truncate text-sm text-muted-foreground">{g.blurb}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-hidden="true">
      <div className="skeleton h-64 rounded-3xl" />
      <div className={GRID}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="skeleton aspect-[2/3] rounded-lg" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
