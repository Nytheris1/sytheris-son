export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Bazı CDN'lerin bozuk sertifikaları için (yalnızca bu route'un sürecinde geçerli)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const REFERERS: Record<string, string> = {
  animepahe: 'https://animepahe.ru',
  kwik: 'https://kwik.cx',
  hianime: 'https://hianime.to',
  zoro: 'https://hianime.to',
  gogoanime: 'https://gogoanime3.co',
  animekai: 'https://animekai.to',
  anify: 'https://anify.tv',
}

const EXT_TYPES: Record<string, string> = {
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  vtt: 'text/vtt',
}

function decodeTarget(sp: URLSearchParams): string {
  const plain = sp.get('url')
  if (plain) return plain
  const b64 = sp.get('u')
  if (!b64) return ''
  try {
    return Buffer.from(b64, 'base64url').toString('utf8')
  } catch {
    return ''
  }
}

function isPrivate(host: string): boolean {
  return (
    /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === '[::1]'
  )
}

function pickReferer(target: string, given: string | null): string {
  if (given && /^https?:\/\//.test(given)) return given
  try {
    const host = new URL(target).hostname
    for (const [needle, ref] of Object.entries(REFERERS)) {
      if (host.includes(needle)) return ref
    }
    return new URL(target).origin
  } catch {
    return 'https://animepahe.ru'
  }
}

function wrap(url: string, ref: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(ref)}`
}

function rewritePlaylist(text: string, base: string, ref: string): string {
  const abs = (u: string): string => {
    try {
      return new URL(u, base).toString()
    } catch {
      return u
    }
  }

  return text
    .split('\n')
    .map((line) => {
      const t = line.trim()
      if (!t) return line
      if (t.startsWith('#')) {
        return line.replace(/URI="([^"]+)"/g, (_m, u: string) => `URI="${wrap(abs(u), ref)}"`)
      }
      return wrap(abs(t), ref)
    })
    .join('\n')
}

function typeFor(target: string, upstream: string | null): string {
  const fromUpstream = (upstream ?? '').split(';')[0].trim().toLowerCase()
  if (fromUpstream && !fromUpstream.startsWith('text/plain') && fromUpstream !== 'application/octet-stream') {
    return fromUpstream
  }
  const ext = (target.split('?')[0].split('#')[0].split('.').pop() ?? '').toLowerCase()
  return EXT_TYPES[ext] ?? (fromUpstream || 'application/octet-stream')
}

async function handle(req: Request, method: 'GET' | 'HEAD'): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const target = decodeTarget(searchParams).trim()

  if (!/^https?:\/\//i.test(target)) {
    return new Response('Geçersiz ya da eksik url parametresi.', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return new Response('Çözümlenemeyen url.', { status: 400 })
  }
  if (isPrivate(parsed.hostname)) {
    return new Response('Yerel adresler proxy üzerinden okunamaz.', { status: 400 })
  }

  const ref = pickReferer(target, searchParams.get('referer') ?? searchParams.get('r'))

  const forward: Record<string, string> = {
    'User-Agent': UA,
    Accept: '*/*',
    'Accept-Language': 'tr,en;q=0.9',
    Referer: ref,
    Origin: new URL(ref).origin,
  }
  const range = req.headers.get('range')
  if (range) forward.Range = range
  const ifRange = req.headers.get('if-range')
  if (ifRange) forward['If-Range'] = ifRange

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method,
      headers: forward,
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(45_000),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(`Kaynağa ulaşılamadı: ${msg}`, { status: 502 })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Kaynak ${upstream.status} döndü.`, {
      status: upstream.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const contentType = upstream.headers.get('content-type') ?? ''
  const isPlaylist =
    contentType.includes('mpegurl') ||
    /\.m3u8(\?|#|$)/i.test(target) ||
    (parsed.pathname.endsWith('/') && contentType.includes('text'))

  if (isPlaylist) {
    const text = await upstream.text()
    if (!text.includes('#EXTM3U')) {
      return new Response(text, {
        status: upstream.status,
        headers: { 'Content-Type': contentType || 'text/plain; charset=utf-8' },
      })
    }
    return new Response(rewritePlaylist(text, target, ref), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      },
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': typeFor(target, contentType),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
  }
  const contentRange = upstream.headers.get('content-range')
  if (contentRange) headers['Content-Range'] = contentRange
  const etag = upstream.headers.get('etag')
  if (etag) headers.ETag = etag

  if (method === 'HEAD' || !upstream.body) {
    const len = upstream.headers.get('content-length')
    if (len && !contentRange) headers['Content-Length'] = len
    return new Response(null, { status: upstream.status, headers })
  }

  // Gövde olduğu gibi akıtılır; metne çevrilmez.
  return new Response(upstream.body, { status: upstream.status, headers })
}

export async function GET(req: Request): Promise<Response> {
  return handle(req, 'GET')
}

export async function HEAD(req: Request): Promise<Response> {
  return handle(req, 'HEAD')
}