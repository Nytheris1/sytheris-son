/**
 * Site-wide access gate. Runs in the proxy (Web Crypto only, no Node APIs) and in the gate action.
 * The signing secret is derived from the access key itself, so rotating SITE_ACCESS_KEY instantly
 * revokes every issued pass.
 */

export const GATE_COOKIE = 'sy_gate'
export const GATE_PATH = '/kapi'

/** Paths that must stay reachable without a pass: the gate itself, the hidden download page and PWA files. */
const OPEN_PREFIXES = ['/kapi', '/indir', '/api/indir', '/api/h', '/api/porn', '/api/proxy', '/robots.txt', '/manifest.json', '/sw.js', '/icon', '/apple-icon', '/favicon', '/placeholder']

export function isOpenPath(pathname: string) {
  return OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}.`) || pathname.startsWith(`${p}-`))
}

export function gateKey() {
  return process.env.SITE_ACCESS_KEY || process.env.ADMIN_PASSWORD || ''
}

export function gateEnabled() {
  return gateKey().length > 0
}

const encoder = new TextEncoder()

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(data: string) {
  const secret = `sy-gate-v1|${process.env.SESSION_SECRET ?? ''}|${gateKey()}`
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(data)))
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function issueGateToken(ttlMs: number) {
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(12)))
  const body = `${Date.now() + ttlMs}.${nonce}`
  return `${body}.${await hmac(body)}`
}

export async function verifyGateToken(token?: string | null) {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [exp, nonce, sig] = parts
  const expiry = Number(exp)
  if (!Number.isFinite(expiry) || Date.now() > expiry || !nonce) return false
  return constantTimeEqual(sig, await hmac(`${exp}.${nonce}`))
}

/** Hashes both sides first so comparison time never depends on the key length. */
export async function keyMatches(input: string) {
  const expected = gateKey()
  if (!expected || !input) return false
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(input)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  return constantTimeEqual(toBase64Url(a), toBase64Url(b))
}

/** Only allow same-site relative redirects after unlocking. */
export function safeNext(next: unknown) {
  const value = typeof next === 'string' ? next : ''
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\') || value.startsWith(GATE_PATH)) return '/'
  return value
}
