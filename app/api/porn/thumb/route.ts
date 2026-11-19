const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Eporner CDN blocks bare hotlinks, so posters go through here with a proper referer. */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get('u')
  if (!u) return new Response('u yok', { status: 400 })

  let target: URL
  try {
    target = new URL(Buffer.from(u, 'base64url').toString('utf8'))
  } catch {
    return new Response('u bozuk', { status: 400 })
  }
  if (!/(^|\.)eporner\.com$/i.test(target.hostname)) return new Response('host', { status: 400 })

  const res = await fetch(target.toString(), {
    headers: { 'User-Agent': UA, Referer: 'https://www.eporner.com/' },
    cache: 'force-cache',
  })
  if (!res.ok) return new Response('kaynak ' + res.status, { status: 502 })

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400, immutable',
    },
  })
}