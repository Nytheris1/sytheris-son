import 'server-only'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const ORIGIN = 'https://www.xnxx.com'

export type PornSource = { label: string; url: string }
export type PornVideo = { id: string; slug: string; title: string; thumb: string; duration: number }

const HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr,en;q=0.9',
  Referer: ORIGIN + '/',
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&lowbar;': '_',
  '&nbsp;': ' ',
}

function decode(text: string) {
  return text
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function seconds(text: string) {
  let total = 0
  const h = text.match(/(\d+)\s*h/i)
  const m = text.match(/(\d+)\s*min/i)
  const s = text.match(/(\d+)\s*s(ec)?/i)
  if (h) total += Number(h[1]) * 3600
  if (m) total += Number(m[1]) * 60
  if (s) total += Number(s[1])
  return total
}

/** Result blocks are thumb-block divs; links, posters and durations all live inside them. */
function parse(html: string): PornVideo[] {
  const out: PornVideo[] = []
  let chunks = html.split('thumb-block')
  if (chunks.length < 2) chunks = html.split('thumb-link')
  for (const chunk of chunks.slice(1)) {
    const link = chunk.match(/href="\/video-([a-z0-9]+)\/[^"]*"/i)
    if (!link) continue
    const img = chunk.match(/<img[^>]+src="([^"]+)"/i)
    const label = chunk.match(/title="([^"]+)"/i)
    const dur = chunk.match(/class="duration"[^>]*>([^<]+)</i)
    const slug = (chunk.match(/href="\/video-[a-z0-9]+\/([^"]*)"/i) || [])[1] || ''
    const durText = (chunk.match(/\d+\s*h\s*\d+\s*min|\d+\s*min|\d+\s*s(?:ec)?/i) || [])[0] || ''
    out.push({
      id: link[1],
      slug,
      title: decode(label ? label[1] : slug.replace(/_/g, ' ')) || link[1],
      thumb: img ? img[1] : '',
      duration: seconds(durText),
    })
  }
  return out
}

function clean(title: string) {
  return decode(title)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90)
}

/** Monthly best archive is the only listing that really paginates; /best/2 repeats page one. */
function monthKey(back = 0) {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() - back)
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0')
}

async function fetchList(url: string) {
  const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('xnxx ' + res.status)
  return parse(await res.text())
}

export async function searchPorn(q: string, page = 1) {
  const p = Math.max(1, page)
  if (q) {
    const items = await fetchList(ORIGIN + '/search/' + encodeURIComponent(clean(q)) + '/' + p)
    return { items, hasNext: items.length >= 10 }
  }
  let items = await fetchList(ORIGIN + '/best/' + monthKey(0) + '/' + p)
  if (!items.length) items = await fetchList(ORIGIN + '/best/' + monthKey(1) + '/' + p)
  return { items, hasNext: items.length >= 20 }
}

export function pageUrl(id: string, slug = '') {
  return ORIGIN + '/video-' + id + (slug ? '/' + slug : '')
}

export function embedUrl(id: string) {
  return ORIGIN + '/embedframe/' + id
}

/** Stream URLs sit in the page as html5player.setVideoUrlHigh/Low/HLS calls. */
export async function resolveSources(id: string, slug = ''): Promise<PornSource[]> {
  if (!/^[a-z0-9]+$/i.test(id)) return []
  const res = await fetch(pageUrl(id, slug), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('sayfa ' + res.status)
  const body = await res.text()

  const pick = (fn: string) => {
    const m = body.match(new RegExp(fn + "\\('([^']+)'\\)"))
    return m ? m[1].replace(/\\\//g, '/') : ''
  }

  const out: PornSource[] = []
  const hls = pick('setVideoHLS')
  const high = pick('setVideoUrlHigh')
  const low = pick('setVideoUrlLow')
  if (hls) out.push({ label: 'hls', url: hls })
  if (high) out.push({ label: 'yuksek', url: high })
  if (low) out.push({ label: 'dusuk', url: low })
  return out
}

export async function resolveSourcesByTitle(title: string): Promise<PornSource[]> {
  const q = clean(title)
  if (!q) return []
  const res = await fetch(ORIGIN + '/search/' + encodeURIComponent(q), { headers: HEADERS, cache: 'no-store' })
  if (!res.ok) throw new Error('arama ' + res.status)
  const first = parse(await res.text())[0]
  return first ? resolveSources(first.id) : []
}