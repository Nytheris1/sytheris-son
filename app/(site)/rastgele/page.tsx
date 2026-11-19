import type { Metadata } from 'next'
import { getViewer } from '@/lib/viewer'
import { getContentMode } from '@/lib/content-mode'
import { getFilmHome, runtimeTr } from '@/lib/films'
import { getSeriesIndex } from '@/lib/series'
import { SectionHeading } from '@/components/anime/section-heading'
import { FateDeck } from '@/components/random/fate-deck'
import { CineRoulette, type RouletteItem } from '@/components/random/cine-roulette'

export const metadata: Metadata = {
  title: 'Rastgele Öneri',
  description: 'Ruh haline göre bir kart çek ya da sinema modunda makarayı çevir; sıradaki anime, film ya da dizi seni bulsun.',
}

async function cinemaPool() {
  const [films, series] = await Promise.all([getFilmHome(), getSeriesIndex()])
  const seen = new Set<string>()
  const filmItems: RouletteItem[] = [films.top, films.action, films.scifi, films.thriller, films.drama, films.comedy, films.horror, films.classics]
    .flat()
    .filter((f) => f.poster && !seen.has(f.id) && seen.add(f.id))
    .map((f) => ({ id: f.id, kind: 'film', title: f.title, poster: f.poster, posterLg: f.posterLg, genre: f.genreTr, year: f.year, summary: f.summary, rating: null, meta: f.director || null }))
  const seriesItems: RouletteItem[] = series.slice(0, 150).map((s) => ({
    id: s.id,
    kind: 'dizi',
    title: s.name,
    poster: s.poster,
    posterLg: s.posterLg,
    genre: s.genresTr[0] ?? 'Dizi',
    year: s.year,
    summary: s.summary,
    rating: s.rating,
    meta: s.network ?? (s.runtime ? runtimeTr(s.runtime) : null),
  }))
  const pool = [...filmItems, ...seriesItems]
  const counts = pool.reduce<Record<string, number>>((acc, p) => ((acc[p.genre] = (acc[p.genre] ?? 0) + 1), acc), {})
  const genres = Object.entries(counts)
    .filter(([, n]) => n >= 4)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
    .slice(0, 12)
  return { pool, genres }
}

export default async function RandomPage() {
  const mode = await getContentMode()

  if (mode === 'film') {
    const { pool, genres } = await cinemaPool()
    return (
      <div className="cine dark min-h-dvh">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-24 pt-10 sm:px-6 lg:px-10 lg:pt-14">
          <SectionHeading as="h1" eyebrow="Rastgele seans" title="Bu gece ne" accent="izlesek?" description="Film mi dizi mi, hangi tür? Seçimini yap, makarayı çevir; bu gecenin seansını şans belirlesin." />
          <CineRoulette pool={pool} genres={genres} />
        </div>
      </div>
    )
  }

  const viewer = await getViewer().catch(() => null)
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pt-14">
      <SectionHeading
        as="h1"
        eyebrow="Rastgele öneri"
        title="Sıradaki animeni"
        accent="kader seçsin"
        description="Ruh halini ya da sevdiğin klişeleri seç — isekai, harem, iyashikei, ölüm oyunu… Desteden bir kart çek; nadirliği puanına göre belirlenir."
      />
      <FateDeck loggedIn={Boolean(viewer)} />
    </div>
  )
}
