import 'server-only'
import { createHmac, randomBytes, timingSafeEqual, createHash } from 'crypto'
import { cookies } from 'next/headers'

const g = globalThis as unknown as { __sySecret?: string }

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  if (process.env.ADMIN_PASSWORD) return createHash('sha256').update(`sytheris:${process.env.ADMIN_PASSWORD}`).digest('hex')
  if (!g.__sySecret) g.__sySecret = randomBytes(32).toString('hex')
  return g.__sySecret
}

function b64(input: string) {
  return Buffer.from(input).toString('base64url')
}

export function sign(payload: Record<string, unknown>) {
  const body = b64(JSON.stringify(payload))
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verify<T = Record<string, unknown>>(token?: string | null): T | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as T & { exp?: number }
    if (data.exp && Date.now() > data.exp) return null
    return data
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'sy_session'
export const ADMIN_COOKIE = 'sy_admin'

const isProd = process.env.NODE_ENV === 'production'

export const cookieOptions = (maxAgeSeconds: number) =>
  ({
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  })

export async function getSessionUserId() {
  const store = await cookies()
  const data = verify<{ uid: string }>(store.get(SESSION_COOKIE)?.value)
  return data?.uid ?? null
}

export async function isAdmin() {
  const store = await cookies()
  const data = verify<{ admin: boolean }>(store.get(ADMIN_COOKIE)?.value)
  return Boolean(data?.admin)
}

export function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}
