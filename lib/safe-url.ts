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

/**
 * Suffix allowlist for the media relays. Without it a relay is an open proxy: any public host on the
 * internet can be pulled through our egress. Entries are registrable domains, subdomains match too.
 * `PROXY_HOSTS_EXTRA` appends more at runtime as a comma separated list, so a missing CDN never
 * needs a code change.
 */
const PROXY_HOSTS = [
  'animepahe.ru',
  'animepahe.com',
  'kwik.cx',
  'kwi.kz',
  'kwik.si',
  'bysekoze.com',
  'hianime.to',
  'megacloud.tv',
  'rapid-cloud.co',
  'gogocdn.net',
  'gogoanime3.co',
  'animekai.to',
  'anify.tv',
  'anizone.to',
  'mp4upload.com',
  'filemoon.sx',
  'doodstream.com',
  'cloudfront.net',
  'akamaized.net',
  'akamaihd.net',
  'jwpcdn.com',
  'b-cdn.net',
  'bunnycdn.com',
  'hanime.tv',
  'hanime-cdn.com',
  'htv-warrior-of-light.com',
  'apiplayer.ru',
  'lovable.app',
  'icefy.top',
  'vidsrc.mov',
  'vidsrc.xyz',
  'vidlink.pro',
  '2embed.cc',
  'multiembed.mov',
  'superembed.com',
  'tmdb.org',
  'youtube.com',
  'ytimg.com',
  'nhentai.net',
  'mangadex.org',
  'rule34.us',
  'safebooru.org',
  'pinterest.com',
]

export function hostAllowed(raw: string) {
  let host: string
  try {
    host = new URL(raw).hostname.toLowerCase().replace(/^\[|\]$/g, '')
  } catch {
    return false
  }
  const extra = (process.env.PROXY_HOSTS_EXTRA || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  return [...PROXY_HOSTS, ...extra].some((d) => host === d || host.endsWith(`.${d}`))
}

type Resolved = { url: URL; addresses: string[] }

async function resolve(raw: string): Promise<Resolved | null> {
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
  if (isIP(host)) return isPrivateAddress(host) ? null : { url, addresses: [host] }
  try {
    const addrs = await lookup(host, { all: true, verbatim: true })
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return null
    return { url, addresses: addrs.map((a) => a.address) }
  } catch {
    return null
  }
}

export async function publicUrl(raw: string): Promise<URL | null> {
  const resolved = await resolve(raw)
  return resolved ? resolved.url : null
}

type LookupFn = (
  hostname: string,
  options: unknown,
  callback: (err: Error | null, address: string, family: number) => void,
) => void

/**
 * Pins the connection to the address we already validated, so a second DNS answer cannot move the
 * socket onto the private network between validation and connect. Silently degrades to plain
 * fetch() where undici is unavailable.
 */
async function pinnedAgent(address: string) {
  const family = isIP(address)
  if (!family) return undefined
  try {
    const undici = (await import('undici')) as unknown as { Agent: new (opts: unknown) => unknown }
    const pinned: LookupFn = (_hostname, _options, callback) => callback(null, address, family)
    return new undici.Agent({ connect: { lookup: pinned, timeout: 10_000 }, connections: 1, keepAliveTimeout: 1_000 })
  } catch {
    return undefined
  }
}

/** fetch() that re-validates every redirect hop so a public URL can't bounce the server into the private network. */
export async function safeFetch(
  raw: string,
  init: RequestInit = {},
  maxRedirects = 4,
  enforceHosts = false,
): Promise<Response | null> {
  let current = raw
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (enforceHosts && !hostAllowed(current)) return null
    const resolved = await resolve(current)
    if (!resolved) return null
    const agent = await pinnedAgent(resolved.addresses[0])
    const options = agent
      ? ({ ...init, redirect: 'manual', dispatcher: agent } as RequestInit)
      : { ...init, redirect: 'manual' as RequestRedirect }
    const res = await fetch(resolved.url, options)
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null
    if (!location) return res
    current = new URL(location, resolved.url).toString()
  }
  return null
}