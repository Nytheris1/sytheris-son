import { NextResponse, type NextRequest } from 'next/server'
import { GATE_COOKIE, GATE_PATH, gateEnabled, isOpenPath, verifyGateToken } from '@/lib/gate'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (gateEnabled() && !isOpenPath(pathname) && !(await verifyGateToken(request.cookies.get(GATE_COOKIE)?.value))) {
    const isNavigation = (request.method === 'GET' || request.method === 'HEAD') && !pathname.startsWith('/api/')
    if (!isNavigation) {
      return NextResponse.json({ error: 'Bu alan özel. Önce erişim kapısından geçmelisin.' }, { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow' } })
    }
    const url = request.nextUrl.clone()
    url.pathname = GATE_PATH
    // Keep any existing query (e.g. preview tokens) so the redirect never drops host-level auth.
    url.search = search
    url.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  const headers = new Headers(request.headers)
  headers.set('x-pathname', pathname)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|gif|ico|zip|woff2?|mp3|mp4|webm)$).*)'],
}
