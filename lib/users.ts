import 'server-only'
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { kvGet, kvList, kvSet } from './store'
import { getSessionUserId } from './session'

const scrypt = promisify(_scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>

export type Provider = 'discord' | 'google' | 'github' | 'email'

export type ProfileLink = { type: string; url: string }
export type ProfileSong = { title: string; artist: string; url: string; cover?: string | null } | null

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
}

export type PublicUser = Omit<User, 'email' | 'providerId'>

export function toPublic(u: User): PublicUser {
  const { email: _e, providerId: _p, ...rest } = u
  return rest
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
  }
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
    const uid = await getSessionUserId()
    if (!uid) return null
    const u = await getUser(uid)
    if (!u || u.banned) return null
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
  await saveUser(u)
  return u
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

export async function registerEmail(email: string, password: string, name: string) {
  const normalized = email.trim().toLowerCase()
  if (await kvGet(`email:${normalized}`)) throw new Error('Bu e-posta ile zaten bir hesap var.')
  const username = await uniqueUsername(name || normalized.split('@')[0])
  const u = newUser({ provider: 'email', providerId: normalized, name: name || username, username, email: normalized })
  await kvSet(`email:${normalized}`, { id: u.id, hash: await hash(password) })
  await kvSet(`uname:${username}`, u.id)
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
