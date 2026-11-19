import { NextRequest } from 'next/server'
import { proxyUrl, UPSTREAM_HEADERS } from '@/lib/hanime/relay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') || ''
  let target = ''
  try {
    target = Buffer.from(u, 'base64url').toString()
  } catch {
    return new Response('u', { status: 400 })
  }
  if (!/^https:\/\//.test(target) || !/rule34\.[a-z]+/.test(target)) return new Response('host', { status: 400 })

  const up = await fetch(proxyUrl(target), { headers: { ...UPSTREAM_HEADERS, Accept: 'image/*,video/*,*/*' } })
  if (!up.ok) return new Response('upstream ' + up.status, { status: 502 })

  const headers: Record<string, string> = {
    'Content-Type': up.headers.get('content-type') || 'application/octet-stream',
    'Cache-Control': 'public, max-age=86400',
  }
  const len = up.headers.get('content-length')
  if (len) headers['Content-Length'] = len
  return new Response(up.body, { status: up.status, headers })
}