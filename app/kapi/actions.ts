'use server'

import { cookies, headers } from 'next/headers'
import { GATE_COOKIE, gateEnabled, issueGateToken, keyMatches, safeNext } from '@/lib/gate'
import { logEvent } from '@/lib/site'

const WINDOW_MS = 15 * 60_000
const MAX_ATTEMPTS = 5
const attempts = new Map<string, { n: number; at: number }>()

export type GateState = { error?: string; next?: string; retryIn?: number }

export async function unlockGate(_prev: GateState, formData: FormData): Promise<GateState> {
  const next = safeNext(formData.get('next'))
  if (!gateEnabled()) return { next }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'
  const now = Date.now()
  const record = attempts.get(ip)
  const active = record && now - record.at < WINDOW_MS ? record : null

  if (active && active.n >= MAX_ATTEMPTS) {
    return { error: 'Çok fazla hatalı deneme. Kapı bir süreliğine kilitlendi.', retryIn: Math.ceil((WINDOW_MS - (now - active.at)) / 60_000) }
  }

  const key = String(formData.get('key') ?? '').trim()
  if (!(await keyMatches(key))) {
    const n = (active?.n ?? 0) + 1
    attempts.set(ip, { n, at: active?.at ?? now })
    // Progressive delay makes scripted guessing slow even before the lockout kicks in.
    await new Promise((r) => setTimeout(r, Math.min(400 * 2 ** (n - 1), 4000)))
    await logEvent({ level: 'warn', source: 'server', message: `Erişim kapısında hatalı anahtar (${ip}, deneme ${n})`, path: '/kapi' }).catch(() => {})
    const left = MAX_ATTEMPTS - n
    return { error: left > 0 ? `Anahtar geçersiz. ${left} deneme hakkın kaldı.` : 'Anahtar geçersiz. Kapı bir süreliğine kilitlendi.' }
  }

  attempts.delete(ip)
  const remember = formData.get('remember') === 'on'
  const ttl = remember ? 30 * 86400_000 : 12 * 3600_000
  const isProd = process.env.NODE_ENV === 'production'
  const store = await cookies()
  store.set(GATE_COOKIE, await issueGateToken(ttl), {
    httpOnly: true,
    secure: true,
    // The v0 preview renders inside a cross-site iframe, so development needs a partitioned SameSite=None cookie.
    sameSite: isProd ? 'lax' : 'none',
    partitioned: !isProd,
    path: '/',
    maxAge: Math.floor(ttl / 1000),
  })
  return { next }
}
