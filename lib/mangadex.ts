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

const _UNUSED = new URLSearchParams()
BASE_QUERY.append('availableTranslatedLanguage[]', 'tr')
BASE_QUERY.append('includes[]', 'cover_art')
BASE_QUERY.append('hasAvailableChapters', 'true')
BASE_QUERY.append('order[followedCount]', 'desc')
for (const r of ['safe', 'suggestive', 'erotica', 'pornographic']) BASE_QUERY.append('contentRating[]', r)

/** MangaDex TR coverage is thin, so the listing is built from Turkish chapter uploads, not from titles. */
export async function listManga(q: string, page = 1) {
  const p = new URLSearchParams()
  p.append('translatedLanguage[]', 'tr')
  p.append('order[readableAt]', 'desc')
  p.append('includes[]', 'manga')
  p.set('limit', '100')
  p.set('offset', String((Math.max(1, page) - 1) * 40))
  for (const r of ['safe', 'suggestive', 'erotica', 'pornographic']) p.append('contentRating[]', r)
  if (q) p.set('title', q)

  const res = await fetch(API + '/chapter?' + p.toString(), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('mangadex ' + res.status + ' ' + (await res.text()).slice(0, 240))
  const json = (await res.json()) as { data?: { relationships?: { type: string; id: string }[] }[] }

  const ids: string[] = []
  for (const ch of json.data || []) {
    const id = ch.relationships?.find((r) => r.type === 'manga')?.id
    if (id && !ids.includes(id)) ids.push(id)
    if (ids.length >= 40) break
  }
  if (!ids.length) return { items: [] as MangaCard[], hasNext: false }

  const mp = new URLSearchParams()
  for (const id of ids) mp.append('ids[]', id)
  mp.append('includes[]', 'cover_art')
  mp.set('limit', '40')
  const mres = await fetch(API + '/manga?' + mp.toString(), { headers: HEADERS, cache: 'no-store' })
  if (!mres.ok) return { items: [] as MangaCard[], hasNext: false }
  const mjson = (await mres.json()) as { data?: Raw[] }
  const byId = new Map((mjson.data || []).map((m) => [m.id, shape(m)]))
  const items = ids.map((id) => byId.get(id)).filter((m): m is MangaCard => Boolean(m && m.title))

  return { items, hasNext: (json.data?.length ?? 0) >= 100 }
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