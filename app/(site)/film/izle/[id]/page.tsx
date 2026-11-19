import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DUB_PROVIDERS, SUB_PROVIDERS, filmById, hasKey } from '@/lib/film-source'
import { FilmWatch } from '@/components/film/film-watch'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const film = await filmById(id)
  return { title: film ? film.title + ' izle' : 'Film izle' }
}

export default async function FilmWatchPage({ params }: Props) {
  const { id } = await params
  const film = await filmById(id)
  if (!film) notFound()

  return (
    <div className="cine dark flex flex-col gap-10 pb-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-10 sm:px-6 lg:px-10">
        <Link href="/filmler" className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Tüm filmler
        </Link>
        <div className="mt-5 flex items-start gap-6">
          {film.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={film.poster} alt={film.title} className="hidden w-28 shrink-0 rounded-2xl border border-border object-cover sm:block" />
          ) : null}
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{film.title}</h1>
            {film.year ? <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{film.year}</p> : null}
            {film.overview ? <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{film.overview}</p> : null}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {hasKey ? (
          <FilmWatch
            tmdb={film.id}
            title={film.title}
            sub={SUB_PROVIDERS.map((p) => ({ id: p.id, label: p.label, url: p.build(String(film.id)) }))}
            dub={DUB_PROVIDERS.map((p) => ({ id: p.id, label: p.label, url: p.build(String(film.id)) }))}
          />
        ) : (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">TMDB_API_KEY tanımlı değil.</p>
        )}
      </div>
    </div>
  )
}