import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, Layers, Radio, Star, Tv } from 'lucide-react'
import { DAY_TR, SERIES_GENRES, getSeries, getSeriesIndex } from '@/lib/series'
import { runtimeTr } from '@/lib/films'
import { FilmSynopsis } from '@/components/film/film-synopsis'
import { SeriesRow } from '@/components/series/series-card'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const s = await getSeries(id)
  if (!s) return { title: 'Dizi bulunamadı' }
  return {
    title: `${s.name}${s.year ? ` (${s.year})` : ''} — Dizi`,
    description: (s.summaryTr || s.summary).slice(0, 160),
    openGraph: { title: s.name, images: [s.backdrop ?? s.posterLg] },
  }
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : null)

export default async function SeriesDetailPage({ params }: Props) {
  const { id } = await params
  const s = await getSeries(id)
  if (!s) notFound()

  const all = await getSeriesIndex()
  const similar = all
    .filter((x) => x.id !== s.id)
    .map((x) => ({ x, score: x.genres.filter((g) => s.genres.includes(g)).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || (b.x.rating ?? 0) - (a.x.rating ?? 0))
    .slice(0, 18)
    .map((r) => r.x)

  const seasons = s.seasons.filter((x) => x.number > 0)
  const episodes = seasons.reduce((n, x) => n + (x.episodes ?? 0), 0)
  const span = s.year ? `${s.year}${s.ended ? ` – ${new Date(s.ended).getFullYear()}` : s.status === 'Running' ? ' – …' : ''}` : null
  const firstGenre = SERIES_GENRES.find((g) => s.genres.includes(g.tvmaze))

  const facts = [
    s.network && { icon: Tv, label: 'Kanal', value: s.network },
    span && { icon: CalendarDays, label: 'Yayın', value: span },
    seasons.length > 0 && { icon: Layers, label: 'Sezon', value: `${seasons.length} sezon${episodes ? ` · ${episodes} bölüm` : ''}` },
    s.runtime && { icon: Clock, label: 'Bölüm', value: runtimeTr(s.runtime) },
    { icon: Radio, label: 'Durum', value: s.statusTr },
    s.schedule && s.status === 'Running' && { icon: CalendarDays, label: 'Yayın günü', value: `${s.schedule.days.map((d) => DAY_TR[d] ?? d).join(', ')}${s.schedule.time ? ` ${s.schedule.time}` : ''}` },
  ].filter(Boolean) as { icon: typeof Tv; label: string; value: string }[]

  return (
    <div className="cine dark flex flex-col gap-20 pb-24">
      <section className="dark relative isolate overflow-hidden bg-scrim text-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s.backdrop || s.posterLg || '/placeholder.svg'}
          alt=""
          aria-hidden="true"
          className={s.backdrop ? 'absolute inset-0 -z-20 size-full object-cover opacity-55' : 'absolute inset-0 -z-20 size-full scale-125 object-cover opacity-50 blur-3xl saturate-150'}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--scrim)_0%,color-mix(in_oklch,var(--scrim)_70%,transparent)_55%,transparent_100%)]" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-page via-transparent to-scrim/40" aria-hidden="true" />
        <div className="grain absolute inset-0 -z-10" aria-hidden="true" />
        <span className="cine-letterbox top-0" aria-hidden="true" />
        <span className="cine-letterbox bottom-0" aria-hidden="true" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-10">
          <Link href="/diziler" className="flex w-fit items-center gap-2 text-sm text-foreground/60 transition hover:text-foreground">
            <ArrowLeft className="size-4" /> Tüm diziler
          </Link>

          <div className="grid items-end gap-8 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.posterLg || '/placeholder.svg'} alt={`${s.name} afişi`} className="aspect-[2/3] w-40 rounded-2xl object-cover shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] ring-1 ring-foreground/10 sm:w-52 lg:w-full" />
            <div className="flex flex-col gap-6">
              <p className="label-mono flex flex-wrap items-center gap-3 text-primary">
                <span className="h-px w-8 bg-primary" />
                Dizi
                {s.country ? ` · ${s.country}` : ''}
              </p>
              <h1 className="text-balance text-5xl font-bold leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{s.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {s.rating ? (
                  <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                    <Star className="size-4 fill-current" aria-hidden="true" />
                    {s.rating.toFixed(1)}
                    <span className="font-normal opacity-70">/ 10</span>
                  </span>
                ) : null}
                {s.genresTr.map((g, i) => {
                  const gid = SERIES_GENRES.find((x) => x.tvmaze === s.genres[i])?.id
                  return gid ? (
                    <Link key={g} href={`/diziler?tur=${gid}`} className="rounded-full border border-foreground/20 px-3.5 py-1.5 text-sm transition hover:border-primary hover:text-ink">
                      {g}
                    </Link>
                  ) : (
                    <span key={g} className="rounded-full border border-foreground/20 px-3.5 py-1.5 text-sm">
                      {g}
                    </span>
                  )
                })}
              </div>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/10 sm:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5 bg-scrim/70 px-4 py-3.5 backdrop-blur">
                    <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                      <f.icon className="size-3.5" aria-hidden="true" /> {f.label}
                    </dt>
                    <dd className="truncate text-sm font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:px-10">
        <FilmSynopsis original={s.summary} translated={s.summaryTr} kind="dizi" />
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Sezon <span className="accent-serif">rehberi</span>
          </h2>
          {seasons.length ? (
            <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {seasons.map((x) => (
                <li key={x.number} className="flex items-center gap-4 px-4 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted font-mono text-sm font-semibold text-ink">{String(x.number).padStart(2, '0')}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{x.number}. Sezon</span>
                    <span className="truncate text-xs text-muted-foreground">{[fmt(x.premiere), fmt(x.end)].filter(Boolean).join(' – ') || 'Tarih bilinmiyor'}</span>
                  </span>
                  {x.episodes ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{x.episodes} bölüm</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">Sezon bilgisi bulunamadı.</p>
          )}
          {s.officialSite && (
            <a href={s.officialSite} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
              Resmî site <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      {s.cast.length > 0 && (
        <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Oyuncu <span className="accent-serif">kadrosu</span>
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {s.cast.map((c) => (
              <li key={`${c.name}-${c.character}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 lg:flex-col lg:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image || '/placeholder.svg'} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl object-cover object-top lg:aspect-[4/5] lg:size-auto lg:w-full" />
                <span className="flex min-w-0 flex-col gap-0.5 lg:px-1 lg:pb-1">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{c.character}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SeriesRow eyebrow="Benzer" title="Bunu sevdiysen" accent="bunlar da" href={firstGenre ? `/diziler?tur=${firstGenre.id}` : '/diziler'} items={similar} />
    </div>
  )
}
