import 'server-only'
import { safeFetch } from '@/lib/safe-url'
import type { MediaKind } from '@/lib/media-vault'

/*
 * Finds the .m3u8 / .mp4 behind an episode page the way a player would: page → embedded players (iframes)
 * → inline and player scripts → packed (p,a,c,k,e,d) and base64-hidden sources → JSON/meta tags. Every
 * request goes through safeFetch (SSRF-guarded on every redirect hop) with hard size and time budgets.
 * It reads what the pages ship; sources that only appear after a site's own JavaScript runs a login,
 * captcha or DRM handshake cannot be read this way.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MAX_PAGES = 10
const MAX_DEPTH = 3
const MAX_SCRIPTS = 6
const MAX_BYTES = 2_500_000
const TOTAL_BUDGET_MS = 45_000
const PROBE_LIMIT = 12

const NOISE_HOSTS = /(google|doubleclick|googlesyndication|facebook|twitter|x\.com|disqus|youtube\.com\/(?!embed)|cloudflareinsights|recaptcha|hcaptcha|gstatic|adservice|analytics|histats|yandex)/i

export type HuntVia = 'doğrudan' | 'html' | 'meta' | 'betik' | 'paketli betik' | 'base64' | 'iframe'

export type HuntCandidate = {
  url: string
  kind: MediaKind
  referer: string
  foundOn: string
  via: HuntVia
  quality: string | null
  probe: { ok: boolean; status: number; contentType: string; bytes: number | null; variants: number; note: string } | null
}

export type HuntPage = { url: string; depth: number; status: number; note: string }

export type HuntResult =
  | { ok: true; pageUrl: string; title: string | null; pages: HuntPage[]; candidates: HuntCandidate[]; tookMs: number }
  | { ok: false; error: string; pages?: HuntPage[] }

type Fetched = { text: string; finalUrl: string; status: number; contentType: string }

async function fetchText(url: string, referer: string | null, deadline: number, accept = 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'): Promise<Fetched | { error: string; status: number }> {
  const remaining = deadline - Date.now()
  if (remaining < 1500) return { error: 'Süre doldu', status: 0 }
  try {
    const headers: Record<string, string> = { 'User-Agent': UA, Accept: accept, 'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8' }
    if (referer) headers.Referer = referer
    const res = await safeFetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(Math.min(14_000, remaining)) }, 5)
    if (!res) return { error: 'Güvenlik nedeniyle engellendi (özel ağ / geçersiz adres)', status: 0 }
    const contentType = res.headers.get('content-type') ?? ''
    if (/^(video|audio)\//i.test(contentType)) {
      res.body?.cancel().catch(() => {})
      return { text: '', finalUrl: res.url || url, status: res.status, contentType }
    }
    const reader = res.body?.getReader()
    if (!reader) return { text: '', finalUrl: res.url || url, status: res.status, contentType }
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      size += value.byteLength
      if (size > MAX_BYTES) {
        await reader.cancel().catch(() => {})
        break
      }
    }
    const text = new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks))
    return { text, finalUrl: res.url || url, status: res.status, contentType }
  } catch (e) {
    const msg = (e as Error).name === 'TimeoutError' ? 'Zaman aşımı' : 'Bağlantı kurulamadı'
    return { error: msg, status: 0 }
  }
}

function decodeEntities(text: string) {
  return text
    .replace(/\\u002[fF]/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003[dD]/g, '=')
    .replace(/\\x2[fF]/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;|&#47;/g, '/')
    .replace(/&quot;/g, '"')
}

/** Dean Edwards' p,a,c,k,e,d packer — still the most common way embed hosts hide their source list. */
function unpackAll(text: string): string[] {
  const out: string[] = []
  const re = /}\s*\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\.split\('\|'\)/g
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = re.exec(text)) && guard++ < 8) {
    const payload = m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\')
    const radix = Number(m[2])
    const words = m[4].split('|')
    if (!radix || radix > 62) continue
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const decodeWord = (w: string) => {
      let n = 0
      for (const ch of w) {
        const v = alphabet.indexOf(ch)
        if (v < 0 || v >= radix) return -1
        n = n * radix + v
      }
      return n
    }
    out.push(
      payload.replace(/\b\w+\b/g, (w) => {
        const i = decodeWord(w)
        return i >= 0 && i < words.length && words[i] ? words[i] : w
      }),
    )
  }
  return out
}

function base64Blobs(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const patterns = [/atob\(\s*["'`]([A-Za-z0-9+/=_-]{16,})["'`]\s*\)/g, /["'`]([A-Za-z0-9+/]{48,}={0,2})["'`]/g]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    let n = 0
    while ((m = re.exec(text)) && n++ < 60) {
      if (seen.has(m[1])) continue
      seen.add(m[1])
      try {
        const decoded = Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
        if (/https?:|\.m3u8|\.mp4/i.test(decoded) && !/[\x00-\x08]/.test(decoded)) out.push(decoded)
      } catch {}
    }
  }
  return out
}

const ABS_MEDIA = /(?:https?:)?\/\/[^\s"'<>`\\(){}|^]+?\.(m3u8|mp4)(?:\?[^\s"'<>`\\(){}|^]*)?/gi
const REL_MEDIA = /["'`](\/?[A-Za-z0-9._~%!$&+,;=:@/-]+?\.(m3u8|mp4)(?:\?[^\s"'`<>]*)?)["'`]/gi

function resolve(raw: string, base: string) {
  try {
    const u = new URL(raw.startsWith('//') ? `https:${raw}` : raw, base)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

function mediaIn(text: string, base: string) {
  const found = new Map<string, MediaKind>()
  for (const re of [ABS_MEDIA, REL_MEDIA]) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    let n = 0
    while ((m = re.exec(text)) && n++ < 400) {
      const raw = re === REL_MEDIA ? m[1] : m[0]
      const url = resolve(raw, base)
      if (!url || NOISE_HOSTS.test(new URL(url).hostname)) continue
      found.set(url, m[re === REL_MEDIA ? 2 : 1].toLowerCase() === 'm3u8' ? 'hls' : 'mp4')
    }
  }
  return found
}

function metaMedia(html: string, base: string) {
  const found = new Map<string, MediaKind>()
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:video(?::secure_url|:url)?|twitter:player:stream)["'][^>]*content=["']([^"']+)["']/gi,
    /<(?:source|video)[^>]+src=["']([^"']+)["']/gi,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      const url = resolve(m[1], base)
      if (!url) continue
      if (/\.m3u8(\?|$)/i.test(url)) found.set(url, 'hls')
      else if (/\.mp4(\?|$)/i.test(url) || /type=["']video\/mp4/i.test(m[0])) found.set(url, 'mp4')
    }
  }
  return found
}

function framesIn(html: string, base: string) {
  const out = new Set<string>()
  const patterns = [
    /<iframe[^>]+?(?:data-src|data-lazy-src|src)=["']([^"']+)["']/gi,
    /["'](?:embed_?url|embedUrl|iframe_?src|player_?url|video_?url|link)["']\s*:\s*["']([^"']+)["']/gi,
    /data-(?:video|embed|player|src|url)=["'](https?:\/\/[^"']+|\/\/[^"']+)["']/gi,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) && out.size < 12) {
      const url = resolve(decodeEntities(m[1]), base)
      if (!url || NOISE_HOSTS.test(url) || /\.(m3u8|mp4|jpe?g|png|webp|gif|css|js)(\?|$)/i.test(url) || url === base) continue
      out.add(url)
    }
  }
  return [...out]
}

function playerScripts(html: string, base: string) {
  const out: string[] = []
  const re = /<script[^>]+src=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  const baseHost = new URL(base).hostname
  while ((m = re.exec(html)) && out.length < MAX_SCRIPTS) {
    const url = resolve(m[1], base)
    if (!url) continue
    const u = new URL(url)
    const sameSite = u.hostname === baseHost || u.hostname.endsWith(`.${baseHost.split('.').slice(-2).join('.')}`)
    if (sameSite && /player|embed|video|source|stream|config|watch|episode|main|app/i.test(u.pathname) && !/jquery|bootstrap|analytics|gtag|ads/i.test(u.pathname)) out.push(url)
  }
  return out
}

function titleOf(html: string) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
  const title = og ?? html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1]
  return title ? decodeEntities(title).trim().slice(0, 160) : null
}

function qualityOf(url: string) {
  const m = url.match(/(?:^|[^0-9])(2160|1440|1080|720|576|480|360|240)p?(?:[^0-9]|$)/)
  return m ? `${m[1]}p` : null
}

async function probe(c: HuntCandidate): Promise<HuntCandidate['probe']> {
  const headers: Record<string, string> = { 'User-Agent': UA, Accept: '*/*', Referer: c.referer, Origin: new URL(c.referer).origin }
  if (c.kind === 'mp4') headers.Range = 'bytes=0-2047'
  try {
    const res = await safeFetch(c.url, { headers, cache: 'no-store', signal: AbortSignal.timeout(9000) })
    if (!res) return { ok: false, status: 0, contentType: '', bytes: null, variants: 0, note: 'Engellendi' }
    const contentType = res.headers.get('content-type') ?? ''
    if (c.kind === 'hls') {
      const text = res.ok ? (await res.text()).slice(0, 300_000) : ''
      const ok = text.trimStart().startsWith('#EXTM3U')
      const variants = (text.match(/#EXT-X-STREAM-INF/g) ?? []).length
      const heights = [...text.matchAll(/RESOLUTION=\d+x(\d+)/g)].map((m) => Number(m[1]))
      if (heights.length) c.quality = `${Math.max(...heights)}p`
      const segments = (text.match(/#EXTINF/g) ?? []).length
      return { ok, status: res.status, contentType, bytes: null, variants, note: ok ? (variants ? `${variants} kalite seçeneği` : `${segments} parça`) : `Yanıt ${res.status}` }
    }
    res.body?.cancel().catch(() => {})
    const total = Number(res.headers.get('content-range')?.split('/')[1]) || Number(res.headers.get('content-length')) || null
    const ok = (res.status === 200 || res.status === 206) && (/^video\//i.test(contentType) || contentType.includes('octet-stream') || contentType === '')
    return { ok, status: res.status, contentType, bytes: total, variants: 0, note: ok ? 'Oynatılabilir' : `Yanıt ${res.status}` }
  } catch (e) {
    return { ok: false, status: 0, contentType: '', bytes: null, variants: 0, note: (e as Error).name === 'TimeoutError' ? 'Zaman aşımı' : 'Ulaşılamadı' }
  }
}

export async function huntMedia(pageUrl: string): Promise<HuntResult> {
  const started = Date.now()
  const deadline = started + TOTAL_BUDGET_MS
  const pages: HuntPage[] = []
  const candidates = new Map<string, HuntCandidate>()
  const visited = new Set<string>()
  const queue: { url: string; depth: number; referer: string | null }[] = [{ url: pageUrl, depth: 0, referer: null }]
  let title: string | null = null

  const add = (found: Map<string, MediaKind>, foundOn: string, via: HuntVia) => {
    for (const [url, kind] of found) {
      if (!candidates.has(url)) candidates.set(url, { url, kind, referer: foundOn, foundOn, via, quality: qualityOf(url), probe: null })
    }
  }

  while (queue.length && pages.length < MAX_PAGES && Date.now() < deadline - 3000) {
    const next = queue.shift()!
    if (visited.has(next.url)) continue
    visited.add(next.url)

    const res = await fetchText(next.url, next.referer, deadline)
    if ('error' in res) {
      pages.push({ url: next.url, depth: next.depth, status: res.status, note: res.error })
      continue
    }
    const base = res.finalUrl
    const body = res.text

    if (/^(video|audio)\//i.test(res.contentType) || body.trimStart().startsWith('#EXTM3U')) {
      const kind: MediaKind = body.trimStart().startsWith('#EXTM3U') || res.contentType.includes('mpegurl') ? 'hls' : 'mp4'
      candidates.set(base, { url: base, kind, referer: next.referer ?? new URL(base).origin + '/', foundOn: next.referer ?? base, via: 'doğrudan', quality: qualityOf(base), probe: null })
      pages.push({ url: base, depth: next.depth, status: res.status, note: 'Doğrudan medya bağlantısı' })
      continue
    }

    if (next.depth === 0) title = titleOf(body)
    const before = candidates.size
    const clean = decodeEntities(body)
    add(metaMedia(body, base), base, 'meta')
    add(mediaIn(clean, base), base, next.depth > 0 ? 'iframe' : 'html')
    for (const unpacked of unpackAll(body)) add(mediaIn(decodeEntities(unpacked), base), base, 'paketli betik')
    for (const decoded of base64Blobs(clean)) add(mediaIn(decodeEntities(decoded), base), base, 'base64')

    if (candidates.size === before) {
      for (const scriptUrl of playerScripts(body, base)) {
        if (visited.has(scriptUrl) || Date.now() > deadline - 4000) continue
        visited.add(scriptUrl)
        const script = await fetchText(scriptUrl, base, deadline, '*/*')
        if ('error' in script) continue
        const js = decodeEntities(script.text)
        add(mediaIn(js, base), base, 'betik')
        for (const unpacked of unpackAll(script.text)) add(mediaIn(decodeEntities(unpacked), base), base, 'paketli betik')
      }
    }

    const found = candidates.size - before
    const frames = next.depth < MAX_DEPTH ? framesIn(body, base) : []
    for (const f of frames) if (!visited.has(f)) queue.push({ url: f, depth: next.depth + 1, referer: base })
    pages.push({ url: base, depth: next.depth, status: res.status, note: [found ? `${found} kaynak` : 'kaynak yok', frames.length ? `${frames.length} gömülü oynatıcı` : ''].filter(Boolean).join(' · ') })
  }

  if (pages.length && pages.every((p) => p.status === 0)) return { ok: false, error: pages[0].note, pages }

  const list = [...candidates.values()].slice(0, 40)
  await Promise.all(
    list.slice(0, PROBE_LIMIT).map(async (c) => {
      c.probe = await probe(c)
    }),
  )

  const rank = (q: string | null) => (q ? Number.parseInt(q, 10) : 0)
  list.sort((a, b) => Number(Boolean(b.probe?.ok)) - Number(Boolean(a.probe?.ok)) || (a.kind === b.kind ? 0 : a.kind === 'hls' ? -1 : 1) || rank(b.quality) - rank(a.quality))

  return { ok: true, pageUrl, title, pages, candidates: list, tookMs: Date.now() - started }
}
