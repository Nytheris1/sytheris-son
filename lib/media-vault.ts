import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { secret } from '@/lib/session'
import { kvGet, kvSet } from '@/lib/store'

export type MediaKind = 'hls' | 'mp4'

export type VaultItem = {
  id: string
  label: string
  pageUrl: string
  url: string
  referer: string
  kind: MediaKind
  quality: string | null
  host: string
  by: string
  createdAt: number
}

const KEY = 'media-vault'
const MAX_ITEMS = 300

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 4096) return false
  try {
    const p = new URL(value).protocol
    return p === 'https:' || p === 'http:'
  } catch {
    return false
  }
}

export async function listVault(): Promise<VaultItem[]> {
  return (await kvGet<VaultItem[]>(KEY)) ?? []
}

export async function getVaultItem(id: string) {
  return (await listVault()).find((i) => i.id === id) ?? null
}

export async function saveVaultItem(input: Omit<VaultItem, 'id' | 'createdAt' | 'host'>) {
  const list = await listVault()
  const existing = list.find((i) => i.url === input.url)
  if (existing) return existing
  const item: VaultItem = { ...input, id: randomBytes(6).toString('hex'), host: new URL(input.url).hostname, createdAt: Date.now() }
  await kvSet(KEY, [item, ...list].slice(0, MAX_ITEMS))
  return item
}

export async function deleteVaultItem(id: string) {
  const list = await listVault()
  await kvSet(
    KEY,
    list.filter((i) => i.id !== id),
  )
}

/* ---------- Signed playback links ---------- */

function mac(body: string) {
  return createHmac('sha256', `sy-medya-v1|${secret()}`).update(body).digest('base64url')
}

/**
 * A playback link that can only ever relay this exact upstream URL with this referer. The relay rejects
 * anything it didn't sign itself, so /api/medya can't be abused as an open proxy.
 */
export function mediaToken(url: string, referer: string) {
  const body = Buffer.from(JSON.stringify({ u: url, r: referer })).toString('base64url')
  return `${body}.${mac(body)}`
}

export function signedMediaPath(url: string, referer: string, kind?: MediaKind) {
  return `/api/medya?${kind === 'hls' ? 'k=hls&' : ''}t=${mediaToken(url, referer)}`
}

export function verifyMediaToken(token: string | null): { url: string; referer: string } | null {
  if (!token || token.length > 12_000) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const given = Buffer.from(token.slice(dot + 1))
  const expected = Buffer.from(mac(body))
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const { u, r } = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { u: unknown; r: unknown }
    if (!isHttpUrl(u) || !isHttpUrl(r)) return null
    return { url: u, referer: r }
  } catch {
    return null
  }
}
