import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Only MangaDex covers and its at-home page servers may be proxied — never an arbitrary URL. */
function allowed(raw: string | null) {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return null
    const host = url.hostname
    if (host === 'uploads.mangadex.org' || host.endsWith('.mangadex.network') || host === 'mangadex.network') return url
    return null
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const target = allowed(new URL(req.url).searchParams.get('u'))
  if (!target) return NextResponse.json({ error: 'Geçersiz görsel adresi' }, { status: 400 })

  const res = await fetch(target, {
    headers: { 'User-Agent': 'Sytheris/1.0 (+anime catalog)' },
    next: { revalidate: 86_400 },
  }).catch(() => null)

  const type = res?.headers.get('content-type') ?? ''
  if (!res || !res.ok || !type.startsWith('image/')) {
    return NextResponse.json({ error: 'Görsel alınamadı' }, { status: 502 })
  }

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  })
}
