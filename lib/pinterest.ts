import 'server-only'

/*
 * Resolves a Pinterest pin link (pinterest.com/pin/…, tr.pinterest.com/pin/…, pin.it/…) to its real media:
 * an MP4 when the pin is a video, otherwise the largest image. Only Pinterest hosts are ever fetched.
 */

export type PinMedia = { kind: 'video' | 'image'; url: string; title: string; pinUrl: string }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const PIN_HOST = /(^|\.)pinterest\.[a-z.]{2,8}$/i
const MEDIA_HOST = /(^|\.)pinimg\.com$/i

export function isPinterestUrl(raw: string) {
  try {
    const u = new URL(raw.trim())
    return u.protocol === 'https:' && (u.hostname === 'pin.it' || PIN_HOST.test(u.hostname))
  } catch {
    return false
  }
}

export function isPinMediaUrl(raw: string) {
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' && MEDIA_HOST.test(u.hostname)
  } catch {
    return false
  }
}

function pinIdFrom(text: string) {
  return text.match(/\/pin\/(?:[^/?#]*--)?(\d{6,25})/)?.[1] ?? null
}

async function expandShortLink(url: string) {
  let current = url
  for (let i = 0; i < 5; i++) {
    const res = await fetch(current, { redirect: 'manual', headers: { 'User-Agent': UA }, cache: 'no-store' })
    const loc = res.headers.get('location')
    if (!loc) {
      const html = res.ok ? await res.text() : ''
      return pinIdFrom(current) ?? pinIdFrom(html)
    }
    const next = new URL(loc, current)
    if (next.protocol !== 'https:' || !(next.hostname === 'pin.it' || PIN_HOST.test(next.hostname))) return pinIdFrom(next.href)
    const id = pinIdFrom(next.href)
    if (id) return id
    current = next.href
  }
  return null
}

type VideoList = Record<string, { url?: string; width?: number }>
type ImageSet = Record<string, { url: string; width?: number }>
type StoryBlock = { video?: { video_list?: VideoList } | null; image?: { images?: ImageSet } | null }
type PidgetPin = {
  id: string
  error?: string
  description?: string
  title?: string
  images?: ImageSet
  videos?: { video_list?: VideoList } | null
  story_pin_data?: { pages?: (StoryBlock & { blocks?: StoryBlock[] })[] } | null
}

function decode(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** Prefers a direct MP4; HLS-only pins usually have the same video at /720p/…mp4. */
function bestMp4(list?: VideoList | null) {
  if (!list) return null
  const urls = Object.values(list)
    .map((v) => v.url)
    .filter((u): u is string => Boolean(u && isPinMediaUrl(u)))
  const mp4 = urls.find((u) => /720p.*\.mp4(\?|$)/.test(u)) ?? urls.find((u) => /\.mp4(\?|$)/.test(u))
  if (mp4) return mp4
  const hls = urls.find((u) => /\/hls\/.+\.m3u8/.test(u))
  return hls ? hls.replace(/\/hls\//, '/720p/').replace(/\.m3u8.*$/, '.mp4') : null
}

function bestImage(set?: ImageSet | null) {
  if (!set) return null
  const url = set.orig?.url ?? set.originals?.url ?? set['736x']?.url ?? set['564x']?.url ?? Object.values(set).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url
  return url && isPinMediaUrl(url) ? url.replace(/\/(236x|237x|474x|564x|736x)\//, '/originals/') : null
}

async function fromPidgets(id: string): Promise<Omit<PinMedia, 'pinUrl'> | null> {
  const res = await fetch(`https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${id}`, { headers: { 'User-Agent': UA }, cache: 'no-store' })
  if (!res.ok) return null
  const pin = ((await res.json()) as { data?: PidgetPin[] }).data?.[0]
  if (!pin || pin.error) return null
  const title = decode(pin.title?.trim() || pin.description?.trim() || `Pinterest pini ${id}`).slice(0, 100)
  const pages = pin.story_pin_data?.pages ?? []
  const parts: StoryBlock[] = pages.flatMap((p) => [p, ...(p.blocks ?? [])])
  const video = bestMp4(pin.videos?.video_list) ?? parts.map((b) => bestMp4(b.video?.video_list)).find(Boolean) ?? null
  if (video) return { kind: 'video', url: video, title }
  const img = bestImage(pin.images) ?? parts.map((b) => bestImage(b.image?.images)).find(Boolean) ?? null
  if (img) return { kind: 'image', url: img, title }
  return null
}

async function fromPage(id: string): Promise<Omit<PinMedia, 'pinUrl'> | null> {
  const res = await fetch(`https://www.pinterest.com/pin/${id}/`, { headers: { 'User-Agent': UA, 'Accept-Language': 'tr,en;q=0.8' }, cache: 'no-store' })
  if (!res.ok) return null
  const html = await res.text()
  const title = decode(html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1] ?? html.match(/content="([^"]+)"[^>]+property="og:title"/)?.[1] ?? `Pin ${id}`).slice(0, 100)
  const mp4s = [...html.matchAll(/https:\\?\/\\?\/v1\.pinimg\.com\\?\/videos\\?\/[^"'\s]+?\.mp4/g)].map((m) => m[0].replace(/\\\//g, '/'))
  const video = mp4s.find((u) => /720/.test(u)) ?? mp4s[0]
  if (video) return { kind: 'video', url: video, title }
  const og = html.match(/content="(https:\/\/i\.pinimg\.com\/[^"]+)"[^>]*property="og:image"/)?.[1] ?? html.match(/property="og:image"[^>]*content="(https:\/\/i\.pinimg\.com\/[^"]+)"/)?.[1]
  if (og) return { kind: 'image', url: og.replace(/\/(236x|474x|564x|736x)\//, '/originals/'), title }
  return null
}

export async function resolvePin(raw: string): Promise<PinMedia> {
  const url = raw.trim()
  if (!isPinterestUrl(url)) throw new Error('Bu bir Pinterest bağlantısı değil.')
  const host = new URL(url).hostname
  const id = host === 'pin.it' ? await expandShortLink(url) : pinIdFrom(url)
  if (!id) throw new Error('Pin bulunamadı. Bağlantının bir pine ait olduğundan emin ol.')
  const pinUrl = `https://www.pinterest.com/pin/${id}/`
  const media = (await fromPidgets(id).catch(() => null)) ?? (await fromPage(id).catch(() => null))
  if (!media) throw new Error('Pindeki görsel ya da video okunamadı. Pin gizli ya da silinmiş olabilir.')
  return { ...media, pinUrl }
}

/** Downloads a resolved pinimg.com media URL, falling back from /originals/ to /736x/ when the original is missing. */
export async function downloadPinMedia(media: PinMedia, maxBytes: number) {
  const candidates = media.kind === 'image' && media.url.includes('/originals/') ? [media.url, media.url.replace('/originals/', '/736x/')] : [media.url]
  for (const candidate of candidates) {
    if (!isPinMediaUrl(candidate)) continue
    const res = await fetch(candidate, { headers: { 'User-Agent': UA, Referer: 'https://www.pinterest.com/' }, cache: 'no-store' })
    if (!res.ok) continue
    const declared = Number(res.headers.get('content-length') ?? 0)
    if (declared > maxBytes) throw new Error('Pindeki dosya çok büyük.')
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.byteLength > maxBytes) throw new Error('Pindeki dosya çok büyük.')
    const header = res.headers.get('content-type')?.split(';')[0] ?? ''
    const type = media.kind === 'video' ? 'video/mp4' : header.startsWith('image/') ? header : 'image/jpeg'
    return { bytes, type }
  }
  throw new Error('Pin medyası indirilemedi.')
}
