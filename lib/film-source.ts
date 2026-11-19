import 'server-only'
import { cache } from 'react'

const KEY = (process.env.TMDB_API_KEY || '').trim()
const BASE = 'https://api.themoviedb.org/3'

export type FilmProvider = { id: string; label: string; build: (id: string) => string }
export type TmdbFilm = { id: number; title: string; year: number | null; poster: string; overview: string }

export const hasKey = Boolean(KEY)

/** lang sets the audio track, ds_lang the subtitle track. Turkish dub = lang=tr. */
export const SUB_PROVIDERS: FilmProvider[] = [
  { id: 'apiplayer', label: 'APIPlayer', build: (id) => 'https://apiplayer.ru/embed/movie/' + id + '?lang=en&ds_lang=tr&subSize=1.4' },
  { id: 'tgvid', label: 'TGVID', build: (id) => 'https://tgvid.lovable.app/embed/movie/' + id + '?lang=en' },
  { id: 'icefy', label: 'Icefy', build: (id) => 'https://embed.icefy.top/movie/' + id },
  { id: 'vidsrc', label: 'Vidsrc', build: (id) => 'https://vidsrc.mov/embed/movie/' + id },
]

export const DUB_PROVIDERS: FilmProvider[] = [
  { id: 'apiplayer-tr', label: 'APIPlayer', build: (id) => 'https://apiplayer.ru/embed/movie/' + id + '?lang=tr&ds_lang=tr' },
  { id: 'tgvid-tr', label: 'TGVID', build: (id) => 'https://tgvid.lovable.app/embed/movie/' + id + '?lang=tr' },
  { id: 'icefy-tr', label: 'Icefy', build: (id) => 'https://embed.icefy.top/movie/' + id + '?lang=tr' },
  { id: 'vidsrc-tr', label: 'Vidsrc', build: (id) => 'https://vidsrc.mov/embed/movie/' + id + '?lang=tr' },
]

const bearer = () => KEY.startsWith('eyJ')

function url(u: string) {
  if (bearer()) return u
  return u + (u.includes('?') ? '&' : '?') + 'api_key=' + encodeURIComponent(KEY)
}

function headers(): Record<string, string> {
  return bearer() ? { accept: 'application/json', Authorization: 'Bearer ' + KEY } : { accept: 'application/json' }
}

type Raw = {
  id: number
  title?: string
  original_title?: string
  release_date?: string
  poster_path?: string
  overview?: string
}

const poster = (path?: string) => (path ? 'https://image.tmdb.org/t/p/w500' + path : '')

function shape(raw: Raw): TmdbFilm {
  return {
    id: raw.id,
    title: raw.title || raw.original_title || String(raw.id),
    year: raw.release_date ? Number(raw.release_date.slice(0, 4)) || null : null,
    poster: poster(raw.poster_path),
    overview: raw.overview || '',
  }
}

export const searchFilms = cache(async (q: string): Promise<TmdbFilm[]> => {
  if (!KEY || q.trim().length < 2) return []
  const p = new URLSearchParams({ query: q.trim(), language: 'tr-TR', include_adult: 'false' })
  try {
    const res = await fetch(url(BASE + '/search/movie?' + p.toString()), { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = (await res.json()) as { results?: Raw[] }
    return (json.results || []).map(shape).slice(0, 30)
  } catch {
    return []
  }
})

export const filmById = cache(async (id: string): Promise<TmdbFilm | null> => {
  if (!KEY || !/^\d+$/.test(id)) return null
  try {
    const res = await fetch(url(BASE + '/movie/' + id + '?language=tr-TR'), { headers: headers(), next: { revalidate: 86400 } })
    if (!res.ok) return null
    return shape((await res.json()) as Raw)
  } catch {
    return null
  }
})

export const resolveTmdbId = cache(async (title: string, year: number | null): Promise<number | null> => {
  if (!KEY || !title) return null
  const p = new URLSearchParams({ query: title, language: 'tr-TR', include_adult: 'false' })
  if (year) p.set('year', String(year))
  try {
    const res = await fetch(url(BASE + '/search/movie?' + p.toString()), { headers: headers(), next: { revalidate: 86400 } })
    if (!res.ok) return null
    const json = (await res.json()) as { results?: Raw[] }
    const hits = json.results || []
    if (!hits.length) return null
    const same = hits.find((h) => {
      const t = h.title === title || h.original_title === title
      const y = !year || (h.release_date || '').startsWith(String(year))
      return t && y
    })
    return (same || hits[0]).id || null
  } catch {
    return null
  }
})