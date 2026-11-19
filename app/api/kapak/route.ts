import { NextResponse } from 'next/server'

const ALLOWED_HOSTS = new Set(['s4.anilist.co', 's1.anilist.co', 'img.anili.st'])

/**
 * Same-origin passthrough for AniList artwork so WebGL can sample it as a texture
 * without depending on the CDN's CORS behaviour. Only AniList image hosts are allowed.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('u')
  let target: URL
  try {
    target = new URL(raw ?? '')
  } catch {
    return NextResponse.json({ error: 'Geçersiz adres' }, { status: 400 })
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: 'İzin verilmeyen kaynak' }, { status: 403 })
  }

  const res = await fetch(target, { next: { revalidate: 604800 } }).catch(() => null)
  const type = res?.headers.get('content-type') ?? ''
  if (!res || !res.ok || !type.startsWith('image/')) {
    return NextResponse.json({ error: 'Görsel alınamadı' }, { status: 502 })
  }

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
    },
  })
}
