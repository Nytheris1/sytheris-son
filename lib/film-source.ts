import 'server-only'
import { cache } from 'react'

const KEY = (process.env.TMDB_API_KEY || '').trim()
const BASE = 'https://api.themoviedb.org/3'

export type FilmProvider = { id: string; label: string; build: (id: string) => string }

export const SUB_PROVIDERS: FilmProvider[] = [
  { id: 'vidsrc', label: 'Vidsrc', build: (id) => 'https://vidsrc.mov/embed/movie/' + id },
  { id: 'vidsrc2', label: 'Vidsrc 2', build: (id) => 'https://vidsrc.xyz/embed/movie/' + id },
  { id: 'vidlink', label: 'VidLink', build: (id) => 'https://vidlink.pro/movie/' + id + '?sub=1' },
]

export const DUB_PROVIDERS: FilmProvider[] = [
  { id: 'e2', label: '2Embed', build: (id) => 'https://www.2embed.cc/embed/' + id },
  { id: 'esu', label: 'EmbedSU', build: (id) => 'https://embed.su/embed/movie/' + id },
  { id: 'vidsrc3', label: 'Vidsrc 3', build: (id) => 'https://vidsrc.to/embed/movie/' + id },
]

export const hasKey = Boolean(KEY)

type Hit = { id: number; title: string; original_title: string; release_date: string }

const bearer = () => KEY.startsWith('eyJ')

function url(u: string) {
  if (bearer()) return u
  return u + (u.includes('?') ? '&' : '?') + 'api_key=' + encodeURIComponent(KEY)
}

function headers(): Record<string, string> {
  return bearer() ? { accept: 'application/json', Authorization: 'Bearer ' + KEY } : { accept: 'application/json' }
}

export const resolveTmdbId = cache(async (title: string, year: number | null): Promise<number | null> => {
  if (!KEY || !title) return null
  const q = new URLSearchParams({ query: title, language: 'tr-TR', include_adult: 'false' })
  if (year) q.set('year', String(year))
  try {
    const res = await fetch(url(BASE + '/search/movie?' + q.toString()), {
      headers: headers(),
      next: { revalidate: 60 * 60 * 24 * 30 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { results?: Hit[] }
    const hits = json.results || []
    if (!hits.length) return null
    const same = hits.find((h) => {
      const t = h.title === title || h.original_title === title
      const y = !year || (h.release_date || '').startsWith(String(year))
      return t && y
    })
    const best = same || hits[0]
    return best.id || null
  } catch {
    return null
  }
})