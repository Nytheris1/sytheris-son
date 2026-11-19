import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

/**
 * SSRF guard for server-side fetches of user-supplied URLs. Rejects non-http(s) schemes, credentials,
 * odd ports and any host that resolves to a loopback, private, link-local (cloud metadata) or reserved address.
 */

function privateV4(ip: string) {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function privateV6(ip: string) {
  const v = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (v === '::' || v === '::1') return true
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return privateV4(mapped[1])
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v) || v.startsWith('64:ff9b:') || v.startsWith('2001:db8')
}

export function isPrivateAddress(ip: string) {
  const kind = isIP(ip.replace(/^\[|\]$/g, ''))
  if (kind === 4) return privateV4(ip)
  if (kind === 6) return privateV6(ip)
  return true
}

export async function publicUrl(raw: string): Promise<URL | null> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password) return null
  if (url.port && !['80', '443', '8080', '8443'].includes(url.port)) return null
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return null
  if (isIP(host)) return isPrivateAddress(host) ? null : url
  try {
    const addrs = await lookup(host, { all: true, verbatim: true })
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return null
  } catch {
    return null
  }
  return url
}

/** fetch() that re-validates every redirect hop so a public URL can't bounce the server into the private network. */
export async function safeFetch(raw: string, init: RequestInit = {}, maxRedirects = 4): Promise<Response | null> {
  let current = raw
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await publicUrl(current)
    if (!url) return null
    const res = await fetch(url, { ...init, redirect: 'manual' })
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null
    if (!location) return res
    current = new URL(location, url).toString()
  }
  return null
}
