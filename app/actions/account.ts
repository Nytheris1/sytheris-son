'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { SESSION_COOKIE, cookieOptions, sessionToken } from '@/lib/session'
import { consumeCode, issueCode } from '@/lib/verify-code'
import {
  addPasswordLogin,
  commitEmailChange,
  changePassword,
  changeUsername,
  deleteAccount,
  getCurrentUser,
  passwordEmailOf,
  prepareEmailChange,
  revokeSessions,
  saveUser,
  type User,
} from '@/lib/users'

type Result = { ok: true; message?: string; step?: 'verify'; masked?: string; devCode?: string } | { ok: false; error: string }

const attempts = new Map<string, { n: number; at: number }>()
const WINDOW = 15 * 60_000

function throttle(uid: string) {
  const now = Date.now()
  const a = attempts.get(uid)
  if (a && now - a.at < WINDOW && a.n >= 6) return false
  attempts.set(uid, a && now - a.at < WINDOW ? { n: a.n + 1, at: a.at } : { n: 1, at: now })
  return true
}

async function reissue(user: User) {
  const store = await cookies()
  store.set(SESSION_COOKIE, sessionToken(user), cookieOptions(30 * 86400))
}

async function withUser(fn: (u: User) => Promise<Result>): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'Oturumun sona ermiş. Lütfen tekrar giriş yap.' }
  try {
    return await fn(user)
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Bir şeyler ters gitti.' }
  }
}

export async function updateIdentity(input: { displayName: string; username: string }): Promise<Result> {
  return withUser(async (u) => {
    const displayName = String(input.displayName ?? '').trim().replace(/\s+/g, ' ')
    if (displayName.length < 2) return { ok: false, error: 'Görünen ad en az 2 karakter olmalı.' }
    if (displayName.length > 40) return { ok: false, error: 'Görünen ad en fazla 40 karakter olabilir.' }
    const previous = u.username
    const username = String(input.username ?? '').trim()
    if (username && username !== u.username) await changeUsername(u, username)
    u.displayName = displayName
    await saveUser(u)
    revalidatePath(`/u/${previous}`)
    revalidatePath(`/u/${u.username}`)
    revalidatePath('/ayarlar')
    return { ok: true, message: u.username !== previous ? `Artık @${u.username} olarak görünüyorsun.` : 'Görünen ad güncellendi.' }
  })
}

/** Step 1 of an e-mail change: checks the password and sends a code to the new address. */
export async function updateEmail(input: { email: string; password: string }): Promise<Result> {
  return withUser(async (u) => {
    if (!throttle(u.id)) return { ok: false, error: 'Çok fazla deneme yaptın. 15 dakika sonra tekrar dene.' }
    const next = await prepareEmailChange(u, String(input.email ?? ''), String(input.password ?? ''))
    const issued = await issueCode<{ uid: string }>('email-change', next, { uid: u.id })
    if (!issued.ok) return { ok: false, error: issued.error }
    if ('skipped' in issued) {
      await commitEmailChange(u, next)
      u.emailVerified = false
      await saveUser(u)
      revalidatePath('/ayarlar')
      return { ok: true, message: 'E-posta adresin güncellendi.' }
    }
    return { ok: true, step: 'verify', masked: issued.masked, devCode: 'devCode' in issued ? issued.devCode : undefined }
  })
}

/** Step 2: the code proves the new address belongs to the user; the change is applied and the account is marked verified. */
export async function confirmEmailChange(input: { email: string; code: string }): Promise<Result> {
  return withUser(async (u) => {
    const next = String(input.email ?? '').trim().toLowerCase()
    const r = await consumeCode<{ uid: string }>('email-change', next, String(input.code ?? ''))
    if (!r.ok) return { ok: false, error: r.error }
    if (r.payload.uid !== u.id) return { ok: false, error: 'Bu kod bu hesaba ait değil.' }
    await commitEmailChange(u, next)
    revalidatePath('/ayarlar')
    revalidatePath(`/u/${u.username}`)
    return { ok: true, message: 'E-posta adresin doğrulandı ve güncellendi. Doğrulanmış rozeti profilinde.' }
  })
}

/** Lets accounts that signed up before codes existed verify their current address. */
export async function sendVerificationCode(): Promise<Result> {
  return withUser(async (u) => {
    const email = passwordEmailOf(u) ?? u.email
    if (!email) return { ok: false, error: 'Hesabında doğrulanacak bir e-posta yok.' }
    if (u.emailVerified) return { ok: true, message: 'E-postan zaten doğrulanmış.' }
    if (!throttle(u.id)) return { ok: false, error: 'Çok fazla deneme yaptın. 15 dakika sonra tekrar dene.' }
    const issued = await issueCode<{ uid: string }>('email-change', email, { uid: u.id })
    if (!issued.ok) return { ok: false, error: issued.error }
    if ('skipped' in issued) return { ok: false, error: 'E-posta servisi henüz yapılandırılmamış.' }
    return { ok: true, step: 'verify', masked: issued.masked, devCode: 'devCode' in issued ? issued.devCode : undefined }
  })
}

export async function confirmCurrentEmail(input: { code: string }): Promise<Result> {
  return withUser(async (u) => {
    const email = passwordEmailOf(u) ?? u.email
    if (!email) return { ok: false, error: 'Hesabında doğrulanacak bir e-posta yok.' }
    const r = await consumeCode<{ uid: string }>('email-change', email, String(input.code ?? ''))
    if (!r.ok) return { ok: false, error: r.error }
    if (r.payload.uid !== u.id) return { ok: false, error: 'Bu kod bu hesaba ait değil.' }
    u.emailVerified = true
    u.emailVerifiedAt = Date.now()
    await saveUser(u)
    revalidatePath('/ayarlar')
    revalidatePath(`/u/${u.username}`)
    return { ok: true, message: 'E-postan doğrulandı. Doğrulanmış rozeti profilinde.' }
  })
}

export async function updatePassword(input: { current: string; next: string }): Promise<Result> {
  return withUser(async (u) => {
    if (!throttle(u.id)) return { ok: false, error: 'Çok fazla deneme yaptın. 15 dakika sonra tekrar dene.' }
    await changePassword(u, String(input.current ?? ''), String(input.next ?? ''))
    await reissue(u)
    revalidatePath('/ayarlar')
    return { ok: true, message: 'Şifren değişti. Diğer cihazlardaki oturumlar kapatıldı.' }
  })
}

export async function linkPasswordLogin(input: { email: string; password: string }): Promise<Result> {
  return withUser(async (u) => {
    await addPasswordLogin(u, String(input.email ?? ''), String(input.password ?? ''))
    revalidatePath('/ayarlar')
    return { ok: true, message: 'Artık e-posta ve şifreyle de giriş yapabilirsin.' }
  })
}

export async function signOutEverywhere(): Promise<Result> {
  return withUser(async (u) => {
    await revokeSessions(u)
    await reissue(u)
    revalidatePath('/ayarlar')
    return { ok: true, message: 'Bu cihaz dışındaki tüm oturumlar kapatıldı.' }
  })
}

export async function removeAccount(input: { confirm: string; password?: string }): Promise<Result> {
  return withUser(async (u) => {
    if (String(input.confirm ?? '').trim().toLowerCase() !== u.username.toLowerCase()) {
      return { ok: false, error: 'Onay için kullanıcı adını aynen yazmalısın.' }
    }
    if (passwordEmailOf(u)) {
      if (!throttle(u.id)) return { ok: false, error: 'Çok fazla deneme yaptın. 15 dakika sonra tekrar dene.' }
      const { loginEmail } = await import('@/lib/users')
      await loginEmail(passwordEmailOf(u)!, String(input.password ?? '')).catch(() => {
        throw new Error('Şifre hatalı.')
      })
    }
    await deleteAccount(u)
    const store = await cookies()
    store.set(SESSION_COOKIE, '', cookieOptions(0))
    return { ok: true, message: 'Hesabın silindi.' }
  })
}
