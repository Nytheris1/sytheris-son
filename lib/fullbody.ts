import 'server-only'
import { canCutOut } from '@/lib/cutout'

/**
 * Full-body character art.
 * AniList only ships square-ish portrait crops, so standing artwork is looked up on Safebooru
 * (general-rated only): first the character's tag is resolved from their name and series,
 * then the best-scored solo + full_body post is picked — transparent cut-outs first.
 */

const BASE = 'https://safebooru.org'
const WEEK = 604800
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; Sytheris/1.0; +https://sytheris.vercel.app)' }
const SAFE = 'rating:general -swimsuit -bikini -underwear -lingerie -nude -topless -topless_male -cosplay -comic -multiple_views -chibi'

/** `transparent` means the figure can stand on its own; `cutout` means the transparency is produced by our proxy. */
export type FullBody = { url: string; width: number; height: number; transparent: boolean; tag: string; cutout?: boolean; score?: number }

type Post = { file_url: string; sample_url?: string; width: number; height: number; score: number | null; tags: string }
type Suggestion = { label: string; value: string }

/** Romanisation-insensitive token: "Gojou" / "Gojo" / "Gojō" all become "gojo". */
function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ou/g, 'o')
    .replace(/uu/g, 'u')
    .replace(/oo/g, 'o')
    .replace(/[^a-z0-9]/g, '')
}

function tokens(s: string) {
  return s
    .split(/[^\p{L}\p{N}']+/u)
    .map(norm)
    .filter((t) => t.length > 1)
}

async function json<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: UA, next: { revalidate: WEEK } })
    if (!res.ok) return null
    const text = (await res.text()).trim()
    return text ? (JSON.parse(text) as T) : null
  } catch {
    return null
  }
}

/** Resolves the Safebooru tag for a character, preferring the one qualified with their series. */
export async function resolveCharacterTag(name: string, series: string[]): Promise<string | null> {
  const nameTokens = tokens(name)
  if (!nameTokens.length) return null
  const seriesTokens = new Set(series.flatMap(tokens))
  const queries = [...new Set(name.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 1))].slice(0, 2)

  const suggestions = (await Promise.all(queries.map((q) => json<Suggestion[]>(`${BASE}/autocomplete.php?q=${encodeURIComponent(q.replace(/[^\p{L}\p{N}]/gu, ''))}`)))).flatMap((s) => s ?? [])

  let best: { tag: string; score: number } | null = null
  const wanted = [...nameTokens].sort().join(' ')
  for (const s of suggestions) {
    const tag = s.value.replace(/&#039;/g, "'")
    const count = Number(/\((\d+)\)\s*$/.exec(s.label)?.[1] ?? 0)
    if (!count) continue
    const qualifier = /_\(([^)]+)\)$/.exec(tag)?.[1] ?? ''
    if (/cosplay/.test(qualifier)) continue
    const core = tokens(tag.replace(/_\([^)]*\)$/, ''))
    const exact = [...core].sort().join(' ') === wanted
    const qualifierTokens = tokens(qualifier)
    const seriesMatch = qualifierTokens.length > 0 && qualifierTokens.some((t) => seriesTokens.has(t))
    if (qualifierTokens.length > 0 && !seriesMatch) continue
    // "anya_(spy_x_family)" for "Anya Forger": a partial name is only trusted when the series qualifier confirms it.
    const partial = !exact && seriesMatch && core.length > 0 && core.every((t) => nameTokens.includes(t))
    if (!exact && !partial) continue
    const score = count * (seriesMatch ? 4 : 1) * (exact ? 2 : 1)
    if (!best || score > best.score) best = { tag, score }
  }
  return best?.tag ?? null
}

async function posts(tags: string) {
  const list = await json<Post[]>(`${BASE}/index.php?page=dapi&s=post&q=index&json=1&limit=40&tags=${encodeURIComponent(tags)}`)
  return (list ?? []).filter((p) => p.file_url && p.width > 0 && p.height > 0)
}

function toFullBody(p: Post, transparent: boolean, tag: string): FullBody {
  const usePng = transparent && /\.png$/i.test(p.file_url)
  return { url: usePng ? p.file_url : p.sample_url || p.file_url, width: p.width, height: p.height, transparent: usePng, tag, score: quality(p) }
}

/**
 * A standing full-body figure is naturally tall, so the tallest aspect ratios win; that filters out
 * chibi art, half-body crops and wide scenes far more reliably than the (often empty) score field.
 */
/** Effects, scenery and props that turn a clean standee into a busy action shot. */
const BUSY = ['fire', 'flame', 'flaming_sword', 'sparks', 'glowing_weapon', 'blood', 'injury', 'puddle', 'reflection', 'traditional_media', 'watercolor_(medium)', 'water', 'splashing', 'motion_lines', 'speed_lines', 'action', 'fighting_stance', 'attack', 'electricity', 'lightning', 'explosion', 'aura', 'smoke', 'magic_circle', 'petals', 'falling_petals', 'scenery', 'outdoors', 'sky', 'cloud', 'rock', 'midair', 'jumping', 'running', 'dynamic_pose', 'foreshortening']
/** Never usable as a single standee. */
const REJECT = ['dual_persona', 'multiple_persona', 'character_sheet', 'reference_sheet', 'multiple_views', 'comic', '2koma', '4koma', 'chibi', 'lineart', 'monochrome', 'greyscale', 'sketch', 'text_focus']

function busyness(p: Post) {
  const tags = new Set(p.tags.split(' '))
  return BUSY.reduce((s, t) => s + (tags.has(t) ? 1 : 0), 0)
}

function quality(p: Post) {
  const tags = new Set(p.tags.split(' '))
  const ratio = Math.min(p.height / p.width, 2.6)
  const busy = busyness(p)
  return (
    ratio +
    (p.height >= 1600 ? 0.5 : p.height >= 1100 ? 0.25 : 0) +
    (tags.has('official_art') ? 1.2 : 0) +
    (tags.has('standing') ? 0.6 : 0) +
    (tags.has('looking_at_viewer') ? 0.1 : 0) +
    (tags.has('white_background') || tags.has('simple_background') || tags.has('transparent_background') ? 0.35 : 0) +
    ((p.score ?? 0) > 0 ? 0.15 : 0) -
    busy * 0.45
  )
}

function usable(p: Post) {
  const tags = new Set(p.tags.split(' '))
  return !REJECT.some((t) => tags.has(t))
}

/** `strict` drops busy action shots entirely; only the very last fallback accepts them. */
function pickMany(list: Post[], transparent: boolean, tag: string, n: number, strict = true) {
  const ranked = list
    .filter((p) => p.height / p.width >= 1.15 && usable(p) && (!strict || busyness(p) < 2))
    .map((p) => ({ p, q: quality(p) }))
    .sort((a, b) => b.q - a.q)
    .map((x) => x.p)
  if (strict) return ranked.slice(0, n).map((p) => toFullBody(p, transparent, tag))
  const fallback = list.filter(usable)
  return (ranked.length ? ranked : fallback.length ? fallback : list).slice(0, n).map((p) => toFullBody(p, transparent, tag))
}

async function download(url: string) {
  try {
    const res = await fetch(url, { headers: UA, next: { revalidate: WEEK } })
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok || !type.startsWith('image/')) return null
    return { buf: Buffer.from(await res.arrayBuffer()), type }
  } catch {
    return null
  }
}

/** Plain-background art whose background can be removed on our side (see lib/cutout). */
async function pickCutouts(list: Post[], tag: string, n: number): Promise<FullBody[]> {
  const candidates = pickMany(list, false, tag, Math.min(6, n + 3))
  const checks = await Promise.all(
    candidates.map(async (c): Promise<FullBody | null> => {
      const file = await download(c.url)
      return file && canCutOut(file.buf, file.type) ? { ...c, transparent: true, cutout: true } : null
    }),
  )
  return checks.filter((c): c is FullBody => c !== null).slice(0, n)
}

/** Standing poses first: action shots with effects flying everywhere make poor standees. */
const PLAIN_BACKGROUNDS = ['white_background standing', 'simple_background standing', 'white_background', 'simple_background']

/**
 * Up to `n` different standing artworks of a character, best first:
 * native transparent cut-outs, then plain-background art cut out on the server, then any full-body art.
 * Grids that resolve one image per card pass `cutouts: false` to skip the download-and-check step.
 */
export async function getFullBodies(name: string, series: string[], n = 2, { cutouts = true } = {}): Promise<FullBody[]> {
  const tag = await resolveCharacterTag(name, series)
  if (!tag) return []
  const found: FullBody[] = []
  const add = (items: FullBody[]) => items.forEach((f) => found.length < n && !found.some((x) => x.url === f.url) && found.push(f))

  add(pickMany(await posts(`${tag} solo full_body transparent_background standing ${SAFE} sort:score:desc`), true, tag, n))
  if (found.length < n) add(pickMany(await posts(`${tag} solo full_body transparent_background ${SAFE} sort:score:desc`), true, tag, n - found.length))

  if (cutouts) {
    for (const bg of PLAIN_BACKGROUNDS) {
      if (found.length >= n) break
      const list = await posts(`${tag} solo full_body ${bg} -transparent_background ${SAFE} sort:score:desc`)
      if (list.length) add(await pickCutouts(list, tag, n - found.length))
    }
  }

  if (found.length < n) add(pickMany(await posts(`${tag} solo full_body ${SAFE} sort:score:desc`), false, tag, n - found.length, false))
  // Cleanest standee leads, whichever stage it came from — that is what makes every page read like Frieren's.
  return found.sort((a, b) => (b.transparent ? 1 : 0) - (a.transparent ? 1 : 0) || (b.score ?? 0) - (a.score ?? 0))
}

/** Best standing artwork for a character, or null when nothing suitable exists. */
export async function getFullBody(name: string, series: string[], options?: { cutouts?: boolean }): Promise<FullBody | null> {
  return (await getFullBodies(name, series, 1, options))[0] ?? null
}

/** A handful of extra solo artworks of the character for the hero's gallery. */
export async function getCharacterGallery(tag: string, exclude?: string, limit = 4): Promise<string[]> {
  const list = await posts(`${tag} solo ${SAFE} sort:score:desc`)
  return list
    .filter(usable)
    .map((p) => p.sample_url || p.file_url)
    .filter((u) => u && u !== exclude)
    .slice(0, limit)
}

export function isSafebooruUrl(raw: string) {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && (u.hostname === 'safebooru.org' || u.hostname.endsWith('.safebooru.org'))
  } catch {
    return false
  }
}

/** Same-origin URL for a Safebooru image (served through /api/fullbody/img), optionally with its background removed. */
export function proxied(url: string, cutout = false) {
  return `/api/fullbody/img?u=${encodeURIComponent(url)}${cutout ? '&cut=1' : ''}`
}

/** Same-origin URL for a resolved artwork. */
export function artSrc(f: FullBody) {
  return proxied(f.url, Boolean(f.cutout))
}
