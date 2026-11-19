import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ArrowDown, Play } from 'lucide-react'
import { genreIdFor, getFilm, getFilmsByDirector, getFilmsByGenre, getTopFilms, runtimeTr } from '@/lib/films'
import { FilmRow } from '@/components/film/film-card'
import { FilmTrailer } from '@/components/film/film-trailer'
import { FilmSynopsis } from '@/components/film/film-synopsis'
import { FilmCast } from '@/components/film/film-cast'
import { DetailHero, taglineOf, type HeroFact } from '@/components/cine/detail-hero'
import { CastCreditsSkeleton, CineHeading } from '@/components/cine/cast-credits'
import { CreditsSheet } from '@/components/cine/credits-sheet'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const film = await getFilm(id)
  if (!film) return { title: 'Film bulunamadı' }
  return {
    title: `${film.title}${film.year ? ` (${film.year})` : ''}`,
    description: (film.summaryTr || film.summary).slice(0, 160),
    openGraph: { title: film.title, images: [film.posterLg] },
  }
}

const SECTIONS = [
  { id: 'fragman', label: 'Fragman & konu' },
  { id: 'oyuncular', label: 'Oyuncular' },
  { id: 'kunye', label: 'Künye' },
  { id: 'benzer', label: 'Benzerleri' },
]

export default async function FilmPage({ params }: Props) {
  const { id } = await params
  const film = await getFilm(id)
  if (!film) notFound()

  const genreId = genreIdFor(film.genre)
  const similar = (genreId ? await getFilmsByGenre(genreId, 30) : await getTopFilms(30)).filter((f) => f.id !== film.id).slice(0, 18)
  const release = film.release ? new Date(film.release).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  const runtime = runtimeTr(film.runtime)

  const facts = [
    film.director && { label: 'Yönetmen', value: film.director },
    runtime && { label: 'Süre', value: runtime },
    film.rating && { label: 'Yaş sınırı', value: film.rating },
  ].filter(Boolean) as HeroFact[]

  return (
    <div className="cine dark flex flex-col gap-24 pb-24">
      <DetailHero
        backHref="/filmler"
        backLabel="Tüm filmler"
        backdrop={null}
        backdropVideo={film.trailer}
        poster={film.posterLg}
        title={film.title}
        eyebrow={
          <>
            {genreId ? (
              <Link href={`/filmler?tur=${genreId}`} className="hover:underline">
                {film.genreTr}
              </Link>
            ) : (
              <span>{film.genreTr}</span>
            )}
            {film.year ? <span className="text-foreground/50">{film.year}</span> : null}
          </>
        }
        tagline={taglineOf(film.summaryTr || film.summary)}
        facts={facts}
        stub={film.year ? { label: 'Yıl', value: String(film.year) } : null}
        actions={
          <>
            {film.trailer && (
              <a href="#fragman" className="flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                <Play className="size-4 fill-current" aria-hidden="true" /> Fragmanı izle
              </a>
            )}
            <a href="#oyuncular" className="group flex h-12 items-center gap-2 rounded-full border border-foreground/20 px-5 text-sm font-medium transition hover:border-foreground/60">
              Oyuncu kadrosu <ArrowDown className="size-4 transition group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </>
        }
        sections={SECTIONS}
      />

      <section id="fragman" aria-label="Fragman ve konu" className="mx-auto grid w-full max-w-[1440px] scroll-mt-24 gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-start lg:px-10">
        {film.trailer ? (
          <FilmTrailer src={film.trailer} poster={film.posterLg} title={film.title} />
        ) : (
          <div className="grid aspect-video place-items-center rounded-3xl border border-dashed border-border text-sm text-muted-foreground">Bu film için fragman bulunamadı.</div>
        )}
        <FilmSynopsis original={film.summary} translated={film.summaryTr} />
      </section>

      <section id="oyuncular" aria-labelledby="oyuncular-baslik" className="mx-auto flex w-full max-w-[1440px] scroll-mt-24 flex-col gap-10 px-4 sm:px-6 lg:px-10">
        <CineHeading id="oyuncular-baslik" eyebrow="Jenerik" title="Oyuncu" accent="kadrosu" aside={<p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Oyuncu sayfası için bir isme dokun</p>} />
        <Suspense fallback={<CastCreditsSkeleton />}>
          <FilmCast title={film.title} year={film.year} director={film.director} />
        </Suspense>
      </section>

      <section id="kunye" aria-labelledby="kunye-baslik" className="mx-auto flex w-full max-w-[1440px] scroll-mt-24 flex-col gap-10 px-4 sm:px-6 lg:px-10">
        <CineHeading id="kunye-baslik" eyebrow="Kapanış yazıları" title="Film" accent="künyesi" />
        <CreditsSheet
          rows={[
            { role: 'Film', value: film.title },
            ...(film.director ? [{ role: 'Yönetmen', value: film.director }] : []),
            { role: 'Tür', value: genreId ? <Link href={`/filmler?tur=${genreId}`} className="text-ink hover:underline">{film.genreTr}</Link> : film.genreTr },
            ...(release ? [{ role: 'Vizyon', value: release }] : []),
            ...(runtime ? [{ role: 'Süre', value: runtime }] : []),
            ...(film.rating ? [{ role: 'Yaş sınırı', value: film.rating }] : []),
          ]}
          footnote="Bilgiler Apple TV Türkiye kataloğundan ve Wikidata'dan derlenmiştir."
        />
      </section>

      {film.director && (
        <Suspense fallback={null}>
          <DirectorRow director={film.director} filmId={film.id} />
        </Suspense>
      )}

      <div id="benzer" className="scroll-mt-24">
        <FilmRow eyebrow="Benzer" title="Bunu sevdiysen" accent="bunlar da" href={genreId ? `/filmler?tur=${genreId}` : '/filmler'} items={similar} />
      </div>
    </div>
  )
}

async function DirectorRow({ director, filmId }: { director: string; filmId: string }) {
  const films = await getFilmsByDirector(director, filmId)
  if (!films.length) return null
  return <FilmRow eyebrow="Yönetmen koltuğunda" title={director.split(/,|&/)[0].trim()} accent="filmografisi" href={`/sinema-ara?q=${encodeURIComponent(director)}&tur=film`} items={films} />
}
