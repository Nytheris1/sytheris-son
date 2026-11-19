import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import { OAUTH, appOrigin, isProvider } from '@/lib/oauth'
import { cookieOptions, sign } from '@/lib/session'

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const origin = appOrigin(request)
  if (!isProvider(provider)) return NextResponse.redirect(`${origin}/giris?error=provider`)
  const cfg = OAUTH[provider]
  const clientId = process.env[cfg.envId]
  if (!clientId || !process.env[cfg.envSecret]) return NextResponse.redirect(`${origin}/giris?error=not_configured&provider=${provider}`)

  const url = new URL(request.url)
  const popup = url.searchParams.get('popup') === '1'
  const state = randomBytes(16).toString('hex')
  const redirectUri = `${origin}/api/auth/${provider}/callback`

  const auth = new URL(cfg.authorize)
  auth.searchParams.set('client_id', clientId)
  auth.searchParams.set('redirect_uri', redirectUri)
  auth.searchParams.set('response_type', 'code')
  auth.searchParams.set('scope', cfg.scope)
  auth.searchParams.set('state', state)
  for (const [k, v] of Object.entries(cfg.extra ?? {})) auth.searchParams.set(k, v)

  const res = NextResponse.redirect(auth.toString())
  res.cookies.set('sy_oauth', sign({ state, provider, popup, exp: Date.now() + 10 * 60_000 }), cookieOptions(600))
  return res
}
