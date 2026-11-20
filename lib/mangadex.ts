import 'server-only'

const API = 'https://api.mangadex.org'
const UA = 'Sytheris/1.0 (manga reader)'

const HEADERS = { 'User-Agent': UA, Accept: 'application/json' }

export type MangaCard = { id: string; title: string; cover: string; year: number | null; tags: string[] }
export type MangaChapter = { id: string; number: string; title: string; group: string; pages: number }

type Raw = {
  id: string
  attributes?: { title?: Record<string, string>; altTitles?: Record<string, string>[]; year?: number | null; tags?: { attributes?: { name?: Record<string, string> } }[] }
  relationships?: { type: string; attributes?: { fileName?: string } }[]
}

const title = (raw: Raw) => {
  const t = raw.attributes?.title || {}
  return t.tr || t.en || Object.values(t)[0] || raw.id
}

const cover = (raw: Raw) => {
  const file = raw.relationships?.find((r) => r.type === 'cover_art')?.attributes?.fileName
  return file ? 'https://uploads.mangadex.org/covers/' + raw.id + '/' + file + '.512.jpg' : ''
}

const shape = (raw: Raw): MangaCard => ({
  id: raw.id,
  title: title(raw),
  cover: cover(raw),
  year: raw.attributes?.year ?? null,
  tags: (raw.attributes?.tags || []).map((t) => t.attributes?.name?.tr || t.attributes?.name?.en || '').filter(Boolean).slice(0, 3),
})

const BASE_QUERY = new URLSearchParams()
BASE_QUERY.append('availableTranslatedLanguage[]', 'tr')
BASE_QUERY.append('includes[]', 'cover_art')
BASE_QUERY.append('hasAvailableChapters', 'true')
BASE_QUERY.append('order[followedCount]', 'desc')
for (const r of ['safe', 'suggestive', 'erotica', 'pornographic']) BASE_QUERY.append('contentRating[]', r)

/** MangaDex TR coverage is thin, so the listing is built from Turkish chapter uploads, not from titles. */
/** Everything that actually has a Turkish chapter, most followed first; falls back if the filter is rejected. */
const RATINGS = ['safe', 'suggestive', 'erotica', 'pornographic']

/** Collects manga ids that provably have a Turkish chapter by walking the TR chapter feed. */
async function trIds(q: string, page: number) {
  const seen = new Set<string>()
  for (let slice = 0; slice < 3; slice++) {
    const p = new URLSearchParams()
    p.append('translatedLanguage[]', 'tr')
    p.append('order[readableAt]', 'desc')
    p.append('includes[]', 'manga')
    p.set('limit', '100')
    p.set('offset', String((page - 1) * 300 + slice * 100))
    for (const r of RATINGS) p.append('contentRating[]', r)
    if (q) p.set('title', q)

    const res = await fetch(API + '/chapter?' + p.toString(), { headers: HEADERS, cache: 'no-store' })
    if (!res.ok) break
    const json = (await res.json()) as { data?: { relationships?: { type: string; id: string }[] }[] }
    const rows = json.data || []
    for (const ch of rows) {
      const id = ch.relationships?.find((r) => r.type === 'manga')?.id
      if (id) seen.add(id)
    }
    if (rows.length < 100) break
  }
  return [...seen]
}

export async function listManga(q: string, page = 1) {
  const ids = await trIds(q, Math.max(1, page))
  if (!ids.length) return { items: [] as MangaCard[], hasNext: false }

  const found = new Map<string, MangaCard>()
  for (let i = 0; i < ids.length; i += 100) {
    const mp = new URLSearchParams()
    for (const id of ids.slice(i, i + 100)) mp.append('ids[]', id)
    mp.append('includes[]', 'cover_art')
    mp.set('limit', '100')
    const res = await fetch(API + '/manga?' + mp.toString(), { headers: HEADERS, cache: 'no-store' })
    if (!res.ok) continue
    const json = (await res.json()) as { data?: Raw[] }
    for (const raw of json.data || []) {
      const card = shape(raw)
      if (card.title) found.set(card.id, card)
    }
  }

  const items = ids.map((id) => found.get(id)).filter((m): m is MangaCard => Boolean(m))
  return { items, hasNext: ids.length >= 60 }
}
export async function getManga(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const res = await fetch(API + '/manga/' + id + '?includes[]=cover_art', { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) return null
  const json = (await res.json()) as { data?: Raw }
  return json.data ? shape(json.data) : null
}

export async function listChapters(id: string): Promise<MangaChapter[]> {
  const p = new URLSearchParams()
  p.append('translatedLanguage[]', 'tr')
  p.append('order[chapter]', 'asc')
  p.set('limit', '500')
  p.append('includes[]', 'scanlation_group')
  const res = await fetch(API + '/manga/' + id + '/feed?' + p.toString(), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) return []
  const json = (await res.json()) as {
    data?: { id: string; attributes?: { chapter?: string | null; title?: string | null; pages?: number }; relationships?: { type: string; attributes?: { name?: string } }[] }[]
  }
  return (json.data || [])
    .map((ch) => ({
      id: ch.id,
      number: ch.attributes?.chapter || '',
      title: ch.attributes?.title || '',
      group: ch.relationships?.find((r) => r.type === 'scanlation_group')?.attributes?.name || '',
      pages: ch.attributes?.pages || 0,
    }))
    .filter((ch) => ch.pages > 0)
}

export async function chapterPages(chapterId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(chapterId)) return { base: '', hash: '', files: [] as string[] }
  const res = await fetch(API + '/at-home/server/' + chapterId, { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) return { base: '', hash: '', files: [] as string[] }
  const json = (await res.json()) as { baseUrl?: string; chapter?: { hash?: string; data?: string[] } }
  return { base: json.baseUrl || '', hash: json.chapter?.hash || '', files: json.chapter?.data || [] }
}