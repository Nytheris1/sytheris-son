import 'server-only'

const API = 'https://www.eporner.com/api/v2/video/search/'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type PornVideo = { id: string; title: string; thumb: string; duration: number; views: number }

type Raw = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function normalize(raw: Raw): PornVideo | null {
  const id = str(raw.id)
  if (!id) return null
  return {
    id,
    title: str(raw.title) || id,
    thumb: str(raw.default_thumb) || str(raw.thumb),
    duration: num(raw.length_min) * 60 + num(raw.length_sec),
    views: num(raw.views),
  }
}

export async function searchPorn(q: string, page = 1) {
  const p = new URLSearchParams({
    query: q,
    per_page: '30',
    page: String(page),
    thumbsize: 'big',
    order: q ? 'relevance' : 'top-weekly',
    format: 'json',
  })
  const res = await fetch(API + '?' + p.toString(), { headers: { 'User-Agent': UA }, cache: 'no-store' })
  if (!res.ok) throw new Error('eporner ' + res.status)
  const json = (await res.json()) as { videos?: Raw[] }
  const items = (json.videos ?? []).map(normalize).filter((v): v is PornVideo => Boolean(v))
  return { items, hasNext: items.length >= 30 }
}

export function embedUrl(id: string) {
  return 'https://www.eporner.com/embed/' + id + '/'
}