import { NextResponse } from 'next/server'
import { getFullBody, proxied } from '@/lib/fullbody'

const FALLBACK_HOSTS = new Set(['s4.anilist.co', 's1.anilist.co', 'img.anili.st'])

/**
 * Lazy full-body lookup for grids: <img src="/api/fullbody?n=Name&s=Series&f=fallback">.
 *   n  character name   ·   s  series titles, separated by "|"   ·   f  AniList image used when nothing is found
 * Redirects to the proxied artwork so the browser and CDN cache the image itself.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const name = (url.searchParams.get('n') ?? '').slice(0, 120)
  const series = (url.searchParams.get('s') ?? '').split('|').map((s) => s.slice(0, 160)).filter(Boolean).slice(0, 3)
  const fallback = url.searchParams.get('f') ?? ''

  const found = name ? await getFullBody(name, series, { cutouts: false }).catch(() => null) : null
  if (found) {
    return NextResponse.redirect(new URL(proxied(found.url), url), {
      status: 302,
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800', 'X-Fullbody-Transparent': found.transparent ? '1' : '0' },
    })
  }

  let target = '/placeholder-user.jpg'
  try {
    const f = new URL(fallback)
    if (f.protocol === 'https:' && FALLBACK_HOSTS.has(f.hostname)) target = f.toString()
  } catch {}
  return NextResponse.redirect(new URL(target, url), { status: 302, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } })
}
