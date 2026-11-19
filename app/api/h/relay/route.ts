import { NextRequest } from 'next/server'
import { decodeRelay, rewritePlaylist, proxyUrl, UPSTREAM_HEADERS } from '@/lib/hanime/relay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? ''
  const s = req.nextUrl.searchParams.get('s') ?? ''
  const target = decodeRelay(u)
  if (!target) return new Response('imza geçersiz', { status: 400 })

  const range = req.headers.get('range')
  const upstream = await fetch(proxyUrl(target), {
    headers: { ...UPSTREAM_HEADERS, ...(range ? { Range: range } : {}) },
    cache: 'no-store',
  })
  if (!upstream.ok && upstream.status !== 206) return new Response(`upstream ${upstream.status}`, { status: 502 })

  const isPlaylist = /\.m3u8($|\?)/.test(target) || (upstream.headers.get('content-type') ?? '').includes('mpegurl')

  if (isPlaylist) {
    const body = rewritePlaylist(await upstream.text(), target)
    return new Response(body, {
      headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
    })
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'video/mp2t',
      'Cache-Control': 'public, max-age=3600',
      ...(upstream.headers.get('content-length') ? { 'Content-Length': upstream.headers.get('content-length')! } : {}),
      ...(upstream.headers.get('content-range') ? { 'Content-Range': upstream.headers.get('content-range')! } : {}),
      'Accept-Ranges': 'bytes',
    },
  })
}