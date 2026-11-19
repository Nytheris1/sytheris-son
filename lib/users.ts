import 'server-only'
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { kvDel, kvGet, kvList, kvSet } from './store'
import { getSession } from './session'
import { activeTier, sortBadges, type BadgeId, type BannerOverlay, type BannerPreset, type CommentColor, type FrameId, type NameStyle, type Nameplate, type Premium, type ProfileEffect, type Role } from './membership'

const scrypt = promisify(_scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>

export type Provider = 'discord' | 'google' | 'github' | 'email'

export type ProfileLink = { type: string; url: string }
export type ProfileSong = { title: string; artist: string; url: string; cover?: string | null } | null
export type LoginEvent = { at: number; device: string; ip: string; method: Provider }
export type Security = { logins: LoginEvent[]; passwordChangedAt?: number; emailChangedAt?: number; revokedAt?: number }

export type User = {
  id: string
  username: string
  displayName: string
  email?: string | null
  avatar?: string | null
  provider: Provider
  providerId: string
  createdAt: number
  bio: string
  location: string
  background?: string | null
  backgroundDim: number
  accent: string
  links: ProfileLink[]
  song: ProfileSong
  favorites: number[]
  views: number
  effects: { tilt: boolean; typewriter: boolean; glow: boolean }
  banned?: boolean
  banReason?: string | null
  role?: Role
  premium?: Premium
  badges?: BadgeId[]
  frame?: FrameId
  bannerPreset?: BannerPreset
  bannerOverlay?: BannerOverlay
  profileEffect?: ProfileEffect
  nameStyle?: NameStyle
  commentColor?: CommentColor
  nameplate?: Nameplate
  lastSeen?: number
  /** Bumping this invalidates every session cookie issued before. */
  sessionVersion?: number
  /** E-mail that can be used with a password, also for OAuth accounts that linked one. */
  loginEmail?: string | null
  /** Set once the user proves ownership of their e-mail with a 6-digit code; shows the "Doğrulanmış" badge. */
  emailVerified?: boolean
  emailVerifiedAt?: number
  security?: Security
  customThemes?: { id: string; name: string; hex: string }[]
}

export type PublicUser = Omit<User, 'email' | 'providerId' | 'loginEmail' | 'security' | 'sessionVersion'>

export function toPublic(u: User): PublicUser {
  const { email: _e, providerId: _p, loginEmail: _l, security: _s, sessionVersion: _v, ...rest } = u
  return rest
}

/** Badges a user displays: manually awarded ones plus the automatic ones they currently qualify for. */
export function computeBadges(
  u: Pick<User, 'badges' | 'role' | 'premium'> & Partial<Pick<User, 'favorites' | 'createdAt' | 'song' | 'emailVerified'>>,
  extra: { libraryCount?: number; customLists?: number; comments?: number } = {},
): BadgeId[] {
  const set = new Set<BadgeId>(u.badges ?? [])
  if (u.role === 'moderator' || u.role === 'admin') set.add('moderator')
  if (u.emailVerified) set.add('verified')
  const tier = activeTier(u.premium)
  if (tier === 'plus') set.add('plus')
  if (tier === 'ultra') set.add('ultra')
  if ((extra.libraryCount ?? 0) >= 50) set.add('otaku')
  if ((extra.customLists ?? 0) >= 5) set.add('collector')
  if ((extra.comments ?? 0) >= 10) set.add('critic')
  if ((extra.comments ?? 0) >= 1) set.add('firstStep')
  if ((extra.libraryCount ?? 0) >= 100) set.add('marathon')
  if ((u.favorites?.length ?? 0) >= 10) set.add('curator')
  if (u.createdAt && Date.now() - u.createdAt >= 365 * 86400_000) set.add('veteran')
  if (u.song) set.add('bard')
  return sortBadges([...set])
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[ıİ]/g, 'i')
      .replace(/[şŞ]/g, 's')
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .replace(/[^a-z0-9_.]/g, '')
      .slice(0, 20) || 'kullanici'
  )
}

export const RESERVED = new Set(['admin', 'api', 'giris', 'profil', 'sytheris', 'root', 'moderator', 'support'])

export async function uniqueUsername(base: string) {
  let name = slugify(base)
  if (RESERVED.has(name)) name = `${name}${Math.floor(Math.random() * 999)}`
  let candidate = name
  for (let i = 0; i < 20; i++) {
    const taken = await kvGet<string>(`uname:${candidate}`)
    if (!taken) return candidate
    candidate = `${name}${Math.floor(Math.random() * 9999)}`
  }
  return `${name}${randomBytes(3).toString('hex')}`
}

function newUser(p: { provider: Provider; providerId: string; name: string; username: string; email?: string | null; avatar?: string | null }): User {
  return {
    id: randomBytes(12).toString('hex'),
    username: p.username,
    displayName: p.name.slice(0, 40),
    email: p.email ?? null,
    avatar: p.avatar ?? null,
    provider: p.provider,
    providerId: p.providerId,
    createdAt: Date.now(),
    bio: 'Sytheris üzerinde anime keşfediyorum.',
    location: '',
    background: null,
    backgroundDim: 55,
    accent: 'green',
    links: [],
    song: null,
    favorites: [],
    views: 0,
    effects: { tilt: true, typewriter: true, glow: true },
    role: 'user',
    premium: null,
    badges: [],
    frame: 'none',
    bannerPreset: 'none',
  }
}

async function stampEarly(u: User) {
  const n = ((await kvGet<number>('user-count')) ?? 0) + 1
  await kvSet('user-count', n)
  if (n <= 1000) u.badges = [...(u.badges ?? []), 'early']
}

export async function getUser(id: string) {
  return kvGet<User>(`user:${id}`)
}

export async function saveUser(u: User) {
  await kvSet(`user:${u.id}`, u)
}

export async function getUserByUsername(username: string) {
  const id = await kvGet<string>(`uname:${username.toLowerCase()}`)
  return id ? getUser(id) : null
}

export async function getCurrentUser() {
  try {
    const session = await getSession()
    if (!session) return null
    const u = await getUser(session.uid)
    if (!u || u.banned) return null
    if ((session.sv ?? 0) !== (u.sessionVersion ?? 0)) return null
    return u
  } catch {
    return null
  }
}

export async function upsertOAuthUser(p: { provider: Exclude<Provider, 'email'>; providerId: string; name: string; email?: string | null; avatar?: string | null }) {
  const linkKey = `oauth:${p.provider}:${p.providerId}`
  const existingId = await kvGet<string>(linkKey)
  if (existingId) {
    const u = await getUser(existingId)
    if (u) {
      u.avatar = u.avatar && !u.avatar.includes('cdn.discordapp') && !u.avatar.includes('googleusercontent') && !u.avatar.includes('githubusercontent') ? u.avatar : (p.avatar ?? u.avatar)
      await saveUser(u)
      return u
    }
  }
  const username = await uniqueUsername(p.name)
  const u = newUser({ ...p, username })
  await kvSet(`uname:${username}`, u.id)
  await kvSet(linkKey, u.id)
  await stampEarly(u)
  await saveUser(u)
  return u
}

export async function hashPassword(password: string) {
  return hash(password)
}

async function hash(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = await scrypt(password, salt, 64)
  return `${salt}:${key.toString('hex')}`
}

async function check(password: string, stored: string) {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false
  const derived = await scrypt(password, salt, 64)
  const a = Buffer.from(key, 'hex')
  return a.length === derived.length && timingSafeEqual(a, derived)
}

export async function emailTaken(email: string) {
  return Boolean(await kvGet(`email:${email.trim().toLowerCase()}`))
}

/** `password` may be a plain password or, for code-verified sign-ups, an already computed `{ hash }`. */
export async function registerEmail(email: string, password: string | { hash: string }, name: string, verified = false) {
  const normalized = email.trim().toLowerCase()
  if (await kvGet(`email:${normalized}`)) throw new Error('Bu e-posta ile zaten bir hesap var.')
  const username = await uniqueUsername(name || normalized.split('@')[0])
  const u = newUser({ provider: 'email', providerId: normalized, name: name || username, username, email: normalized })
  if (verified) {
    u.emailVerified = true
    u.emailVerifiedAt = Date.now()
  }
  await kvSet(`email:${normalized}`, { id: u.id, hash: typeof password === 'string' ? await hash(password) : password.hash })
  await kvSet(`uname:${username}`, u.id)
  await stampEarly(u)
  await saveUser(u)
  return u
}

export async function loginEmail(email: string, password: string) {
  const normalized = email.trim().toLowerCase()
  const rec = await kvGet<{ id: string; hash: string }>(`email:${normalized}`)
  if (!rec || !(await check(password, rec.hash))) throw new Error('E-posta veya şifre hatalı.')
  const u = await getUser(rec.id)
  if (!u) throw new Error('Hesap bulunamadı.')
  if (u.banned) throw new Error('Bu hesap askıya alınmış.')
  return u
}

export async function changeUsername(u: User, next: string) {
  const name = slugify(next)
  if (name.length < 3) throw new Error('Kullanıcı adı en az 3 karakter olmalı.')
  if (RESERVED.has(name)) throw new Error('Bu kullanıcı adı ayrılmış.')
  if (name === u.username) return u
  const taken = await kvGet<string>(`uname:${name}`)
  if (taken && taken !== u.id) throw new Error('Bu kullanıcı adı alınmış.')
  await kvSet(`uname:${name}`, u.id)
  const { kvDel } = await import('./store')
  await kvDel(`uname:${u.username}`)
  u.username = name
  return u
}

export async function listUsers() {
  const rows = await kvList<User>('user:', 500)
  return rows.map((r) => r.value).sort((a, b) => b.createdAt - a.createdAt)
}

// ---------- Account security ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function passwordEmailOf(u: User) {
  return u.loginEmail ?? (u.provider === 'email' ? u.providerId : null)
}

export function describeDevice(ua: string) {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Tarayıcı'
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Bilinmeyen cihaz'
  return `${browser} · ${os}`
}

function maskIp(ip: string) {
  if (!ip || ip === 'local') return 'Yerel ağ'
  if (ip.includes(':')) return `${ip.split(':').slice(0, 3).join(':')}:••••`
  const parts = ip.split('.')
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.•••.•••` : ip
}

export async function recordLogin(u: User, request: Request, method: Provider) {
  const ua = request.headers.get('user-agent') ?? ''
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const security: Security = u.security ?? { logins: [] }
  security.logins = [{ at: Date.now(), device: describeDevice(ua), ip: maskIp(ip), method }, ...(security.logins ?? [])].slice(0, 8)
  u.security = security
  u.lastSeen = Date.now()
  await saveUser(u)
}

async function requirePassword(u: User, password: string) {
  const email = passwordEmailOf(u)
  if (!email) throw new Error('Bu hesapta şifre tanımlı değil.')
  const rec = await kvGet<{ id: string; hash: string }>(`email:${email}`)
  if (!rec || rec.id !== u.id || !(await check(password, rec.hash))) throw new Error('Mevcut şifre hatalı.')
  return rec
}

export function validatePassword(pw: string) {
  if (pw.length < 8) return 'Şifre en az 8 karakter olmalı.'
  if (pw.length > 128) return 'Şifre en fazla 128 karakter olabilir.'
  if (!/[a-zçğıöşü]/i.test(pw) || !/[0-9]/.test(pw)) return 'Şifre en az bir harf ve bir rakam içermeli.'
  return null
}

export async function changePassword(u: User, current: string, next: string) {
  const err = validatePassword(next)
  if (err) throw new Error(err)
  if (current === next) throw new Error('Yeni şifre mevcut şifreden farklı olmalı.')
  await requirePassword(u, current)
  const email = passwordEmailOf(u)!
  await kvSet(`email:${email}`, { id: u.id, hash: await hash(next) })
  u.security = { ...(u.security ?? { logins: [] }), passwordChangedAt: Date.now() }
  u.sessionVersion = (u.sessionVersion ?? 0) + 1
  await saveUser(u)
  return u
}

/** Validates an e-mail change (format, availability, current password) without applying it. */
export async function prepareEmailChange(u: User, nextEmail: string, password: string) {
  const normalized = nextEmail.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized) || normalized.length > 120) throw new Error('Geçerli bir e-posta gir.')
  const current = passwordEmailOf(u)
  if (current === normalized) throw new Error('Bu zaten hesabının e-postası.')
  const taken = await kvGet<{ id: string }>(`email:${normalized}`)
  if (taken && taken.id !== u.id) throw new Error('Bu e-posta başka bir hesapta kullanılıyor.')
  await requirePassword(u, password)
  return normalized
}

/** Applies an e-mail change that was already validated and proven with a code sent to the new address. */
export async function commitEmailChange(u: User, normalized: string) {
  const current = passwordEmailOf(u)
  if (current === normalized) return u
  const taken = await kvGet<{ id: string }>(`email:${normalized}`)
  if (taken && taken.id !== u.id) throw new Error('Bu e-posta başka bir hesapta kullanılıyor.')
  const rec = current ? await kvGet<{ id: string; hash: string }>(`email:${current}`) : null
  if (!rec || rec.id !== u.id) throw new Error('Bu hesapta şifre tanımlı değil.')
  await kvSet(`email:${normalized}`, rec)
  if (current) await kvDel(`email:${current}`)
  if (u.provider === 'email') u.providerId = normalized
  else u.loginEmail = normalized
  u.email = normalized
  u.emailVerified = true
  u.emailVerifiedAt = Date.now()
  u.security = { ...(u.security ?? { logins: [] }), emailChangedAt: Date.now() }
  await saveUser(u)
  return u
}

export async function changeLoginEmail(u: User, nextEmail: string, password: string) {
  const normalized = nextEmail.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized) || normalized.length > 120) throw new Error('Geçerli bir e-posta gir.')
  const current = passwordEmailOf(u)
  if (current === normalized) throw new Error('Bu zaten hesabının e-postası.')
  const taken = await kvGet<{ id: string }>(`email:${normalized}`)
  if (taken && taken.id !== u.id) throw new Error('Bu e-posta başka bir hesapta kullanılıyor.')
  const rec = await requirePassword(u, password)
  await kvSet(`email:${normalized}`, rec)
  if (current) await kvDel(`email:${current}`)
  if (u.provider === 'email') u.providerId = normalized
  else u.loginEmail = normalized
  u.email = normalized
  u.security = { ...(u.security ?? { logins: [] }), emailChangedAt: Date.now() }
  await saveUser(u)
  return u
}

export async function addPasswordLogin(u: User, email: string, password: string) {
  if (passwordEmailOf(u)) throw new Error('Bu hesapta zaten e-posta ile giriş var.')
  const normalized = email.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized) || normalized.length > 120) throw new Error('Geçerli bir e-posta gir.')
  const err = validatePassword(password)
  if (err) throw new Error(err)
  if (await kvGet(`email:${normalized}`)) throw new Error('Bu e-posta başka bir hesapta kullanılıyor.')
  await kvSet(`email:${normalized}`, { id: u.id, hash: await hash(password) })
  u.loginEmail = normalized
  u.email = u.email ?? normalized
  u.security = { ...(u.security ?? { logins: [] }), passwordChangedAt: Date.now() }
  await saveUser(u)
  return u
}

export async function revokeSessions(u: User) {
  u.sessionVersion = (u.sessionVersion ?? 0) + 1
  u.security = { ...(u.security ?? { logins: [] }), revokedAt: Date.now() }
  await saveUser(u)
  return u
}

export async function deleteAccount(u: User) {
  const email = passwordEmailOf(u)
  await Promise.all([
    kvDel(`user:${u.id}`),
    kvDel(`uname:${u.username}`),
    email ? kvDel(`email:${email}`) : Promise.resolve(),
    u.provider !== 'email' ? kvDel(`oauth:${u.provider}:${u.providerId}`) : Promise.resolve(),
  ])
}
