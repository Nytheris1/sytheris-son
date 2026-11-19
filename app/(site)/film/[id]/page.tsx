import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Clock, Clapperboard, ShieldCheck } from 'lucide-react'
import { genreIdFor, getFilm, getFilmsByGenre, getTopFilms, runtimeTr } from '@/lib/films'
import { FilmRow } from '@/components/film/film-card'
import { FilmTrailer } from '@/components/film/film-trailer'
import { FilmSynopsis } from '@/components/film/film-synopsis'

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

export default async function FilmPage({ params }: Props) {
  const { id } = await params
  const film = await getFilm(id)
  if (!film) notFound()

  const genreId = genreIdFor(film.genre)
  const similar = (genreId ? await getFilmsByGenre(genreId, 30) : await getTopFilms(30)).filter((f) => f.id !== film.id).slice(0, 18)
  const release = film.release ? new Date(film.release).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  const facts = [
    film.director && { icon: Clapperboard, label: 'Yönetmen', value: film.director },
    release && { icon: CalendarDays, label: 'Çıkış', value: release },
    film.runtime && { icon: Clock, label: 'Süre', value: runtimeTr(film.runtime) },
    film.rating && { icon: ShieldCheck, label: 'Yaş sınırı', value: film.rating },
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[]

  return (
    <div className="cine dark flex flex-col gap-20 pb-24">
      <section className="dark relative isolate overflow-hidden bg-scrim text-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={film.posterLg || '/placeholder.svg'} alt="" className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-50 blur-3xl saturate-150" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-page via-scrim/60 to-scrim/30" aria-hidden="true" />
        <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-10">
          <Link href="/filmler" className="flex w-fit items-center gap-2 text-sm text-foreground/60 transition hover:text-foreground">
            <ArrowLeft className="size-4" /> Tüm filmler
          </Link>

          <div className="grid items-end gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={film.posterLg || '/placeholder.svg'} alt={`${film.title} afişi`} className="aspect-[2/3] w-48 rounded-2xl object-cover shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] ring-1 ring-foreground/10 sm:w-60 lg:w-full" />
            <div className="flex flex-col gap-6">
              <p className="label-mono flex items-center gap-3 text-primary">
                <span className="h-px w-8 bg-primary" />
                {genreId ? (
                  <Link href={`/filmler?tur=${genreId}`} className="hover:underline">
                    {film.genreTr}
                  </Link>
                ) : (
                  film.genreTr
                )}
                {film.year ? ` · ${film.year}` : ''}
              </p>
              <h1 className="text-balance text-5xl font-bold leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{film.title}</h1>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/10 sm:grid-cols-4">
                {facts.map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5 bg-scrim/70 px-4 py-3.5 backdrop-blur">
                    <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                      <f.icon className="size-3.5" /> {f.label}
                    </dt>
                    <dd className="truncate text-sm font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-10">
        {film.trailer ? (
          <FilmTrailer src={film.trailer} poster={film.posterLg} title={film.title} />
        ) : (
          <div className="grid aspect-video place-items-center rounded-3xl border border-dashed border-border text-sm text-muted-foreground">Bu film için fragman bulunamadı.</div>
        )}
        <FilmSynopsis original={film.summary} translated={film.summaryTr} />
      </section>

      <FilmRow eyebrow="Benzer" title="Bunu sevdiysen" accent="bunlar da" href={genreId ? `/filmler?tur=${genreId}` : '/filmler'} items={similar} />
    </div>
  )
}
