import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowDown, ArrowUpRight, Layers, Star } from 'lucide-react'
import { DAY_TR, SERIES_GENRES, getSeries, getSeriesIndex } from '@/lib/series'
import { runtimeTr } from '@/lib/films'
import { FilmSynopsis } from '@/components/film/film-synopsis'
import { SeriesRow } from '@/components/series/series-card'
import { SeasonReel } from '@/components/series/season-reel'
import { DetailHero, taglineOf, type HeroFact } from '@/components/cine/detail-hero'
import { CastCredits, CineHeading } from '@/components/cine/cast-credits'
import { CreditsSheet } from '@/components/cine/credits-sheet'

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

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null)

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
  const runtime = runtimeTr(s.runtime)
  const airDay = s.schedule && s.status === 'Running' ? `${s.schedule.days.map((d) => DAY_TR[d] ?? d).join(', ')}${s.schedule.time ? ` ${s.schedule.time}` : ''}` : null

  const facts = [
    s.network && { label: 'Kanal', value: s.network },
    span && { label: 'Yayın', value: span },
    runtime && { label: 'Bölüm', value: runtime },
    { label: 'Durum', value: s.statusTr },
  ].filter(Boolean) as HeroFact[]

  const sections = [
    { id: 'konu', label: 'Konu & sezonlar' },
    ...(s.cast.length ? [{ id: 'oyuncular', label: 'Oyuncular' }] : []),
    { id: 'kunye', label: 'Künye' },
    { id: 'benzer', label: 'Benzerleri' },
  ]

  return (
    <div className="cine dark flex flex-col gap-24 pb-24">
      <DetailHero
        backHref="/diziler"
        backLabel="Tüm diziler"
        backdrop={s.backdrop}
        poster={s.posterLg}
        title={s.name}
        eyebrow={
          <>
            <span>Dizi</span>
            {s.country ? <span className="text-foreground/50">{s.country}</span> : null}
          </>
        }
        chips={
          <>
            {s.rating ? (
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                <Star className="size-4 fill-current" aria-hidden="true" />
                {s.rating.toFixed(1)}
                <span className="sr-only">/ 10 puan</span>
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
          </>
        }
        tagline={taglineOf(s.summaryTr || s.summary)}
        facts={facts}
        stub={seasons.length ? { label: 'Sezon', value: String(seasons.length) } : null}
        actions={
          <>
            <a href="#konu" className="flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
              <Layers className="size-4" aria-hidden="true" /> Sezonlar
            </a>
            {s.cast.length > 0 && (
              <a href="#oyuncular" className="group flex h-12 items-center gap-2 rounded-full border border-foreground/20 px-5 text-sm font-medium transition hover:border-foreground/60">
                Oyuncu kadrosu <ArrowDown className="size-4 transition group-hover:translate-y-0.5" aria-hidden="true" />
              </a>
            )}
          </>
        }
        sections={sections}
      />

      <section id="konu" aria-label="Konu ve sezonlar" className="mx-auto flex w-full max-w-[1440px] scroll-mt-24 flex-col gap-14 px-4 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <FilmSynopsis original={s.summary} translated={s.summaryTr} kind="dizi" />
          <dl className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-2xl bg-border ring-1 ring-border">
            {[
              ['Sezon', seasons.length ? String(seasons.length) : '—'],
              ['Bölüm', episodes ? String(episodes) : '—'],
              ['Puan', s.rating ? s.rating.toFixed(1) : '—'],
              ['Yayın günü', airDay ?? (s.status === 'Ended' ? 'Final yaptı' : '—')],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-2 bg-card p-5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{k}</dt>
                <dd className="truncate text-2xl font-bold tracking-tight">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-6">
          <CineHeading eyebrow="Makara makara" title="Sezon" accent="rehberi" aside={episodes ? <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{seasons.length} sezon · {episodes} bölüm</p> : null} />
          <SeasonReel seasons={seasons} fallback={s.posterLg} />
        </div>
      </section>

      {s.cast.length > 0 && (
        <section id="oyuncular" aria-labelledby="oyuncular-baslik" className="mx-auto flex w-full max-w-[1440px] scroll-mt-24 flex-col gap-10 px-4 sm:px-6 lg:px-10">
          <CineHeading id="oyuncular-baslik" eyebrow="Jenerik" title="Oyuncu" accent="kadrosu" aside={<p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Oyuncu sayfası için bir isme dokun</p>} />
          <CastCredits people={s.cast.map((c) => ({ href: `/oyuncu/tv-${c.personId}`, name: c.name, character: c.character, image: c.personImage ?? c.image }))} />
        </section>
      )}

      <section id="kunye" aria-labelledby="kunye-baslik" className="mx-auto flex w-full max-w-[1440px] scroll-mt-24 flex-col gap-10 px-4 sm:px-6 lg:px-10">
        <CineHeading
          id="kunye-baslik"
          eyebrow="Kapanış yazıları"
          title="Dizi"
          accent="künyesi"
          aside={
            s.officialSite ? (
              <a href={s.officialSite} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-ink">
                Resmî site <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>
            ) : null
          }
        />
        <CreditsSheet
          rows={[
            { role: 'Dizi', value: s.name },
            ...(s.network ? [{ role: 'Kanal', value: s.network }] : []),
            ...(s.country ? [{ role: 'Ülke', value: s.country }] : []),
            ...(s.genresTr.length ? [{ role: 'Tür', value: s.genresTr.join(', ') }] : []),
            ...(fmt(s.premiered) ? [{ role: 'İlk bölüm', value: fmt(s.premiered)! }] : []),
            ...(fmt(s.ended) ? [{ role: 'Final', value: fmt(s.ended)! }] : []),
            ...(runtime ? [{ role: 'Bölüm süresi', value: runtime }] : []),
            ...(s.cast[0] ? [{ role: 'Başrolde', value: s.cast.slice(0, 3).map((c) => c.name).join(', ') }] : []),
          ]}
          footnote="Bilgiler TVmaze kataloğundan derlenmiştir."
        />
      </section>

      <div id="benzer" className="scroll-mt-24">
        <SeriesRow eyebrow="Benzer" title="Bunu sevdiysen" accent="bunlar da" href={firstGenre ? `/diziler?tur=${firstGenre.id}` : '/diziler'} items={similar} />
      </div>
    </div>
  )
}
