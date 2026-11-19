import { NextResponse } from 'next/server'
import { SESSION_COOKIE, cookieOptions, sessionToken } from '@/lib/session'
import { getSettings } from '@/lib/site'
import { emailTaken, getUser, hashPassword, loginEmail, recordLogin, registerEmail, saveUser, type User } from '@/lib/users'
import { consumeCode, issueCode, reissueCode } from '@/lib/verify-code'
import { clientIp } from '@/lib/rate-limit'

/**
 * E-mail sign-in in two steps:
 *   1. { step: 'start', mode, email, password, name? }  → credentials checked, a 6-digit code is e-mailed
 *   2. { step: 'verify', mode, email, code }            → code checked, session cookie issued
 *   { step: 'resend', mode, email }                     → sends a fresh code for the pending request
 * The password never leaves step 1: sign-ups keep only its scrypt hash next to the pending code.
 */

type RegisterPayload = { name: string; hash: string }
type LoginPayload = { uid: string }

const attempts = new Map<string, { n: number; at: number }>()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function limited(ip: string) {
  const now = Date.now()
  const a = attempts.get(ip)
  if (a && now - a.at < 10 * 60_000 && a.n >= 15) return true
  attempts.set(ip, a && now - a.at < 10 * 60_000 ? { n: a.n + 1, at: a.at } : { n: 1, at: now })
  return false
}

async function signIn(user: User, request: Request, extra: Record<string, unknown> = {}) {
  await recordLogin(user, request, 'email').catch(() => {})
  const res = NextResponse.json({ ok: true, username: user.username, ...extra })
  res.cookies.set(SESSION_COOKIE, sessionToken(user), cookieOptions(30 * 86400))
  return res
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  if (limited(ip)) return NextResponse.json({ error: 'Çok fazla deneme. 10 dakika sonra tekrar dene.' }, { status: 429 })

  let body: { step?: string; mode?: string; email?: string; password?: string; name?: string; code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const step = body.step ?? 'start'
  const mode = body.mode === 'register' ? 'register' : 'login'
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 120) return NextResponse.json({ error: 'Geçerli bir e-posta gir.' }, { status: 400 })

  try {
    if (step === 'resend') {
      const r = await reissueCode(mode, email)
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
      return NextResponse.json({ ok: true, step: 'verify', masked: r.masked, devCode: 'devCode' in r ? r.devCode : undefined })
    }

    if (step === 'verify') {
      const code = String(body.code ?? '')
      if (mode === 'register') {
        const r = await consumeCode<RegisterPayload>('register', email, code)
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
        const settings = await getSettings()
        if (!settings.registrationsOpen) return NextResponse.json({ error: 'Yeni kayıtlar şu an kapalı.' }, { status: 403 })
        const user = await registerEmail(email, { hash: r.payload.hash }, r.payload.name, true)
        attempts.delete(ip)
        return signIn(user, request, { verified: true })
      }
      const r = await consumeCode<LoginPayload>('login', email, code)
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
      const user = await getUser(r.payload.uid)
      if (!user || user.banned) return NextResponse.json({ error: 'Hesap bulunamadı ya da askıya alınmış.' }, { status: 400 })
      if (!user.emailVerified) {
        user.emailVerified = true
        user.emailVerifiedAt = Date.now()
        await saveUser(user)
      }
      attempts.delete(ip)
      return signIn(user, request, { verified: true })
    }

    // step === 'start'
    const password = String(body.password ?? '')
    if (password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Şifre en az 8 karakter olmalı.' }, { status: 400 })

    if (mode === 'register') {
      const settings = await getSettings()
      if (!settings.registrationsOpen) return NextResponse.json({ error: 'Yeni kayıtlar şu an kapalı.' }, { status: 403 })
      if (await emailTaken(email)) return NextResponse.json({ error: 'Bu e-posta ile zaten bir hesap var.' }, { status: 400 })
      const name = String(body.name ?? '').trim().slice(0, 40)
      const issued = await issueCode<RegisterPayload>('register', email, { name, hash: await hashPassword(password) })
      if (!issued.ok) return NextResponse.json({ error: issued.error }, { status: 400 })
      if ('skipped' in issued) {
        // No mail provider in production: never lock people out — create the (unverified) account directly.
        const user = await registerEmail(email, password, name)
        return signIn(user, request, { verified: false })
      }
      return NextResponse.json({ ok: true, step: 'verify', masked: issued.masked, devCode: 'devCode' in issued ? issued.devCode : undefined })
    }

    const user = await loginEmail(email, password)
    const issued = await issueCode<LoginPayload>('login', email, { uid: user.id })
    if (!issued.ok) return NextResponse.json({ error: issued.error }, { status: 400 })
    if ('skipped' in issued) return signIn(user, request, { verified: Boolean(user.emailVerified) })
    return NextResponse.json({ ok: true, step: 'verify', masked: issued.masked, devCode: 'devCode' in issued ? issued.devCode : undefined })
  } catch (e) {
    // loginEmail/registerEmail throw user-facing Turkish messages; anything else stays generic.
    const msg = (e as Error).message ?? ''
    const safe = /^[A-ZÇĞİÖŞÜa-zçğıöşü0-9 .,'’-]{3,120}$/.test(msg) && !/error|fetch|sql|ECONN|undefined|null/i.test(msg)
    return NextResponse.json({ error: safe ? msg : 'İşlem tamamlanamadı. Tekrar dene.' }, { status: 400 })
  }
}
