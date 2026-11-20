import 'server-only'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type Src = 'ph' | 'xv'
export type PornItem = { id: string; src: Src; title: string; thumb: string; duration: number; path: string }
export type PornSourceLink = { label: string; url: string }

export const SOURCES: { id: Src; label: string; home: string }[] = [
  { id: 'ph', label: 'Pornhub', home: 'https://www.pornhub.com/' },
  { id: 'xv', label: 'XVideos', home: 'https://www.xvideos.com/' },
]

const REFERER: Record<Src, string> = { ph: 'https://www.pornhub.com/', xv: 'https://www.xvideos.com/' }

const headers = (src: Src) => ({
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'tr,en;q=0.9',
  Referer: REFERER[src],
})

const ENT: Record<string, string> = { '&amp;': '&', '&quot;': '"', '&#039;': "'", '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' }
const decode = (t: string) => t.replace(/&[a-z#0-9]+;/gi, (m) => ENT[m.toLowerCase()] ?? ' ').replace(/\s+/g, ' ').trim()

const secs = (t: string) => {
  let total = 0
  const h = t.match(/(\d+)\s*h/i)
  const m = t.match(/(\d+)\s*min/i)
  const s = t.match(/(\d+)\s*s(?:ec)?/i)
  if (h) total += Number(h[1]) * 3600
  if (m) total += Number(m[1]) * 60
  if (s) total += Number(s[1])
  return total
}

const clean = (q: string) => decode(q).replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 90)

function parsePh(html: string): PornItem[] {
  const out: PornItem[] = []
  for (const chunk of html.split('pcVideoListItem').slice(1)) {
    const key = (chunk.match(/viewkey=([a-z0-9]+)/i) || [])[1]
    if (!key) continue
    const img = (chunk.match(/data-src="([^"]+)"/i) || chunk.match(/src="(https:\/\/[^"]+\.(?:jpg|jpeg|webp)[^"]*)"/i) || [])[1] || ''
    const dur = (chunk.match(/class="duration"[^>]*>([^<]+)</i) || [])[1] || ''
    const label = (chunk.match(/title="([^"]+)"/i) || [])[1] || ''
    out.push({ id: 'ph-' + key, src: 'ph', title: decode(label) || key, thumb: img, duration: secs(dur), path: '/view_video.php?viewkey=' + key })
  }
  return out
}

function parseXv(html: string): PornItem[] {
  const out: PornItem[] = []
  for (const chunk of html.split('class="thumb"').slice(1)) {
    const path = (chunk.match(/href="(\/video\.[^"]+)"/i) || [])[1]
    if (!path) continue
    const img = (chunk.match(/data-src="([^"]+)"/i) || [])[1] || ''
    const dur = (chunk.match(/class="duration"[^>]*>([^<]+)</i) || [])[1] || ''
    const label = (chunk.match(/title="([^"]+)"/i) || [])[1] || path.split('/').pop() || ''
    out.push({ id: 'xv-' + path.split('/')[1].replace(/^video\./, ''), src: 'xv', title: decode(label), thumb: img, duration: secs(dur), path })
  }
  return out
}

const PARSERS: Record<Src, (html: string) => PornItem[]> = { ph: parsePh, xv: parseXv }

const searchUrl = (src: Src, q: string, page: number) =>
  src === 'ph'
    ? 'https://www.pornhub.com/video/search?search=' + encodeURIComponent(q) + (page > 1 ? '&page=' + page : '')
    : 'https://www.xvideos.com/?k=' + encodeURIComponent(q) + (page > 1 ? '&p=' + page : '')

const browseUrl = (src: Src, page: number) =>
  src === 'ph'
    ? 'https://www.pornhub.com/video?o=tr' + (page > 1 ? '&page=' + page : '')
    : 'https://www.xvideos.com/best/' + page
async function fromSource(src: Src, q: string, page: number): Promise<PornItem[]> {
  const url = q ? searchUrl(src, clean(q), page) : browseUrl(src, page)
  try {
    const res = await fetch(url, { headers: headers(src), cache: 'no-store' })
    if (!res.ok) return []
    const html = await res.text()
    return PARSERS[src](html).filter((i) => i.thumb && i.title)
  } catch {
    return []
  }
}

/** Round-robin merge so a page mixes every source instead of front-loading one. */
export async function searchPorn(q: string, page = 1) {
  const lists = await Promise.all(SOURCES.map((s) => fromSource(s.id, q, page)))
  const out: PornItem[] = []
  const longest = Math.max(...lists.map((l) => l.length), 0)
  for (let i = 0; i < longest; i++) for (const list of lists) if (list[i]) out.push(list[i])
  return { items: out, hasNext: out.length >= 20 }
}

export function pageUrl(src: Src, path: string) {
  return REFERER[src].replace(/\/$/, '') + path
}

export function refererOf(src: Src) {
  return REFERER[src]
}

export async function resolveSources(src: Src, path: string): Promise<PornSourceLink[]> {
  const url = pageUrl(src, path)
  const res = await fetch(url, { headers: headers(src), cache: 'no-store' })
  if (!res.ok) throw new Error('sayfa ' + res.status)
  const body = await res.text()
  const out: PornSourceLink[] = []

  const push = (label: string, raw: string) => {
    const u = raw.replace(/\\\//g, '/')
    if (u.startsWith('http') && !out.some((o) => o.url === u)) out.push({ label, url: u })
  }

  /** Pornhub serves signed get_media JSON endpoints; the real mp4 list is inside that reply. */
  const followPh = async (endpoint: string) => {
    try {
      const r = await fetch(endpoint, { headers: { ...headers('ph'), Accept: 'application/json' }, cache: 'no-store' })
      if (!r.ok) return
      const text = await r.text()
      for (const m of text.matchAll(/"videoUrl"\s*:\s*"([^"]+)"/g)) {
        const block = text.slice(Math.max(0, m.index - 220), (m.index || 0) + 40)
        const height = (block.match(/"height"\s*:\s*(\d+)/) || [])[1] || ''
        push(height ? height + 'p' : 'mp4', m[1])
      }
      for (const m of text.matchAll(/https:\/\/[^"'\s]+\.mp4[^"'\s]*/g)) push('mp4', m[0])
    } catch {
      /* get_media acilmadi */
    }
  }

  if (src === 'ph') {
    const pending: string[] = []
    for (const m of body.matchAll(/\{[^{}]*?"videoUrl"\s*:\s*"([^"]+)"[^{}]*?\}/g)) {
      const block = m[0]
      const fmt = (block.match(/"format"\s*:\s*"(\w+)"/) || [])[1] || ''
      const height = (block.match(/"height"\s*:\s*(\d+)/) || [])[1] || ''
      const u = m[1].replace(/\\\//g, '/')
      if (u.includes('/get_media')) pending.push(u)
      else if (fmt === 'hls') push('hls', u)
      else if (height) push(height + 'p', u)
      else push('mp4', u)
    }
    for (const endpoint of pending.slice(0, 2)) await followPh(endpoint)
    if (!out.length) {
      for (const m of body.matchAll(/https:\/\/[^"'\s]+\.mp4[^"'\s]*/g)) push('mp4', m[0])
    }
  } else if (src === 'xv') {
    const pick = (fn: string) => (body.match(new RegExp(fn + "\\('([^']+)'\\)")) || [])[1] || ''
    const hls = pick('setVideoHLS')
    const high = pick('setVideoUrlHigh')
    const low = pick('setVideoUrlLow')
    if (hls) push('hls', hls)
    if (high) push('yuksek', high)
    if (low) push('dusuk', low)
  } else {
    for (const m of body.matchAll(/<source[^>]+src="([^"]+\.mp4[^"]*)"/gi)) push('mp4', m[1])
    for (const m of body.matchAll(/https:\/\/[^"'\s]+\.mp4[^"'\s]*/g)) push('mp4', m[0])

    if (!out.length) {
      const frame = (body.match(/<iframe[^>]+src="([^"]+)"/i) || [])[1] || ''
      if (frame) {
        const inner = frame.startsWith('http') ? frame : pageUrl(src, frame)
        try {
          const sub = await fetch(inner, { headers: headers(src), cache: 'no-store' })
          if (sub.ok) {
            const text = await sub.text()
            for (const m of text.matchAll(/https:\/\/[^"'\s]+\.mp4[^"'\s]*/g)) push('mp4', m[0])
          }
        } catch {
          /* iframe acilmadi */
        }
      }
    }
  }

  return out
}