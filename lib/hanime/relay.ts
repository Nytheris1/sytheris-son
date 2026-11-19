import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.HANIME_RELAY_SECRET ?? 'degistir-bunu-uzun-bir-string'

const mac = (url: string) => createHmac('sha256', SECRET).update(url).digest('base64url').slice(0, 22)

const ALLOWED = [
  /^([a-z0-9-]+\.)*hanime\.tv$/,
  /^([a-z0-9-]+\.)*htv-[a-z-]+\.com$/,
  /^([a-z0-9-]+\.)*rule34\.[a-z]+$/,
  /^([a-z0-9-]+\.)*hanime-cdn\.com$/,
]

export function allowedUrl(url: string) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && ALLOWED.some((re) => re.test(u.hostname))
  } catch {
    return false
  }
}

export function relayUrl(url: string) {
  return `/api/h/relay?u=${Buffer.from(url).toString('base64url')}`
}

export function decodeRelay(u: string) {
  try {
    const url = Buffer.from(u, 'base64url').toString()
    return allowedUrl(url) ? url : null
  } catch {
    return null
  }
}

export function rewritePlaylist(playlist: string, baseUrl: string) {
  const abs = (u: string) => new URL(u, baseUrl).toString()
  return playlist
    .split('\n')
    .map((line) => {
      const t = line.trim()
      if (!t) return line
      if (t.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, u: string) => `URI="${relayUrl(abs(u))}"`)
      return relayUrl(abs(t))
    })
    .join('\n')
}

export const UPSTREAM_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Referer: 'https://hanime.tv/',
  Origin: 'https://hanime.tv',
  Accept: '*/*',
  'Accept-Encoding': 'identity',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
}
const WORKER = (process.env.HANIME_WORKER_URL || '').replace(/\/$/, '')

export function proxyUrl(url: string) {
  if (!WORKER) return url
  return WORKER + '/proxy?u=' + Buffer.from(url).toString('base64url')
}