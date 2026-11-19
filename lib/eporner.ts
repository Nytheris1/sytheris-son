import 'server-only'

const API = 'https://www.eporner.com/api/v2/video/search/'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const REFERER = 'https://www.eporner.com/'
const WORKER = (process.env.HANIME_WORKER_URL || '').trim().replace(/\/+$/, '')

/** Eporner serves a stub page to datacenter IPs, so page and xhr calls go out through the Cloudflare Worker. */
function viaWorker(target: string) {
  return WORKER ? WORKER + '/proxy?u=' + Buffer.from(target, 'utf8').toString('base64url') : target
}

export type PornVideo = { id: string; title: string; thumb: string; duration: number; views: number }
export type PornSource = { label: string; url: string }

type Raw = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/** default_thumb is an object ({ size, width, height, src }); thumbs is an array of the same shape. */
function thumbOf(raw: Raw): string {
  const direct = raw.default_thumb
  if (direct && typeof direct === 'object') {
    const s = (direct as Raw).src
    if (typeof s === 'string' && s) return s
  }
  if (typeof direct === 'string' && direct) return direct
  const list = raw.thumbs
  if (Array.isArray(list)) {
    for (const t of list) {
      const s = t && typeof t === 'object' ? (t as Raw).src : null
      if (typeof s === 'string' && s) return s
    }
  }
  return ''
}

function normalize(raw: Raw): PornVideo | null {
  const id = str(raw.id)
  if (!id) return null
  return {
    id,
    title: str(raw.title) || id,
    thumb: thumbOf(raw),
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

/**
 * Direct mp4/hls sources for the in-house player. The embed page carries a one-shot 32-hex hash that the
 * xhr endpoint requires; without it the JSON comes back empty. Quality keys look like "1080p".
 */
export async function resolveSources(id: string): Promise<PornSource[]> {
  if (!/^[A-Za-z0-9]+$/.test(id)) return []
  const embed = embedUrl(id)
  const tries = [embed, 'https://www.eporner.com/video-' + id + '/']
  const report: string[] = []
  let hash = ''
  let html = ''

  for (const target of tries) {
    const res = await fetch(viaWorker(target), {
      headers: { 'User-Agent': UA, Referer: REFERER, Accept: 'text/html,application/xhtml+xml' },
      cache: 'no-store',
    })
    const body = await res.text()
    const found = (body.match(/hash[^0-9a-f]{0,14}([0-9a-f]{32})/) || [])[1] || ''
    report.push(target.replace('https://www.eporner.com', '') + '=' + res.status + '/' + body.length + '/' + (found ? 'HASH' : 'yok'))
    if (found) {
      hash = found
      html = body
      break
    }
    if (!html) html = body
  }

  if (!hash) {
    const probe = async (label: string, target: string) => {
      try {
        const r = await fetch(viaWorker(target), {
          headers: { 'User-Agent': UA, Referer: REFERER, Origin: 'https://www.eporner.com', Accept: 'application/json' },
          cache: 'no-store',
        })
        const b = await r.text()
        const h = (b.match(/[0-9a-f]{32}/) || [])[0] || ''
        return label + '=' + r.status + '/' + b.length + '/' + (h ? 'HEX:' + h.slice(0, 8) : 'yok')
      } catch (e) {
        return label + '=hata'
      }
    }
    const probes = await Promise.all([
      probe('nohash', 'https://www.eporner.com/xhr/video/' + id + '?domain=www.eporner.com&fallback=false&embed=true&supported=true'),
      probe('apidetail', 'https://www.eporner.com/api/v2/video/id/?id=' + id + '&format=json'),
    ])
    throw new Error('hash yok | ' + report.join(' ') + ' | ' + probes.join(' '))
  }

  const q = new URLSearchParams({
    hash,
    device: 'generic',
    domain: 'www.eporner.com',
    fallback: 'false',
    embed: 'true',
    supported: 'true',
  })
  const res = await fetch(viaWorker('https://www.eporner.com/xhr/video/' + id + '?' + q.toString()), {
    headers: { 'User-Agent': UA, Referer: embed, Origin: 'https://www.eporner.com', Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('xhr ' + res.status)
  const json = (await res.json()) as { sources?: Record<string, Record<string, { src?: string }>> }

  const out: PornSource[] = []
  for (const group of ['mp4', 'hls']) {
    const bucket = json.sources?.[group]
    if (!bucket) continue
    for (const [label, v] of Object.entries(bucket)) {
      const src = v && typeof v.src === 'string' ? v.src : ''
      if (src) out.push({ label: group === 'hls' ? 'hls' : label, url: src })
    }
  }
  out.sort((a, b) => (parseInt(b.label) || 0) - (parseInt(a.label) || 0))
  return out
}