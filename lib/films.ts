import 'server-only'
import { cache } from 'react'
import { translate } from './translate'

/*
 * Film mode catalogue. Source: Apple's public iTunes movie charts and lookup API (Türkiye storefront).
 * No API key, real posters up to 2000px, official trailers (m4v). Animation is filtered out so the
 * mode stays "anime olmayan". Every request is cached for six hours and fails soft to an empty list.
 */

export type FilmGenreId = 'aksiyon' | 'bilimkurgu' | 'gerilim' | 'dram' | 'komedi' | 'korku' | 'romantik' | 'aile' | 'belgesel' | 'western' | 'klasik'

export const FILM_GENRES: { id: FilmGenreId; itunes: number; label: string; blurb: string }[] = [
  { id: 'aksiyon', itunes: 4401, label: 'Aksiyon & Macera', blurb: 'Patlamalar, kovalamacalar, kahramanlar.' },
  { id: 'bilimkurgu', itunes: 4413, label: 'Bilim Kurgu & Fantastik', blurb: 'Başka dünyalar, başka zamanlar.' },
  { id: 'gerilim', itunes: 4416, label: 'Gerilim', blurb: 'Nefesini tutarak izleyeceklerin.' },
  { id: 'dram', itunes: 4406, label: 'Dram', blurb: 'İnsanı anlatan hikâyeler.' },
  { id: 'komedi', itunes: 4404, label: 'Komedi', blurb: 'Kötü günler için ilaç.' },
  { id: 'korku', itunes: 4408, label: 'Korku', blurb: 'Işıkları kapatma.' },
  { id: 'romantik', itunes: 4412, label: 'Romantik', blurb: 'Kalbi hızlandıranlar.' },
  { id: 'aile', itunes: 4410, label: 'Aile', blurb: 'Hep birlikte izlenecekler.' },
  { id: 'belgesel', itunes: 4405, label: 'Belgesel', blurb: 'Gerçek, kurgudan tuhaf.' },
  { id: 'western', itunes: 4418, label: 'Western', blurb: 'Toz, güneş ve düello.' },
  { id: 'klasik', itunes: 4403, label: 'Klasikler', blurb: 'Sinema tarihinin taşları.' },
]

const GENRE_TR: Record<string, string> = {
  'Action & Adventure': 'Aksiyon',
  'Sci-Fi & Fantasy': 'Bilim Kurgu',
  Thriller: 'Gerilim',
  Drama: 'Dram',
  Comedy: 'Komedi',
  Horror: 'Korku',
  Romance: 'Romantik',
  'Kids & Family': 'Aile',
  Documentary: 'Belgesel',
  Western: 'Western',
  Classics: 'Klasik',
  Sports: 'Spor',
  Independent: 'Bağımsız',
  Foreign: 'Yabancı',
  Musicals: 'Müzikal',
  'Music Feature Films': 'Müzik',
  'Special Interest': 'Özel',
  Holiday: 'Tatil',
}

const EXCLUDED_GENRES = new Set(['Anime', 'Japanese Cinema', 'Animation'])

export type Film = {
  id: string
  title: string
  director: string
  genre: string
  genreTr: string
  year: number | null
  release: string | null
  summary: string
  poster: string
  posterLg: string
  trailer: string | null
  rights: string | null
}

export type FilmDetail = Film & { runtime: number | null; rating: string | null; summaryTr: string | null }

function sized(url: string, w: number, h: number) {
  return url.replace(/\/\d+x\d+bb(-\d+)?\.(png|jpg|jpeg)$/i, `/${w}x${h}bb.jpg`)
}

type FeedEntry = {
  'im:name': { label: string }
  'im:image': { label: string }[]
  summary?: { label: string }
  'im:artist'?: { label: string }
  category?: { attributes: { label: string } }
  'im:releaseDate'?: { label: string }
  id: { attributes: { 'im:id': string } }
  link?: { attributes: { rel?: string; href: string; 'im:assetType'?: string } }[] | { attributes: { rel?: string; href: string } }
  rights?: { label: string }
}

function fromEntry(e: FeedEntry): Film | null {
  const genre = e.category?.attributes.label ?? ''
  if (EXCLUDED_GENRES.has(genre)) return null
  const art = e['im:image']?.at(-1)?.label
  if (!art) return null
  const links = Array.isArray(e.link) ? e.link : e.link ? [e.link] : []
  const trailer = links.find((l) => l.attributes.rel === 'enclosure')?.attributes.href ?? null
  const release = e['im:releaseDate']?.label ?? null
  return {
    id: e.id.attributes['im:id'],
    title: e['im:name'].label,
    director: e['im:artist']?.label ?? '',
    genre,
    genreTr: GENRE_TR[genre] ?? genre,
    year: release ? new Date(release).getFullYear() : null,
    release,
    summary: e.summary?.label ?? '',
    poster: sized(art, 400, 600),
    posterLg: sized(art, 1000, 1500),
    trailer,
    rights: e.rights?.label ?? null,
  }
}

async function feed(path: string): Promise<Film[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/tr/rss/topmovies/${path}/json`, { next: { revalidate: 21600 } })
    if (!res.ok) return []
    const json = (await res.json()) as { feed?: { entry?: FeedEntry[] | FeedEntry } }
    const raw = json.feed?.entry
    const list = Array.isArray(raw) ? raw : raw ? [raw] : []
    const seen = new Set<string>()
    return list
      .map(fromEntry)
      .filter((f): f is Film => {
        if (!f || seen.has(f.id)) return false
        seen.add(f.id)
        return true
      })
  } catch {
    return []
  }
}

export const getTopFilms = cache((limit = 60) => feed(`limit=${limit}`))

export const getFilmsByGenre = cache((genre: FilmGenreId, limit = 40) => {
  const g = FILM_GENRES.find((x) => x.id === genre)
  return g ? feed(`limit=${limit}/genre=${g.itunes}`) : Promise.resolve([])
})

export function isFilmGenre(v?: string | null): v is FilmGenreId {
  return FILM_GENRES.some((g) => g.id === v)
}

export const getFilmHome = cache(async () => {
  const [top, action, scifi, thriller, drama, comedy, horror, classics] = await Promise.all([
    getTopFilms(60),
    getFilmsByGenre('aksiyon', 24),
    getFilmsByGenre('bilimkurgu', 24),
    getFilmsByGenre('gerilim', 24),
    getFilmsByGenre('dram', 24),
    getFilmsByGenre('komedi', 24),
    getFilmsByGenre('korku', 24),
    getFilmsByGenre('klasik', 24),
  ])
  return { top, action, scifi, thriller, drama, comedy, horror, classics }
})

type LookupResult = {
  trackId: number
  trackName: string
  artistName: string
  primaryGenreName: string
  releaseDate?: string
  longDescription?: string
  shortDescription?: string
  previewUrl?: string
  artworkUrl100?: string
  trackTimeMillis?: number
  contentAdvisoryRating?: string
}

export const getFilm = cache(async (id: string): Promise<FilmDetail | null> => {
  if (!/^\d{3,14}$/.test(id)) return null
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=tr`, { next: { revalidate: 21600 } })
    if (!res.ok) return null
    const r = ((await res.json()) as { results?: LookupResult[] }).results?.[0]
    if (!r || !r.artworkUrl100) return null
    const summary = r.longDescription || r.shortDescription || ''
    const summaryTr = summary ? await translate(summary, 'tr').catch(() => null) : null
    return {
      id: String(r.trackId),
      title: r.trackName,
      director: r.artistName,
      genre: r.primaryGenreName,
      genreTr: GENRE_TR[r.primaryGenreName] ?? r.primaryGenreName,
      year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : null,
      release: r.releaseDate ?? null,
      summary,
      summaryTr,
      poster: sized(r.artworkUrl100, 400, 600),
      posterLg: sized(r.artworkUrl100, 1000, 1500),
      trailer: r.previewUrl ?? null,
      rights: null,
      runtime: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 60000) : null,
      rating: r.contentAdvisoryRating ?? null,
    }
  } catch {
    return null
  }
})

function fromLookup(r: LookupResult): Film | null {
  if (!r.artworkUrl100 || EXCLUDED_GENRES.has(r.primaryGenreName)) return null
  return {
    id: String(r.trackId),
    title: r.trackName,
    director: r.artistName,
    genre: r.primaryGenreName,
    genreTr: GENRE_TR[r.primaryGenreName] ?? r.primaryGenreName,
    year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : null,
    release: r.releaseDate ?? null,
    summary: r.longDescription || r.shortDescription || '',
    poster: sized(r.artworkUrl100, 400, 600),
    posterLg: sized(r.artworkUrl100, 1000, 1500),
    trailer: r.previewUrl ?? null,
    rights: null,
  }
}

const fold = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

async function itunesSearch(term: string): Promise<Film[]> {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=movie&entity=movie&country=tr&limit=40`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = (await res.json()) as { results?: LookupResult[] }
    return (json.results ?? []).map(fromLookup).filter((f): f is Film => Boolean(f))
  } catch {
    return []
  }
}

/** Fallback when the iTunes search endpoint returns nothing: Wikidata films carrying an iTunes ID (P6398), resolved via the TR lookup. */
async function wikidataSearch(term: string): Promise<Film[]> {
  try {
    const headers = { 'User-Agent': 'SyraCinema/1.0 (cinema mode)', Accept: 'application/json' }
    const s = await fetch(`https://www.wikidata.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${term} haswbstatement:P6398`)}&srlimit=20&format=json`, { headers, next: { revalidate: 86400 } })
    const ids = (((await s.json()) as { query?: { search?: { title: string }[] } }).query?.search ?? []).map((x) => x.title).filter((t) => /^Q\d+$/.test(t))
    if (!ids.length) return []
    const query = `SELECT ?f ?it WHERE { VALUES ?f { ${ids.map((i) => `wd:${i}`).join(' ')} } ?f wdt:P6398 ?it . }`
    const sp = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { headers, next: { revalidate: 86400 } })
    const rows = (((await sp.json()) as { results?: { bindings?: { f: { value: string }; it: { value: string } }[] } }).results?.bindings ?? [])
    const order = new Map(ids.map((id, i) => [id, i]))
    const byFilm = new Map<string, string[]>()
    for (const r of rows) {
      const q = r.f.value.split('/').pop()!
      if (/^\d{3,14}$/.test(r.it.value)) byFilm.set(q, [...(byFilm.get(q) ?? []), r.it.value])
    }
    const itunesIds = [...byFilm.values()].flat().slice(0, 150)
    if (!itunesIds.length) return []
    const res = await fetch(`https://itunes.apple.com/lookup?id=${itunesIds.join(',')}&country=tr`, { next: { revalidate: 21600 } })
    const found = new Map(((((await res.json()) as { results?: LookupResult[] }).results ?? [])).map((r) => [String(r.trackId), r]))
    const out: { film: Film; rank: number }[] = []
    for (const [q, its] of byFilm) {
      const hit = its.map((i) => found.get(i)).find(Boolean)
      const film = hit ? fromLookup(hit) : null
      if (film) out.push({ film, rank: order.get(q) ?? 99 })
    }
    return out.sort((a, b) => a.rank - b.rank).map((x) => x.film)
  } catch {
    return []
  }
}

/** Film search across the catalogue we already show, the iTunes TR store, and a Wikidata-backed fallback. */
export const searchFilms = cache(async (q: string): Promise<Film[]> => {
  const term = q.trim().slice(0, 80)
  if (term.length < 2) return []
  const needle = fold(term)
  const [home, store] = await Promise.all([getFilmHome(), itunesSearch(term)])
  const local = Object.values(home)
    .flat()
    .filter((f) => fold(f.title).includes(needle) || fold(f.director).includes(needle))
  const remote = store.length ? store : await wikidataSearch(term)
  const seen = new Set<string>()
  return [...local, ...remote].filter((f) => {
    if (seen.has(f.id)) return false
    seen.add(f.id)
    return true
  }).slice(0, 48)
})

/** Other films by the same director, matched against the iTunes artist credit. */
export const getFilmsByDirector = cache(async (director: string, excludeId: string): Promise<Film[]> => {
  const name = director.split(/,|&/)[0]?.trim()
  if (!name || name.length < 3) return []
  const needle = fold(name)
  const [home, store, wiki] = await Promise.all([getFilmHome(), itunesSearch(name), wikidataSearch(name)])
  const seen = new Set<string>([excludeId])
  return [...Object.values(home).flat(), ...store, ...wiki]
    .filter((f) => {
      if (seen.has(f.id) || !fold(f.director).includes(needle)) return false
      seen.add(f.id)
      return true
    })
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 18)
})

export function genreIdFor(genre: string): FilmGenreId | null {
  const map: Record<string, FilmGenreId> = {
    'Action & Adventure': 'aksiyon',
    'Sci-Fi & Fantasy': 'bilimkurgu',
    Thriller: 'gerilim',
    Drama: 'dram',
    Comedy: 'komedi',
    Horror: 'korku',
    Romance: 'romantik',
    'Kids & Family': 'aile',
    Documentary: 'belgesel',
    Western: 'western',
    Classics: 'klasik',
  }
  return map[genre] ?? null
}

export function runtimeTr(min?: number | null) {
  if (!min) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h} sa ${m} dk` : `${m} dk`
}
