import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { FILM_GENRES, getFilmsByGenre, getTopFilms, isFilmGenre } from '@/lib/films'
import { hasKey, searchFilms } from '@/lib/film-source'
import { cn } from '@/lib/utils'
import { FilmCard } from '@/components/film/film-card'

export const metadata: Metadata = {
  title: 'Filmler',
  description: 'Türkiye listelerinden güncel filmler ve tüm arşivde arama.',
}

export default async function FilmsPage({ searchParams }: { searchParams: Promise<{ tur?: string; q?: string }> }) {
  const { tur, q: rawQ } = await searchParams
  const q = (rawQ || '').trim()
  const genre = isFilmGenre(tur) ? FILM_GENRES.find((g) => g.id === tur)! : null

  const found = q.length >= 2 ? await searchFilms(q) : []
  const films = q.length >= 2 ? [] : genre ? await getFilmsByGenre(genre.id, 60) : await getTopFilms(80)

  return (
    <div className="cine dark min-h-dvh">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-24 pt-10 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" /> Film modu
          </p>
          <h1 className="text-balance text-5xl font-bold tracking-[-0.04em] sm:text-6xl">
            {q ? 'Arama' : genre ? genre.label : 'Tüm'} <span className="accent-serif">{q ? 'sonuçları' : 'filmler'}</span>
          </h1>
          <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
            {q ? `"${q}" için bulunanlar.` : genre ? genre.blurb : 'Türkiye’de bu hafta en çok izlenenler. Arşivin tamamında aramak için yukarıdaki kutuyu kullan.'}
          </p>
        </header>

        {hasKey ? (
          <form action="/filmler" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border p-1.5 pl-5">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input name="q" defaultValue={q} placeholder="film adı ara" className="h-10 flex-1 bg-transparent text-sm outline-none" />
            <button className="h-10 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">Ara</button>
          </form>
        ) : null}

        {q ? (
          found.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {found.map((f) => (
                <li key={f.id}>
                  <Link href={'/film/izle/' + f.id} className="group flex flex-col gap-2">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-muted">
                      {f.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.poster} alt={f.title} className="size-full object-cover transition group-hover:scale-[1.03]" />
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium">{f.title}</p>
                    {f.year ? <p className="font-mono text-[10px] text-muted-foreground">{f.year}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Sonuç yok.</p>
          )
        ) : (
          <>
            <nav aria-label="Film türleri" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <Link href="/filmler" aria-current={!genre ? 'page' : undefined} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm transition', !genre ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
                Hepsi
              </Link>
              {FILM_GENRES.map((g) => (
                <Link key={g.id} href={`/filmler?tur=${g.id}`} aria-current={genre?.id === g.id ? 'page' : undefined} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm transition', genre?.id === g.id ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
                  {g.label}
                </Link>
              ))}
            </nav>

            {films.length ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {films.map((f, i) => (
                  <li key={f.id}>
                    <FilmCard film={f} rank={i < 10 ? i + 1 : undefined} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Bu tür için şu an film listelenemiyor.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}