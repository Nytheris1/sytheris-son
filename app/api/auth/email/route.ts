import { NextResponse } from 'next/server'
import { SESSION_COOKIE, cookieOptions, sign } from '@/lib/session'
import { getSettings } from '@/lib/site'
import { loginEmail, registerEmail } from '@/lib/users'

const attempts = new Map<string, { n: number; at: number }>()

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const a = attempts.get(ip)
  if (a && now - a.at < 10 * 60_000 && a.n >= 10) return NextResponse.json({ error: 'Çok fazla deneme. 10 dakika sonra tekrar dene.' }, { status: 429 })
  attempts.set(ip, a && now - a.at < 10 * 60_000 ? { n: a.n + 1, at: a.at } : { n: 1, at: now })

  let body: { mode?: string; email?: string; password?: string; name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const email = String(body.email ?? '').trim()
  const password = String(body.password ?? '')
  const name = String(body.name ?? '').trim().slice(0, 40)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return NextResponse.json({ error: 'Geçerli bir e-posta gir.' }, { status: 400 })
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Şifre en az 8 karakter olmalı.' }, { status: 400 })

  try {
    let user
    if (body.mode === 'register') {
      const settings = await getSettings()
      if (!settings.registrationsOpen) return NextResponse.json({ error: 'Yeni kayıtlar şu an kapalı.' }, { status: 403 })
      user = await registerEmail(email, password, name)
    } else {
      user = await loginEmail(email, password)
    }
    const res = NextResponse.json({ ok: true, username: user.username })
    res.cookies.set(SESSION_COOKIE, sign({ uid: user.id, exp: Date.now() + 30 * 86400_000 }), cookieOptions(30 * 86400))
    attempts.delete(ip)
    return res
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
