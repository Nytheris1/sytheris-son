import { NextResponse } from 'next/server'
import { isSafebooruUrl } from '@/lib/fullbody'
import { cutOut } from '@/lib/cutout'

const CACHE = 'public, max-age=604800, s-maxage=604800, immutable'
const cutCache = new Map<string, Buffer>()

/**
 * Same-origin passthrough for Safebooru artwork (hotlink-safe, cacheable, usable on canvas).
 * With `cut=1` the plain background is removed and a transparent PNG is returned instead.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const raw = params.get('u') ?? ''
  if (!isSafebooruUrl(raw)) return NextResponse.json({ error: 'İzin verilmeyen kaynak' }, { status: 403 })

  const wantsCut = params.get('cut') === '1'
  const cached = wantsCut ? cutCache.get(raw) : undefined
  if (cached) return new NextResponse(new Uint8Array(cached), { headers: { 'Content-Type': 'image/png', 'Cache-Control': CACHE } })

  const res = await fetch(raw, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Sytheris/1.0)' }, next: { revalidate: 604800 } }).catch(() => null)
  const type = res?.headers.get('content-type') ?? ''
  if (!res || !res.ok || !type.startsWith('image/')) return NextResponse.json({ error: 'Görsel alınamadı' }, { status: 502 })

  if (!wantsCut) return new NextResponse(res.body, { headers: { 'Content-Type': type, 'Cache-Control': CACHE } })

  const original = Buffer.from(await res.arrayBuffer())
  const png = cutOut(original, type)
  if (!png) return new NextResponse(new Uint8Array(original), { headers: { 'Content-Type': type, 'Cache-Control': CACHE } })

  if (cutCache.size >= 60) cutCache.delete(cutCache.keys().next().value as string)
  cutCache.set(raw, png)
  return new NextResponse(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Cache-Control': CACHE } })
}
