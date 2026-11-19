import { NextResponse } from 'next/server'
import { HORROR_FILMS, horrorThumb } from '@/lib/horror'

/**
 * Film stills for the public homepage. Looked up by slug on the server so the YouTube id —
 * which is reserved for Sytheris+ members — never reaches a non-member's browser.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const film = HORROR_FILMS.find((f) => f.slug === slug)
  if (!film) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const res = await fetch(horrorThumb(film.youtubeId, 'hq'), { next: { revalidate: 604800 } }).catch(() => null)
  const type = res?.headers.get('content-type') ?? ''
  if (!res || !res.ok || !type.startsWith('image/')) return NextResponse.redirect(new URL('/korku/hero.webp', _req.url))

  return new NextResponse(res.body, {
    headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable' },
  })
}
