import 'server-only'
import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { kvDel, kvGet, kvSet } from './store'
import { secret } from './session'
import { codeEmail, mailConfigured, sendMail } from './mailer'

/**
 * Six-digit e-mail verification codes. Only an HMAC of the code is stored, it expires after
 * 10 minutes, allows 5 attempts, and a new code can be requested once a minute.
 */

export type CodePurpose = 'login' | 'register' | 'email-change'
type Stored<P> = { hash: string; exp: number; tries: number; sentAt: number; payload: P }

const TTL = 10 * 60_000
const RESEND_AFTER = 60_000
const MAX_TRIES = 5

const keyOf = (purpose: CodePurpose, email: string) => `vcode:${purpose}:${email.trim().toLowerCase()}`
const digest = (code: string, email: string) => createHmac('sha256', `${secret()}|vcode`).update(`${email}|${code}`).digest('hex')

export function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}`
}

/**
 * Creates and e-mails a code. Without a mail provider the code is returned as `devCode` outside production
 * so the flow stays testable in previews; in production `skipped` tells the caller to fall back gracefully.
 */
export async function issueCode<P>(purpose: CodePurpose, email: string, payload: P) {
  const normalized = email.trim().toLowerCase()
  if (!mailConfigured() && process.env.NODE_ENV === 'production') return { ok: true as const, skipped: true as const, masked: maskEmail(normalized) }
  const key = keyOf(purpose, normalized)
  const existing = await kvGet<Stored<P>>(key)
  if (existing && Date.now() - existing.sentAt < RESEND_AFTER) {
    return { ok: false as const, error: `Yeni kod için ${Math.ceil((RESEND_AFTER - (Date.now() - existing.sentAt)) / 1000)} saniye bekle.` }
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await kvSet<Stored<P>>(key, { hash: digest(code, normalized), exp: Date.now() + TTL, tries: 0, sentAt: Date.now(), payload })

  if (!mailConfigured()) return { ok: true as const, devCode: code, masked: maskEmail(normalized) }
  const mail = codeEmail(code, purpose)
  const sent = await sendMail(normalized, mail.subject, mail.html, mail.text)
  if (!sent.ok) {
    await kvDel(key)
    return { ok: false as const, error: sent.error }
  }
  return { ok: true as const, masked: maskEmail(normalized) }
}

/** Returns the payload stored with the code when it matches; the code is single-use. */
export async function consumeCode<P>(purpose: CodePurpose, email: string, code: string) {
  const normalized = email.trim().toLowerCase()
  const key = keyOf(purpose, normalized)
  const stored = await kvGet<Stored<P>>(key)
  if (!stored || Date.now() > stored.exp) {
    if (stored) await kvDel(key)
    return { ok: false as const, error: 'Kodun süresi doldu. Yeni bir kod iste.' }
  }
  if (stored.tries >= MAX_TRIES) {
    await kvDel(key)
    return { ok: false as const, error: 'Çok fazla hatalı deneme. Yeni bir kod iste.' }
  }
  const clean = code.replace(/\D/g, '')
  const a = Buffer.from(digest(clean, normalized), 'hex')
  const b = Buffer.from(stored.hash, 'hex')
  if (clean.length !== 6 || a.length !== b.length || !timingSafeEqual(a, b)) {
    await kvSet<Stored<P>>(key, { ...stored, tries: stored.tries + 1 })
    const left = MAX_TRIES - stored.tries - 1
    return { ok: false as const, error: left > 0 ? `Kod hatalı. ${left} deneme hakkın kaldı.` : 'Kod hatalı. Yeni bir kod iste.' }
  }
  await kvDel(key)
  return { ok: true as const, payload: stored.payload }
}

/** Lets the "Kodu tekrar gönder" button re-send for the same pending request. */
export async function reissueCode<P>(purpose: CodePurpose, email: string) {
  const stored = await kvGet<Stored<P>>(keyOf(purpose, email))
  if (!stored) return { ok: false as const, error: 'Bekleyen bir doğrulama yok. Baştan başla.' }
  if (Date.now() - stored.sentAt < RESEND_AFTER) {
    return { ok: false as const, error: `Yeni kod için ${Math.ceil((RESEND_AFTER - (Date.now() - stored.sentAt)) / 1000)} saniye bekle.` }
  }
  await kvDel(keyOf(purpose, email))
  return issueCode<P>(purpose, email, stored.payload)
}
