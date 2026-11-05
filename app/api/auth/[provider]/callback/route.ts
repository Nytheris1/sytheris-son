import { NextResponse, type NextRequest } from 'next/server'
import { OAUTH, appOrigin, isProvider } from '@/lib/oauth'
import { SESSION_COOKIE, cookieOptions, sign, verify } from '@/lib/session'
import { logEvent } from '@/lib/site'
import { upsertOAuthUser } from '@/lib/users'

function popupPage(origin: string, ok: boolean, message = '') {
  const payload = JSON.stringify({ type: 'sy-auth', ok, message })
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>SYTHERIS</title><style>body{margin:0;display:grid;place-items:center;height:100vh;background:#0b0f0d;color:#f2f2f2;font-family:system-ui}</style></head><body><p>${ok ? 'Giriş başarılı, yönlendiriliyorsun…' : 'Giriş başarısız.'}</p><script>try{if(window.opener){window.opener.postMessage(${payload},${JSON.stringify(origin)});window.close()}else{location.replace(${JSON.stringify(ok ? `${origin}/profil` : `${origin}/giris?error=oauth`)})}}catch(e){location.replace(${JSON.stringify(`${origin}/profil`)})}</script></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const origin = appOrigin(request)
  const fail = (code: string, popup = false) => (popup ? popupPage(origin, false, code) : NextResponse.redirect(`${origin}/giris?error=${code}`))
  if (!isProvider(provider)) return fail('provider')

  const stored = verify<{ state: string; provider: string; popup: boolean }>(request.cookies.get('sy_oauth')?.value)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const popup = Boolean(stored?.popup)
  if (url.searchParams.get('error')) return fail('denied', popup)
  if (!stored || stored.provider !== provider || stored.state !== state || !code) return fail('state', popup)

  const cfg = OAUTH[provider]
  try {
    const body = new URLSearchParams({
      client_id: process.env[cfg.envId] as string,
      client_secret: process.env[cfg.envSecret] as string,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${origin}/api/auth/${provider}/callback`,
    })
    const tokenRes = await fetch(cfg.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
    })
    const token = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string }
    if (!token.access_token) throw new Error(token.error_description || token.error || `token ${tokenRes.status}`)
    const profile = await cfg.profile(token.access_token)
    const user = await upsertOAuthUser({ provider, providerId: profile.id, name: profile.name, email: profile.email, avatar: profile.avatar })
    if (user.banned) return fail('banned', popup)

    const res = popup ? popupPage(origin, true) : NextResponse.redirect(`${origin}/profil`)
    res.cookies.set(SESSION_COOKIE, sign({ uid: user.id, exp: Date.now() + 30 * 86400_000 }), cookieOptions(30 * 86400))
    res.cookies.set('sy_oauth', '', { ...cookieOptions(0) })
    return res
  } catch (e) {
    await logEvent({ level: 'error', source: 'server', message: `${cfg.label} OAuth hatası: ${(e as Error).message}`, path: `/api/auth/${provider}/callback` })
    return fail('oauth', popup)
  }
}
