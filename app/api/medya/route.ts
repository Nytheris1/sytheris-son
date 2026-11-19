import { signedMediaPath, verifyMediaToken } from '@/lib/media-vault'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'
import { safeFetch } from '@/lib/safe-url'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const EXT_TYPES: Record<string, string> = {
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  vtt: 'text/vtt',
  key: 'application/octet-stream',
}

function typeFor(target: string, upstream: string) {
  const ct = upstream.split(';')[0].trim().toLowerCase()
  if (ct && ct !== 'application/octet-stream' && !ct.startsWith('text/plain') && !ct.startsWith('text/html')) return ct
  const ext = (new URL(target).pathname.split('.').pop() ?? '').toLowerCase()
  return EXT_TYPES[ext] ?? 'application/octet-stream'
}

/** Every URI in a playlist becomes another signed /api/medya link, so segments, keys and sub-playlists play too. */
function rewritePlaylist(text: string, base: string, referer: string) {
  const wrap = (raw: string) => {
    try {
      const abs = new URL(raw, base).toString()
      return signedMediaPath(abs, referer, /\.m3u8(\?|$)/i.test(abs) ? 'hls' : undefined)
    } catch {
      return raw
    }
  }
  return text
    .split('\n')
    .map((line) => {
      const t = line.trim()
      if (!t) return line
      if (t.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_m, u: string) => `URI="${wrap(u)}"`)
      return wrap(t)
    })
    .join('\n')
}

async function relay(req: Request, method: 'GET' | 'HEAD') {
  const wait = rateLimit('medya', clientIp(req.headers), 2400, 60_000)
  if (wait) return tooMany(wait)

  const signed = verifyMediaToken(new URL(req.url).searchParams.get('t'))
  if (!signed) return new Response('Geçersiz ya da süresi geçmiş bağlantı.', { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

  const headers: Record<string, string> = {
    'User-Agent': UA,
    Accept: '*/*',
    'Accept-Language': 'tr,en;q=0.9',
    Referer: signed.referer,
    Origin: new URL(signed.referer).origin,
  }
  const range = req.headers.get('range')
  if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range

  let upstream: Response | null
  try {
    upstream = await safeFetch(signed.url, { method, headers, cache: 'no-store', signal: AbortSignal.timeout(45_000) })
  } catch {
    return new Response('Kaynağa ulaşılamadı.', { status: 502 })
  }
  if (!upstream) return new Response('Bu adres güvenlik nedeniyle okunamaz.', { status: 400 })
  if (!upstream.ok && upstream.status !== 206) return new Response(`Kaynak ${upstream.status} döndü.`, { status: upstream.status === 404 ? 404 : 502 })

  const contentType = upstream.headers.get('content-type') ?? ''
  const looksLikePlaylist = contentType.includes('mpegurl') || /\.m3u8(\?|$)/i.test(new URL(signed.url).pathname + new URL(signed.url).search)

  if (looksLikePlaylist && method === 'GET') {
    const text = await upstream.text()
    if (text.trimStart().startsWith('#EXTM3U')) {
      return new Response(rewritePlaylist(text, signed.url, signed.referer), {
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'private, max-age=4', 'X-Robots-Tag': 'noindex' },
      })
    }
  }

  const out: Record<string, string> = {
    'Content-Type': typeFor(signed.url, contentType),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
    'Content-Disposition': 'inline',
    'X-Robots-Tag': 'noindex',
  }
  // fetch() already decoded gzip/br bodies, so the upstream length would be wrong for what we send.
  const passthrough = upstream.headers.get('content-encoding') ? ['content-range', 'etag', 'last-modified'] : ['content-range', 'content-length', 'etag', 'last-modified']
  for (const h of passthrough) {
    const v = upstream.headers.get(h)
    if (v) out[h] = v
  }
  return new Response(method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers: out })
}

export function GET(req: Request) {
  return relay(req, 'GET')
}

export function HEAD(req: Request) {
  return relay(req, 'HEAD')
}
