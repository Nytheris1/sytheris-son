import { NextResponse, type NextRequest } from 'next/server'
import { GATE_COOKIE, GATE_PATH, gateEnabled, isOpenPath, verifyGateToken } from '@/lib/gate'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'
import { bodyLimit, harden, isBlockedPath, isBotClient, limitRule, methodAllowed, sameOrigin } from '@/lib/security'

/** Whole-site ceiling per IP per minute. Static assets never reach the proxy, so this only counts real work. */
const GLOBAL_MAX = 500
const GLOBAL_WINDOW = 60000
const ALLOW = 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS'

function deny(status: number, error: string, extra?: Record<string, string>) {
  const headers = harden(new Headers({ 'Cache-Control': 'no-store', ...extra }))
  return NextResponse.json({ ok: false, error }, { status, headers })
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const method = request.method.toUpperCase()
  const isApi = pathname.startsWith('/api/')
  const isAction = request.headers.has('next-action')
  const isSafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'

  if (isBlockedPath(pathname)) return deny(403, 'Böyle bir yol yok.')
  if (!methodAllowed(method, pathname, isAction)) return deny(405, 'Metot desteklenmiyor.', { Allow: ALLOW })

  // Cross-site write protection. Runs before the gate so a cookieless deployment stays covered.
  if (!isSafe && !sameOrigin(request)) return deny(403, 'İstek kaynağı doğrulanamadı.')

  const cap = bodyLimit(pathname, isAction)
  if (cap) {
    const declared = Number(request.headers.get('content-length') || 0)
    if (declared > cap) return deny(413, 'Gövde çok büyük.')
  }

  if (method !== 'OPTIONS') {
    const ip = clientIp(request.headers)
    const globalWait = rateLimit('global', ip, GLOBAL_MAX, GLOBAL_WINDOW)
    if (globalWait) return tooMany(globalWait)

    const rule = limitRule(pathname)
    if (rule) {
      const wait = rateLimit(rule.name, ip, rule.max, rule.window)
      if (wait) return tooMany(wait, 'Bu bölüm için istek sınırı aşıldı.')
    }
  }

  // Scripted page crawlers are refused; real browsers always send Sec-Fetch-Site, bots never do.
  if (!isApi && !isAction && method === 'GET' && !request.headers.get('sec-fetch-site')) {
    if (isBotClient(request.headers.get('user-agent') || '')) return deny(403, 'Tarayıcı doğrulanamadı.')
  }

  if (gateEnabled() && !isOpenPath(pathname) && !(await verifyGateToken(request.cookies.get(GATE_COOKIE)?.value))) {
    const isNavigation = isSafe && !isApi
    if (!isNavigation) {
      return deny(401, 'Bu alan özel. Önce erişim kapısından geçmelisin.')
    }
    const url = request.nextUrl.clone()
    url.pathname = GATE_PATH
    // Keep any existing query (e.g. preview tokens) so the redirect never drops host-level auth.
    url.search = search
    url.searchParams.set('next', `${pathname}${search}`)
    const redirect = NextResponse.redirect(url)
    harden(redirect.headers)
    return redirect
  }

  const headers = new Headers(request.headers)
  headers.set('x-pathname', pathname)
  const response = NextResponse.next({ request: { headers } })
  harden(response.headers)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|gif|ico|zip|woff2?|mp3|mp4|webm)$).*)'],
}