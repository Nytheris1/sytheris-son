const UA = 'Sytheris/1.0 (manga reader)'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get('u')
  if (!u) return new Response('u yok', { status: 400 })

  let target: URL
  try {
    target = new URL(Buffer.from(u, 'base64url').toString('utf8'))
  } catch {
    return new Response('u bozuk', { status: 400 })
  }
  if (!/(^|\.)(mangadex\.org|mangadex\.network|mangadex\.dev)$/i.test(target.hostname)) {
    return new Response('host', { status: 400 })
  }

  const res = await fetch(target.toString(), { headers: { 'User-Agent': UA, Referer: 'https://mangadex.org/' }, cache: 'force-cache' })
  if (!res.ok) return new Response('kaynak ' + res.status, { status: 502 })

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400, immutable',
    },
  })
}