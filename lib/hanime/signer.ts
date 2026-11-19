import 'server-only'
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { createContext, runInContext } from 'node:vm'

const ORIGIN = 'https://hanime.tv'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const VENDOR_RE = /https:\/\/hanime-cdn\.com\/js\/vendor\.[0-9a-f]+\.min\.js/

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'upgrade-insecure-requests': '1',
}

const SCRIPT_HEADERS: Record<string, string> = {
  ...BROWSER_HEADERS,
  Accept: '*/*',
  Referer: ORIGIN + '/',
  'sec-fetch-dest': 'script',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-site': 'cross-site',
}

type Signer = { sign: () => { signature: string; time: string } }

let signer: Signer | null = null
let building: Promise<Signer> | null = null

const b64u = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64u = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

async function buildSigner(): Promise<Signer> {
  const known = [
    process.env.HANIME_VENDOR_URL || '',
    'https://hanime-cdn.com/js/vendor.6cb274d12de4872d245a5bc7781bdc5e.min.js',
  ].filter(Boolean)

  let code = ''
  let vendorUrl = ''
  for (const url of known) {
    try {
      const res = await fetch(url, { headers: SCRIPT_HEADERS })
      if (!res.ok) continue
      const text = await res.text()
      if (text.length > 100_000) {
        code = text
        vendorUrl = url
        break
      }
    } catch {
      // sonraki adaya gec
    }
  }

  if (!code) {
    let html = ''
    let status = 0
    for (const path of ['/', '/browse/trending', '/search']) {
      const res = await fetch(ORIGIN + path, { headers: BROWSER_HEADERS })
      status = res.status
      html = await res.text()
      if (html.length > 5000 && /vendor\.[a-z0-9]+\.min\.js/i.test(html)) break
    }
    const found =
      html.match(/https:\/\/hanime-cdn\.com\/js\/vendor\.[a-z0-9]+\.min\.js/i) ||
      html.match(/\/js\/vendor\.[a-z0-9]+\.min\.js/i)
    if (!found) throw new Error('vendor script bulunamadi (status ' + status + ', uzunluk ' + html.length + ')')
    const url = new URL(found[0], ORIGIN).toString()
    vendorUrl = url
    const res = await fetch(url, { headers: SCRIPT_HEADERS })
    if (!res.ok) throw new Error('vendor indirilemedi ' + res.status)
    code = await res.text()
  }

  const listeners = new Map<string, ((e: unknown) => void)[]>()
  const win: Record<string, unknown> = {
    location: { origin: ORIGIN, href: ORIGIN + '/', hostname: 'hanime.tv', protocol: 'https:', pathname: '/' },
    document: {
      location: { origin: ORIGIN, href: ORIGIN + '/' },
      currentScript: { src: vendorUrl, tagName: 'SCRIPT', getAttribute: () => null },
      addEventListener: () => {},
      createElement: () => ({ style: {}, setAttribute: () => {}, addEventListener: () => {}, getContext: () => null }),
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      querySelector: () => null,
    },
    navigator: { userAgent: UA, language: 'en-US', languages: ['en-US'], platform: 'Win32' },
    screen: { width: 1920, height: 1080 },
    performance: { now: () => Date.now() },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    addEventListener: (ev: string, fn: (e: unknown) => void) => {
      const list = listeners.get(ev) ?? []
      list.push(fn)
      listeners.set(ev, list)
    },
    removeEventListener: () => {},
    dispatchEvent: (ev: { type?: string }) => {
      const list = listeners.get(ev && ev.type ? ev.type : '') || []
      for (const fn of list) {
        try {
          fn(ev)
        } catch {
          // dinleyici hatasi
        }
      }
      return true
    },
    requestAnimationFrame: (fn: (t: number) => void) => setTimeout(() => fn(Date.now()), 0),
    cancelAnimationFrame: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s: string) => Buffer.from(s, 'binary').toString('base64'),
    console,
    crypto: globalThis.crypto,
    TextDecoder,
    TextEncoder,
    URL,
    Uint8Array,
    WebAssembly,
    CustomEvent: class {
      type: string
      detail: unknown
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type
        this.detail = init?.detail ?? null
      }
    },
  }
  win.window = win
  win.self = win
  win.globalThis = win
  win.Event = win.CustomEvent

  const ctx = createContext(win, { name: 'hanime-signer' })
  try {
    runInContext(code, ctx, { timeout: 30_000, filename: vendorUrl })
  } catch (err) {
    const e = err as { message?: string }
    throw new Error('vendor calistirilamadi: ' + (e?.message || String(err)))
  }

  const sign = () => {
    win.ssignature = ''
    win.stime = ''
    for (const fn of listeners.get('e') ?? []) {
      try {
        fn({ type: 'e', detail: null })
      } catch {
        /* modül hatası tek isteği düşürsün, imzalayıcıyı değil */
      }
    }
    return { signature: String(win.ssignature ?? ''), time: String(win.stime ?? '') }
  }

  for (let i = 0; i < 40; i++) {
    const probe = sign()
    if (/^[0-9a-f]{64}$/.test(probe.signature) && probe.time) return { sign }
    await new Promise((r) => setTimeout(r, 150))
  }
  throw new Error('imzalayıcı hazır olmadı')
}

export async function getSigner() {
  if (signer) return signer
  building ??= buildSigner()
    .then((s) => {
      signer = s
      return s
    })
    .finally(() => {
      building = null
    })
  return building
}

export function resetSigner() {
  signer = null
}

/* --- csrf + imzalı istek --- */

type Csrf = { token: string; proof: string }

export async function getCsrf(): Promise<Csrf> {
  const res = await fetch('https://ct.hanime.tv/csrf-token', {
    headers: { 'User-Agent': UA, Origin: ORIGIN, Referer: ORIGIN + '/' },
    cache: 'no-store',
  })
  const body = await res.text()
  let token = ''
  try {
    const json = JSON.parse(body) as { token?: string; csrf_token?: string }
    token = json.token ?? json.csrf_token ?? ''
  } catch {
    token = body.trim().replace(/^"|"$/g, '')
  }
  const proof = /htv_csrf_proof=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1] ?? ''
  if (!token || !proof) throw new Error('csrf alınamadı')
  return { token, proof }
}

export async function signedFetch(url: string, init: RequestInit = {}) {
  const { sign } = await getSigner()
  const { signature, time } = sign()
  const csrf = await getCsrf()
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      'User-Agent': UA,
      Origin: ORIGIN,
      Referer: ORIGIN + '/',
      'x-signature-version': 'web2',
      'x-signature': signature,
      'x-time': time,
      'x-csrf-token': csrf.token,
      cookie: `htv_csrf_proof=${csrf.proof}`,
    },
    cache: 'no-store',
  })
}

/* --- handshake --- */

const SEAL_KEY = createHash('sha256').update('htv-insecure-handshake-v1').digest()
const SEAL_AAD = Buffer.from('htv-insecure-v1')

function seal(payload: unknown) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', SEAL_KEY, iv)
  cipher.setAAD(SEAL_AAD)
  const data = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()])
  const envelope = { v: 1, alg: 'AES-256-GCM', iv: b64u(iv), tag: b64u(cipher.getAuthTag()), data: b64u(data) }
  return b64u(Buffer.from(JSON.stringify(envelope)))
}

function open(token: string) {
  const env = JSON.parse(unb64u(token).toString()) as { iv: string; tag: string; data: string }
  const decipher = createDecipheriv('aes-256-gcm', SEAL_KEY, unb64u(env.iv))
  decipher.setAAD(SEAL_AAD)
  decipher.setAuthTag(unb64u(env.tag))
  return JSON.parse(Buffer.concat([decipher.update(unb64u(env.data)), decipher.final()]).toString()) as {
    sources?: { src?: string; height?: number; label?: string; mime_type?: string }[]
  }
}

export type HanimeSource = { url: string; height: number; label: string }

export async function getSources(slug: string): Promise<HanimeSource[]> {
  const token = seal({ timestamp_unix: Math.floor(Date.now() / 1000), directive: 'htv_player_handshake', slug })
  const res = await signedFetch('https://auth.hanime.tv/api/v11/handshake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new Error(`handshake ${res.status}`)
  const reply = res.headers.get('x-token')
  if (!reply) throw new Error('handshake yanıtı boş')
  const sources = (open(reply).sources ?? [])
    .filter((s): s is { src: string; height: number; label?: string } => Boolean(s.src))
    .map((s) => ({ url: s.src, height: s.height ?? 0, label: s.label ?? `${s.height ?? 0}p` }))
    .sort((a, b) => b.height - a.height)
  if (!sources.length) throw new Error('kaynak yok')
  return sources
}