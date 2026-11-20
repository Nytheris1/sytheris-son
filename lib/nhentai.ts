import 'server-only'

const API = 'https://nhentai.net/api/v2'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type NhCard = { id: number; title: string; thumb: string; pages: number }
export type NhGallery = NhCard & { files: string[] }

const HEADERS = { 'User-Agent': UA, Accept: 'application/json' }

type Img = { path?: string }
type Raw = {
  id: number
  english_title?: string
  japanese_title?: string
  title?: { english?: string; japanese?: string; pretty?: string }
  num_pages?: number
  thumbnail?: Img
  pages?: Img[]
}

const titleOf = (raw: Raw) =>
  raw.english_title || raw.title?.english || raw.title?.pretty || raw.title?.japanese || raw.japanese_title || 'Doujinshi'

const thumbOf = (raw: Raw) => (raw.thumbnail?.path ? 'https://t.nhentai.net/' + raw.thumbnail.path : '')

const shape = (raw: Raw): NhCard => ({
  id: raw.id,
  title: titleOf(raw),
  thumb: thumbOf(raw),
  pages: raw.num_pages || raw.pages?.length || 0,
})

export async function listDoujin(q: string, page = 1) {
  const p = new URLSearchParams()
  p.set('query', q || 'language:english')
  p.set('page', String(Math.max(1, page)))
  const res = await fetch(API + '/search?' + p.toString(), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('nhentai ' + res.status)
  const json = (await res.json()) as { result?: Raw[]; num_pages?: number }
  const items = (json.result || []).map(shape).filter((i) => i.thumb)
  return { items, hasNext: (json.num_pages ?? 1) > Math.max(1, page) }
}

export async function getGallery(id: string): Promise<NhGallery | null> {
  if (!/^\d+$/.test(id)) return null
  const res = await fetch(API + '/galleries/' + id, { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) return null
  const raw = (await res.json()) as Raw
  const files = (raw.pages || []).map((p) => p.path || '').filter(Boolean)
  return { ...shape(raw), files }
}

export function imageUrl(path: string) {
  return 'https://i.nhentai.net/' + path
}