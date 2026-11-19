import 'server-only'

/**
 * Manga catalog backed by the public MangaDex API (https://api.mangadex.org/docs).
 * No key needed. Every image goes through /api/manga/img so covers and pages load
 * on any origin, and only MangaDex hosts are ever proxied.
 */

const API = 'https://api.mangadex.org'
const HEADERS = { 'User-Agent': 'Sytheris/1.0 (+anime catalog)', Accept: 'application/json' }
const RATINGS = ['safe', 'suggestive']
export const READ_LANGS = ['tr', 'en'] as const
export type ReadLang = (typeof READ_LANGS)[number]

export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled'

export type MangaCard = {
  id: string
  title: string
  altTitle: string | null
  cover: string | null
  coverHi: string | null
  status: MangaStatus | null
  year: number | null
  demographic: string | null
  tags: string[]
  hasTurkish: boolean
  lastChapter: string | null
}

export type MangaDetail = MangaCard & {
  description: string
  authors: string[]
  artists: string[]
  originalLanguage: string
  anilistId: number | null
  languages: string[]
  rating: number | null
  follows: number | null
}

export type ChapterItem = {
  id: string
  chapter: string | null
  volume: string | null
  title: string | null
  lang: string
  pages: number
  group: string | null
  publishedAt: string
}

type Rel = { id: string; type: string; attributes?: Record<string, unknown> }
type RawManga = {
  id: string
  attributes: {
    title: Record<string, string>
    altTitles: Record<string, string>[]
    description: Record<string, string>
    status: MangaStatus | null
    year: number | null
    publicationDemographic: string | null
    lastChapter: string | null
    originalLanguage: string
    availableTranslatedLanguages: (string | null)[]
    links: Record<string, string> | null
    tags: { attributes: { name: Record<string, string>; group: string } }[]
  }
  relationships: Rel[]
}

export const TAG_TR: Record<string, string> = {
  Action: 'Aksiyon',
  Adventure: 'Macera',
  Comedy: 'Komedi',
  Drama: 'Dram',
  Fantasy: 'Fantastik',
  Horror: 'Korku',
  Mystery: 'Gizem',
  Romance: 'Romantik',
  'Sci-Fi': 'Bilim Kurgu',
  'Slice of Life': 'Gündelik Yaşam',
  Sports: 'Spor',
  Psychological: 'Psikolojik',
  Thriller: 'Gerilim',
  Tragedy: 'Trajedi',
  Isekai: 'Isekai',
  Historical: 'Tarihî',
  Supernatural: 'Doğaüstü',
  'Martial Arts': 'Dövüş Sanatları',
  Mecha: 'Mecha',
  'School Life': 'Okul',
  Music: 'Müzik',
  Medical: 'Tıbbi',
  Crime: 'Suç',
  Philosophical: 'Felsefi',
  Magic: 'Büyü',
  Monsters: 'Canavarlar',
  Survival: 'Hayatta Kalma',
  Military: 'Askerî',
  Cooking: 'Yemek',
  'Award Winning': 'Ödüllü',
  'Long Strip': 'Webtoon',
  'Full Color': 'Tam Renkli',
  Adaptation: 'Uyarlama',
  Oneshot: 'Tek Bölüm',
  Reincarnation: 'Reenkarnasyon',
  'Time Travel': 'Zaman Yolculuğu',
  Villainess: 'Kötü Kız',
  Demons: 'İblisler',
  'Video Games': 'Oyun',
  'Office Workers': 'Ofis',
  Vampires: 'Vampirler',
  Zombies: 'Zombiler',
  Ninja: 'Ninja',
  Samurai: 'Samuray',
  'Post-Apocalyptic': 'Kıyamet Sonrası',
  'Gender Bender': 'Cinsiyet Değişimi',
  Superhero: 'Süper Kahraman',
  Delinquents: 'Serseriler',
  'Mafia': 'Mafya',
}

/** Genre chips shown on the catalog, mapped to MangaDex tag UUIDs (stable, from /manga/tag). */
export const GENRES = [
  { slug: 'aksiyon', label: 'Aksiyon', id: '391b0423-d847-456f-aff0-8b0cfc03066b' },
  { slug: 'macera', label: 'Macera', id: '87cc87cd-a395-47af-b27a-93258283bbc6' },
  { slug: 'fantastik', label: 'Fantastik', id: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc' },
  { slug: 'romantik', label: 'Romantik', id: '423e2eae-a7a2-4a8b-ac03-a8351462d71d' },
  { slug: 'komedi', label: 'Komedi', id: '4d32cc48-9f00-4cca-9b5a-a839f0764984' },
  { slug: 'dram', label: 'Dram', id: 'b9af3a63-f058-46de-a9a0-e0c13906197a' },
  { slug: 'korku', label: 'Korku', id: 'cdad7e68-1419-41dd-bdce-27753074a640' },
  { slug: 'gizem', label: 'Gizem', id: 'ee968100-4191-4968-93d3-f82d72be7e46' },
  { slug: 'psikolojik', label: 'Psikolojik', id: '3b60b75c-a2d7-4860-ab56-05f391bb889c' },
  { slug: 'bilim-kurgu', label: 'Bilim Kurgu', id: '256c8bd9-4904-4360-bf4f-508a76d67183' },
  { slug: 'gundelik', label: 'Gündelik Yaşam', id: 'e5301a23-ebd9-49dd-a0cb-2add944c7fe9' },
  { slug: 'spor', label: 'Spor', id: '69964a64-2f90-4d33-beeb-f3ed2875eb4c' },
  { slug: 'isekai', label: 'Isekai', id: 'ace04997-f6bd-436e-b261-779182193d3d' },
  { slug: 'dogaustu', label: 'Doğaüstü', id: 'eabc5b4c-6aff-42f3-b657-3e90cbd00b75' },
] as const

export const SORTS = {
  populer: { label: 'En popüler', order: { followedCount: 'desc' } },
  guncel: { label: 'Son güncellenen', order: { latestUploadedChapter: 'desc' } },
  puan: { label: 'En yüksek puan', order: { rating: 'desc' } },
  yeni: { label: 'En yeni', order: { createdAt: 'desc' } },
} as const
export type SortKey = keyof typeof SORTS

async function md<T>(path: string, params: URLSearchParams, revalidate = 1800): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}?${params.toString()}`, { headers: HEADERS, next: { revalidate } })
    if (!res.ok) {
      console.error('[manga]', path, res.status)
      return null
    }
    return (await res.json()) as T
  } catch (e) {
    console.error('[manga] fetch failed', (e as Error).message)
    return null
  }
}

export function mangaImg(url: string) {
  return `/api/manga/img?u=${encodeURIComponent(url)}`
}

function pickTitle(m: RawManga) {
  const t = m.attributes.title
  const alts = m.attributes.altTitles ?? []
  const altTr = alts.find((a) => a.tr)?.tr
  const altEn = alts.find((a) => a.en)?.en
  const main = t.en ?? altEn ?? t['ja-ro'] ?? Object.values(t)[0] ?? 'İsimsiz'
  const alt = altTr ?? t['ja-ro'] ?? alts.find((a) => a.ja)?.ja ?? null
  return { title: main, altTitle: alt && alt !== main ? alt : null }
}

function toCard(m: RawManga): MangaCard {
  const cover = m.relationships.find((r) => r.type === 'cover_art')?.attributes?.fileName as string | undefined
  const base = cover ? `https://uploads.mangadex.org/covers/${m.id}/${cover}` : null
  const tags = m.attributes.tags
    .filter((t) => t.attributes.group === 'genre' || t.attributes.group === 'theme')
    .sort((x, y) => Number(y.attributes.group === 'genre') - Number(x.attributes.group === 'genre'))
    .map((t) => t.attributes.name.en)
  return {
    id: m.id,
    ...pickTitle(m),
    cover: base ? mangaImg(`${base}.256.jpg`) : null,
    coverHi: base ? mangaImg(`${base}.512.jpg`) : null,
    status: m.attributes.status,
    year: m.attributes.year,
    demographic: m.attributes.publicationDemographic,
    tags: tags.map((t) => TAG_TR[t] ?? t).slice(0, 6),
    hasTurkish: m.attributes.availableTranslatedLanguages.includes('tr'),
    lastChapter: m.attributes.lastChapter || null,
  }
}

function baseParams(limit: number) {
  const p = new URLSearchParams()
  p.set('limit', String(limit))
  p.append('includes[]', 'cover_art')
  for (const r of RATINGS) p.append('contentRating[]', r)
  p.set('hasAvailableChapters', 'true')
  return p
}

export type CatalogQuery = { q?: string; genre?: string; sort?: SortKey; lang?: 'tr'; page?: number; status?: MangaStatus }

export async function listManga(query: CatalogQuery = {}, limit = 24) {
  const page = Math.max(1, query.page ?? 1)
  const p = baseParams(limit)
  p.set('offset', String((page - 1) * limit))
  if (query.q) p.set('title', query.q)
  const genre = GENRES.find((g) => g.slug === query.genre)
  if (genre) p.append('includedTags[]', genre.id)
  if (query.lang === 'tr') p.append('availableTranslatedLanguage[]', 'tr')
  else for (const l of READ_LANGS) p.append('availableTranslatedLanguage[]', l)
  if (query.status) p.append('status[]', query.status)
  const sort = SORTS[query.sort ?? 'populer'] ?? SORTS.populer
  if (!query.q || query.sort) for (const [k, v] of Object.entries(sort.order)) p.set(`order[${k}]`, v)
  else p.set('order[relevance]', 'desc')

  const data = await md<{ data: RawManga[]; total: number }>('/manga', p, query.q ? 600 : 1800)
  const total = Math.min(data?.total ?? 0, 10_000 - limit)
  return { items: (data?.data ?? []).map(toCard), total, page, pages: Math.max(1, Math.ceil(total / limit)) }
}

export async function getMangaHome() {
  const [popular, latest, turkish, top] = await Promise.all([
    listManga({ sort: 'populer' }, 18),
    listManga({ sort: 'guncel' }, 18),
    listManga({ sort: 'populer', lang: 'tr' }, 18),
    listManga({ sort: 'puan' }, 12),
  ])
  return { popular: popular.items, latest: latest.items, turkish: turkish.items, top: top.items, total: popular.total }
}

export async function getManga(id: string): Promise<MangaDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const p = new URLSearchParams()
  for (const inc of ['cover_art', 'author', 'artist']) p.append('includes[]', inc)
  const [data, stats] = await Promise.all([
    md<{ data: RawManga }>(`/manga/${id}`, p, 3600),
    md<{ statistics: Record<string, { rating?: { bayesian?: number }; follows?: number }> }>(`/statistics/manga/${id}`, new URLSearchParams(), 3600),
  ])
  if (!data?.data) return null
  const m = data.data
  const names = (type: string) => m.relationships.filter((r) => r.type === type).map((r) => String(r.attributes?.name ?? '')).filter(Boolean)
  const desc = m.attributes.description
  const s = stats?.statistics?.[id]
  return {
    ...toCard(m),
    tags: m.attributes.tags.map((t) => TAG_TR[t.attributes.name.en] ?? t.attributes.name.en),
    description: (desc.tr ?? desc.en ?? Object.values(desc)[0] ?? '').replace(/\[(\/)?[a-z]+\]/g, '').replace(/---[\s\S]*$/, '').trim(),
    authors: names('author'),
    artists: names('artist'),
    originalLanguage: m.attributes.originalLanguage,
    anilistId: m.attributes.links?.al ? Number(m.attributes.links.al) || null : null,
    languages: m.attributes.availableTranslatedLanguages.filter((l): l is string => !!l),
    rating: s?.rating?.bayesian ? Math.round(s.rating.bayesian * 10) / 10 : null,
    follows: s?.follows ?? null,
  }
}

type RawChapter = {
  id: string
  attributes: { chapter: string | null; volume: string | null; title: string | null; translatedLanguage: string; pages: number; publishAt: string; externalUrl: string | null }
  relationships: Rel[]
}

/** Chapters in reading order. `includeEmptyPages=0` drops licensed/external chapters that can't be read here. */
export async function getChapters(id: string, lang: ReadLang): Promise<ChapterItem[]> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return []
  const all: ChapterItem[] = []
  for (let offset = 0; offset < 1500; offset += 500) {
    const p = new URLSearchParams()
    p.set('limit', '500')
    p.set('offset', String(offset))
    p.append('translatedLanguage[]', lang)
    p.set('order[volume]', 'asc')
    p.set('order[chapter]', 'asc')
    p.set('includeEmptyPages', '0')
    p.append('includes[]', 'scanlation_group')
    for (const r of RATINGS) p.append('contentRating[]', r)
    const data = await md<{ data: RawChapter[]; total: number }>(`/manga/${id}/feed`, p, 900)
    if (!data) break
    for (const c of data.data) {
      if (c.attributes.externalUrl || !c.attributes.pages) continue
      all.push({
        id: c.id,
        chapter: c.attributes.chapter,
        volume: c.attributes.volume,
        title: c.attributes.title,
        lang: c.attributes.translatedLanguage,
        pages: c.attributes.pages,
        group: (c.relationships.find((r) => r.type === 'scanlation_group')?.attributes?.name as string | undefined) ?? null,
        publishedAt: c.attributes.publishAt,
      })
    }
    if (offset + 500 >= data.total) break
  }
  // One entry per chapter number, keeping the first upload.
  const seen = new Set<string>()
  return all.filter((c) => {
    const key = c.chapter ?? c.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** For licensed series with no hosted chapters: the official publisher page, if MangaDex lists one. */
export async function getOfficialLink(id: string): Promise<{ url: string; host: string } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const p = new URLSearchParams()
  p.set('limit', '20')
  for (const r of RATINGS) p.append('contentRating[]', r)
  const data = await md<{ data: RawChapter[] }>(`/manga/${id}/feed`, p, 3600)
  const raw = data?.data.find((c) => c.attributes.externalUrl)?.attributes.externalUrl
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:') return null
    return { url: u.toString(), host: u.hostname.replace(/^www\./, '') }
  } catch {
    return null
  }
}

export async function getChapterPages(chapterId: string, quality: 'data' | 'data-saver' = 'data-saver') {
  if (!/^[0-9a-f-]{36}$/i.test(chapterId)) return null
  const [server, meta] = await Promise.all([
    md<{ baseUrl: string; chapter: { hash: string; data: string[]; dataSaver: string[] } }>(`/at-home/server/${chapterId}`, new URLSearchParams(), 300),
    md<{ data: RawChapter }>(`/chapter/${chapterId}`, new URLSearchParams([['includes[]', 'manga']]), 3600),
  ])
  if (!server?.chapter || !meta?.data) return null
  const files = quality === 'data' ? server.chapter.data : server.chapter.dataSaver
  const mangaId = meta.data.relationships.find((r) => r.type === 'manga')?.id ?? null
  return {
    mangaId,
    chapter: meta.data.attributes.chapter,
    title: meta.data.attributes.title,
    lang: meta.data.attributes.translatedLanguage,
    pages: files.map((f) => mangaImg(`${server.baseUrl}/${quality}/${server.chapter.hash}/${f}`)),
  }
}

export const STATUS_TR: Record<MangaStatus, string> = { ongoing: 'Devam ediyor', completed: 'Tamamlandı', hiatus: 'Ara verdi', cancelled: 'İptal' }
export const DEMO_TR: Record<string, string> = { shounen: 'Shōnen', shoujo: 'Shōjo', seinen: 'Seinen', josei: 'Josei' }
