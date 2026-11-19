import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.HANIME_RELAY_SECRET ?? 'sytheris-dev-relay'

const mac = (url: string) => createHmac('sha256', SECRET).update(url).digest('base64url').slice(0, 22)

export function relayUrl(url: string) {
  return `/api/h/relay?u=${Buffer.from(url).toString('base64url')}&s=${mac(url)}`
}

export function decodeRelay(u: string, s: string) {
  let url: string
  try {
    url = Buffer.from(u, 'base64url').toString()
  } catch {
    return null
  }
  if (!/^https:\/\//.test(url)) return null
  const expect = Buffer.from(mac(url))
  const given = Buffer.from(s)
  if (expect.length !== given.length || !timingSafeEqual(expect, given)) return null
  return url
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
}
const WORKER = (process.env.HANIME_WORKER_URL || '').replace(/\/$/, '')

export function proxyUrl(url: string) {
  if (!WORKER) return url
  return WORKER + '/proxy?u=' + Buffer.from(url).toString('base64url') + '&s=' + mac(url)
}