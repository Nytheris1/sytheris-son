import 'server-only'
import { cache } from 'react'
import { translate } from './translate'

/*
 * Dizi catalogue for cinema mode. Source: TVmaze public API (no key). The index pages are cached for a day
 * and ranked by TVmaze's popularity weight, then rating. Animation / anime are filtered out to keep the mode
 * "anime olmayan". Every request fails soft to an empty list / null.
 */

export type SeriesGenreId = 'dram' | 'suc' | 'bilimkurgu' | 'fantastik' | 'komedi' | 'gerilim' | 'korku' | 'aksiyon' | 'romantik' | 'gizem' | 'tarih'

export const SERIES_GENRES: { id: SeriesGenreId; tvmaze: string; label: string; blurb: string }[] = [
  { id: 'dram', tvmaze: 'Drama', label: 'Dram', blurb: 'Sezon sezon büyüyen karakterler.' },
  { id: 'suc', tvmaze: 'Crime', label: 'Suç', blurb: 'Dedektifler, soygunlar, yeraltı dünyası.' },
  { id: 'bilimkurgu', tvmaze: 'Science-Fiction', label: 'Bilim Kurgu', blurb: 'Yarının dünyasından bölümler.' },
  { id: 'fantastik', tvmaze: 'Fantasy', label: 'Fantastik', blurb: 'Ejderhalar, krallıklar, büyüler.' },
  { id: 'komedi', tvmaze: 'Comedy', label: 'Komedi', blurb: 'Yirmi dakikalık iyi hissettirenler.' },
  { id: 'gerilim', tvmaze: 'Thriller', label: 'Gerilim', blurb: 'Bir bölüm daha dedirtenler.' },
  { id: 'korku', tvmaze: 'Horror', label: 'Korku', blurb: 'Gece izlenmeyecek diziler.' },
  { id: 'aksiyon', tvmaze: 'Action', label: 'Aksiyon', blurb: 'Durmadan koşan hikâyeler.' },
  { id: 'romantik', tvmaze: 'Romance', label: 'Romantik', blurb: 'Kalpler, ayrılıklar, kavuşmalar.' },
  { id: 'gizem', tvmaze: 'Mystery', label: 'Gizem', blurb: 'Her bölüm yeni bir ipucu.' },
  { id: 'tarih', tvmaze: 'History', label: 'Tarih', blurb: 'Geçmişin büyük hikâyeleri.' },
]

const GENRE_TR: Record<string, string> = {
  Drama: 'Dram',
  Crime: 'Suç',
  'Science-Fiction': 'Bilim Kurgu',
  Fantasy: 'Fantastik',
  Comedy: 'Komedi',
  Thriller: 'Gerilim',
  Horror: 'Korku',
  Action: 'Aksiyon',
  Adventure: 'Macera',
  Romance: 'Romantik',
  Mystery: 'Gizem',
  History: 'Tarih',
  Supernatural: 'Doğaüstü',
  Medical: 'Tıp',
  Legal: 'Hukuk',
  Family: 'Aile',
  War: 'Savaş',
  Western: 'Western',
  Music: 'Müzik',
  Sports: 'Spor',
  Espionage: 'Casusluk',
}

const STATUS_TR: Record<string, string> = {
  Running: 'Devam ediyor',
  Ended: 'Tamamlandı',
  'To Be Determined': 'Belirsiz',
  'In Development': 'Yapım aşamasında',
}

const EXCLUDED = new Set(['Anime', 'Animation'])

export type Series = {
  id: string
  name: string
  genres: string[]
  genresTr: string[]
  year: number | null
  premiered: string | null
  ended: string | null
  status: string
  statusTr: string
  rating: number | null
  network: string | null
  country: string | null
  language: string | null
  runtime: number | null
  summary: string
  poster: string
  posterLg: string
  weight: number
}

export type SeriesSeason = { number: number; episodes: number | null; premiere: string | null; end: string | null; image: string | null }
export type SeriesCast = { personId: number; name: string; character: string; image: string | null; personImage: string | null }

export type SeriesDetail = Series & {
  summaryTr: string | null
  backdrop: string | null
  officialSite: string | null
  schedule: { time: string; days: string[] } | null
  seasons: SeriesSeason[]
  cast: SeriesCast[]
}

type RawShow = {
  id: number
  name: string
  type: string
  language: string | null
  genres: string[]
  status: string
  runtime: number | null
  averageRuntime: number | null
  premiered: string | null
  ended: string | null
  officialSite: string | null
  schedule?: { time: string; days: string[] }
  rating?: { average: number | null }
  weight: number
  network?: { name: string; country?: { name: string } | null } | null
  webChannel?: { name: string; country?: { name: string } | null } | null
  image?: { medium: string; original: string } | null
  summary: string | null
  _embedded?: {
    seasons?: { number: number; episodeOrder: number | null; premiereDate: string | null; endDate: string | null; image?: { medium: string } | null }[]
    cast?: { person: { id: number; name: string; image?: { medium: string; original?: string } | null }; character: { name: string; image?: { medium: string } | null } }[]
    images?: { type: string; main?: boolean; resolutions: { original: { url: string; width?: number } } }[]
  }
}

export function plain(html: string | null | undefined) {
  return (html ?? '')
    .replace(/<\/p>\s*<p>/g, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function fromRaw(s: RawShow): Series | null {
  if (!s.image?.original || s.genres.some((g) => EXCLUDED.has(g)) || s.language === 'Japanese' || s.type === 'Animation') return null
  const channel = s.network ?? s.webChannel ?? null
  return {
    id: String(s.id),
    name: s.name,
    genres: s.genres,
    genresTr: s.genres.map((g) => GENRE_TR[g] ?? g),
    year: s.premiered ? new Date(s.premiered).getFullYear() : null,
    premiered: s.premiered,
    ended: s.ended,
    status: s.status,
    statusTr: STATUS_TR[s.status] ?? s.status,
    rating: s.rating?.average ?? null,
    network: channel?.name ?? null,
    country: channel?.country?.name ?? null,
    language: s.language,
    runtime: s.averageRuntime ?? s.runtime ?? null,
    summary: plain(s.summary),
    poster: s.image.medium,
    posterLg: s.image.original,
    weight: s.weight,
  }
}

/** Full-catalogue series search (TVmaze), anime and animation excluded like the rest of the mode. */
export const searchSeries = cache(async (q: string): Promise<Series[]> => {
  const term = q.trim().slice(0, 80)
  if (term.length < 2) return []
  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const hits = (await res.json()) as { show: RawShow }[]
    return hits.map((h) => fromRaw(h.show)).filter((s): s is Series => Boolean(s))
  } catch {
    return []
  }
})

async function page(n: number): Promise<RawShow[]> {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows?page=${n}`, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    return (await res.json()) as RawShow[]
  } catch {
    return []
  }
}

export const getSeriesIndex = cache(async (): Promise<Series[]> => {
  const pages = await Promise.all([0, 1, 2, 3, 4].map(page))
  const seen = new Set<string>()
  return pages
    .flat()
    .filter((s) => s.type === 'Scripted' && (s.rating?.average ?? 0) >= 6.5)
    .map(fromRaw)
    .filter((s): s is Series => {
      if (!s || seen.has(s.id)) return false
      seen.add(s.id)
      return true
    })
    .sort((a, b) => b.weight - a.weight || (b.rating ?? 0) - (a.rating ?? 0))
})

export function isSeriesGenre(v?: string | null): v is SeriesGenreId {
  return SERIES_GENRES.some((g) => g.id === v)
}

export const getSeriesByGenre = cache(async (genre: SeriesGenreId, limit = 40) => {
  const g = SERIES_GENRES.find((x) => x.id === genre)
  if (!g) return []
  return (await getSeriesIndex()).filter((s) => s.genres.includes(g.tvmaze)).slice(0, limit)
})

export const getSeriesHome = cache(async () => {
  const all = await getSeriesIndex()
  const popular = all.slice(0, 24)
  const topRated = [...all].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 24)
  const pick = (tvmaze: string) => all.filter((s) => s.genres.includes(tvmaze)).slice(0, 24)
  return { popular, topRated, crime: pick('Crime'), scifi: pick('Science-Fiction'), comedy: pick('Comedy') }
})

export const getSeries = cache(async (id: string): Promise<SeriesDetail | null> => {
  if (!/^\d{1,8}$/.test(id)) return null
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${id}?embed[]=seasons&embed[]=cast&embed[]=images`, { next: { revalidate: 43200 } })
    if (!res.ok) return null
    const raw = (await res.json()) as RawShow
    const base = fromRaw(raw)
    if (!base) return null
    const images = raw._embedded?.images ?? []
    const backdrop = (images.find((i) => i.type === 'background' && i.main) ?? images.find((i) => i.type === 'background'))?.resolutions.original.url ?? null
    const summaryTr = base.summary ? await translate(base.summary, 'tr').catch(() => null) : null
    return {
      ...base,
      summaryTr,
      backdrop,
      officialSite: raw.officialSite,
      schedule: raw.schedule?.days.length ? raw.schedule : null,
      seasons: (raw._embedded?.seasons ?? []).map((s) => ({ number: s.number, episodes: s.episodeOrder, premiere: s.premiereDate, end: s.endDate, image: s.image?.medium ?? null })),
      cast: (raw._embedded?.cast ?? []).slice(0, 18).map((c) => ({
        personId: c.person.id,
        name: c.person.name,
        character: c.character.name,
        image: c.character.image?.medium ?? c.person.image?.medium ?? null,
        personImage: c.person.image?.original ?? c.person.image?.medium ?? null,
      })),
    }
  } catch {
    return null
  }
})

export const DAY_TR: Record<string, string> = {
  Monday: 'Pazartesi',
  Tuesday: 'Salı',
  Wednesday: 'Çarşamba',
  Thursday: 'Perşembe',
  Friday: 'Cuma',
  Saturday: 'Cumartesi',
  Sunday: 'Pazar',
}
