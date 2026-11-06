export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const wrap = (u: string, ref: string) => `/api/stream/proxy?u=${Buffer.from(u).toString('base64url')}&r=${encodeURIComponent(ref)}`

function rewrite(text: string, base: string, ref: string) {
  return text
    .split('\n')
    .map((line) => {
      const t = line.trim()
      if (!t) return line
      if (t.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, u: string) => `URI="${wrap(new URL(u, base).toString(), ref)}"`)
      return wrap(new URL(t, base).toString(), ref)
    })
    .join('\n')
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const target = Buffer.from(searchParams.get('u') ?? '', 'base64url').toString()
  const ref = searchParams.get('r') || 'https://animekai.to/'
  if (!/^https?:\/\//.test(target)) return new Response('geçersiz url', { status: 400 })

  const upstream = await fetch(target, {
    headers: {
      'User-Agent': UA,
      Referer: ref,
      Origin: new URL(ref).origin,
      ...(req.headers.get('range') ? { Range: req.headers.get('range') as string } : {}),
    },
    cache: 'no-store',
  })
  if (!upstream.ok) return new Response(`kaynak ${upstream.status}`, { status: upstream.status })

  const type = upstream.headers.get('content-type') ?? ''
  const isPlaylist = type.includes('mpegurl') || /\.m3u8(\?|$)/i.test(target)

  if (isPlaylist) {
    const text = rewrite(await upstream.text(), target, ref)
    return new Response(text, {
      headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'public, max-age=10' },
    })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable',
      ...(upstream.headers.get('content-range') ? { 'Content-Range': upstream.headers.get('content-range') as string } : {}),
      'Accept-Ranges': 'bytes',
    },
  })
}