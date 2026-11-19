const ORIGIN = 'https://hanime.tv'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const enc = new TextEncoder()
const dec = new TextDecoder()

const ALLOWED = [
  /^([a-z0-9-]+\.)*hanime\.tv$/,
  /^([a-z0-9-]+\.)*htv-services\.com$/,
  /^([a-z0-9-]+\.)*htv-tsukuyomi\.com$/,
  /^([a-z0-9-]+\.)*hanime-cdn\.com$/,
]
const allowedUrl = (t) => {
  try {
    const x = new URL(t)
    return x.protocol === 'https:' && ALLOWED.some((r) => r.test(x.hostname))
  } catch {
    return false
  }
}

const b64u = (buf) => {
  const b = new Uint8Array(buf)
  let s = ''
  for (const x of b) s += String.fromCharCode(x)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

let SECRET = 'dev'
let signerPromise = null

async function hmac(url) {
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(url))).slice(0, 22)
}

async function relayUrl(url, origin) {
  return origin + '/relay?u=' + b64u(enc.encode(url)) + '&s=' + (await hmac(url))
}

async function sealKey() {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('htv-insecure-handshake-v1'))
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}
const AAD = enc.encode('htv-insecure-v1')

async function seal(payload) {
  const key = await sealKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const buf = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, key, enc.encode(JSON.stringify(payload))),
  )
  const data = buf.slice(0, buf.length - 16)
  const tag = buf.slice(buf.length - 16)
  return b64u(enc.encode(JSON.stringify({ v: 1, alg: 'AES-GCM', iv: b64u(iv), tag: b64u(tag), data: b64u(data) })))
}

async function open(token) {
  const env = JSON.parse(dec.decode(unb64u(token)))
  const key = await sealKey()
  const data = unb64u(env.data)
  const tag = unb64u(env.tag)
  const joined = new Uint8Array(data.length + tag.length)
  joined.set(data)
  joined.set(tag, data.length)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(env.iv), additionalData: AAD }, key, joined)
  return JSON.parse(dec.decode(plain))
}

async function buildSigner() {
  const page = await fetch(ORIGIN + '/', { headers: { 'User-Agent': UA, Accept: 'text/html' } })
  const html = await page.text()
  const found = html.match(/https:\/\/hanime-cdn\.com\/js\/vendor\.[a-z0-9]+\.min\.js/i)
  if (!found) throw new Error('vendor yok (' + page.status + ')')
  const code = await (await fetch(found[0], { headers: { 'User-Agent': UA, Referer: ORIGIN + '/' } })).text()

  const listeners = new Map()
  const win = {}
  win.window = win
  win.self = win
  win.top = win
  win.parent = win
  win.location = { origin: ORIGIN, href: ORIGIN + '/', hostname: 'hanime.tv' }
  win.document = {
    currentScript: { src: found[0] },
    location: win.location,
    createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {} }),
    addEventListener() {},
    head: { appendChild() {} },
    body: { appendChild() {} },
    querySelector: () => null,
  }
  win.navigator = { userAgent: UA, language: 'en-US' }
  win.addEventListener = (ev, fn) => {
    const l = listeners.get(ev) || []
    l.push(fn)
    listeners.set(ev, l)
  }
  win.removeEventListener = () => {}
  win.dispatchEvent = (e) => {
    for (const fn of listeners.get(e && e.type ? e.type : '') || []) {
      try {
        fn(e)
      } catch {
        // dinleyici hatasi
      }
    }
    return true
  }
  win.performance = { now: () => Date.now() }
  win.console = console
  win.CustomEvent = class {
    constructor(type, init) {
      this.type = type
      this.detail = init && init.detail
    }
  }
  win.Event = win.CustomEvent
  win.Module = {}

  const runner = new Function(
    'window','self','document','navigator','location','Module','performance','console',
    'setTimeout','clearTimeout','atob','btoa','crypto','Uint8Array','WebAssembly','TextDecoder','TextEncoder',
    code,
  )
  runner(
    win, win, win.document, win.navigator, win.location, win.Module, win.performance, console,
    setTimeout, clearTimeout, atob, btoa, crypto, Uint8Array, WebAssembly, TextDecoder, TextEncoder,
  )

  const sign = () => {
    win.ssignature = ''
    win.stime = ''
    win.dispatchEvent({ type: 'e', detail: {} })
    return { signature: String(win.ssignature || ''), time: String(win.stime || '') }
  }

  for (let i = 0; i < 60; i++) {
    const p = sign()
    if (/^[0-9a-f]{64}$/.test(p.signature) && p.time) return { sign }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('imzalayici hazir olmadi')
}

function getSigner() {
  signerPromise = signerPromise || buildSigner()
  return signerPromise
}

async function csrf() {
  const res = await fetch('https://ct.hanime.tv/csrf-token', {
    headers: { 'User-Agent': UA, Origin: ORIGIN, Referer: ORIGIN + '/' },
  })
  const text = await res.text()
  let token = ''
  try {
    const j = JSON.parse(text)
    token = j.token || j.csrf_token || ''
  } catch {
    token = text.trim().replace(/^"|"$/g, '')
  }
  const proof = /htv_csrf_proof=([^;]+)/.exec(res.headers.get('set-cookie') || '')
  if (!token || !proof) throw new Error('csrf yok')
  return { token, proof: proof[1] }
}

async function signedFetch(url, init) {
  const { sign } = await getSigner()
  const { signature, time } = sign()
  const c = await csrf()
  const headers = new Headers((init && init.headers) || {})
  headers.set('User-Agent', UA)
  headers.set('Origin', ORIGIN)
  headers.set('Referer', ORIGIN + '/')
  headers.set('x-signature-version', 'web2')
  headers.set('x-signature', signature)
  headers.set('x-time', time)
  headers.set('x-csrf-token', c.token)
  headers.set('cookie', 'htv_csrf_proof=' + c.proof)
  return fetch(url, { ...(init || {}), headers })
}

async function getSources(slug, origin) {
  const token = await seal({ timestamp_unix: Math.floor(Date.now() / 1000), directive: 'htv_player_handshake', slug })
  const res = await signedFetch('https://auth.hanime.tv/api/v11/handshake', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new Error('handshake ' + res.status + ' ' + (await res.text()).slice(0, 90))
  const reply = res.headers.get('x-token')
  if (!reply) throw new Error('token yok')
  const data = await open(reply)
  const list = (data.sources || [])
    .filter((s) => s.src)
    .map((s) => ({ height: s.height || 0, label: s.label || (s.height || 0) + 'p', src: s.src }))
    .sort((a, b) => b.height - a.height)
  if (!list.length) throw new Error('kaynak yok')

  const out = []
  for (const s of list) out.push({ height: s.height, label: s.label, url: await relayUrl(s.src, origin) })
  return out
}

async function rewrite(text, base, origin) {
  const out = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (!t) {
      out.push(line)
      continue
    }
    if (t.startsWith('#')) {
      let replaced = line
      for (const m of [...t.matchAll(/URI="([^"]+)"/g)]) {
        const abs = new URL(m[1], base).toString()
        replaced = replaced.replace('URI="' + m[1] + '"', 'URI="' + (await relayUrl(abs, origin)) + '"')
      }
      out.push(replaced)
      continue
    }
    out.push(await relayUrl(new URL(t, base).toString(), origin))
  }
  return out.join('\n')
}

async function handle(req) {
    SECRET = globalThis.RELAY_SECRET || 'dev'
    const url = new URL(req.url)
    const cors = { 'Access-Control-Allow-Origin': '*' }
    const origin = url.origin

    if (url.pathname === '/health') {
      try {
        const { sign } = await getSigner()
        return Response.json({ signer: /^[0-9a-f]{64}$/.test(sign().signature) ? 'ok' : 'bos' }, { headers: cors })
      } catch (err) {
        return Response.json({ signer: String(err.message || err) }, { headers: cors })
      }
    }

    if (url.pathname === '/api/h/sources') {
      const slug = url.searchParams.get('slug') || ''
      if (!/^[a-z0-9-]{2,120}$/.test(slug)) return Response.json({ error: 'slug' }, { status: 400, headers: cors })
      try {
        return Response.json({ sources: await getSources(slug, origin) }, { headers: cors })
      } catch (err) {
        return Response.json({ error: String(err.message || err) }, { status: 502, headers: cors })
      }
    }

    if (url.pathname === '/relay') {
      const u = url.searchParams.get('u') || ''
      const s = url.searchParams.get('s') || ''
      let target = ''
      try {
        target = dec.decode(unb64u(u))
      } catch {
        return new Response('u', { status: 400, headers: cors })
      }
      if (!allowedUrl(target)) return new Response('host', { status: 400, headers: cors })

      const range = req.headers.get('range')
      const headers = { 'User-Agent': UA, Referer: ORIGIN + '/', Origin: ORIGIN }
      if (range) headers.Range = range
      const up = await fetch(target, { headers })
      if (!up.ok && up.status !== 206) return new Response('upstream ' + up.status, { status: 502, headers: cors })

      const isPlaylist = /\.m3u8($|\?)/.test(target) || (up.headers.get('content-type') || '').includes('mpegurl')
      if (isPlaylist) {
        const body = await rewrite(await up.text(), target, origin)
        return new Response(body, {
          headers: { ...cors, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' },
        })
      }

      const out = { ...cors, 'Content-Type': 'video/mp2t', 'Accept-Ranges': 'bytes' }
      const len = up.headers.get('content-length')
      const cr = up.headers.get('content-range')
      if (len) out['Content-Length'] = len
      if (cr) out['Content-Range'] = cr
      return new Response(up.body, { status: up.status, headers: out })
    }

    if (url.pathname === '/vendor-peek') {
      const page = await fetch(ORIGIN + '/', { headers: { 'User-Agent': UA } })
      const html = await page.text()
      const m = html.match(/https:\/\/hanime-cdn\.com\/js\/vendor\.[a-z0-9]+\.min\.js/i)
      if (!m) return new Response('vendor yok', { headers: cors })
      const code = await (await fetch(m[0], { headers: { 'User-Agent': UA, Referer: ORIGIN + '/' } })).text()
      const i = code.indexOf('ssignature')
      return new Response(
        JSON.stringify({ len: code.length, url: m[0], at: i, around: i > 0 ? code.slice(Math.max(0, i - 900), i + 900) : code.slice(0, 1800) }),
        { headers: { ...cors, 'content-type': 'application/json' } },
      )
    }

    if (url.pathname === '/proxy') {
      const u = url.searchParams.get('u') || ''
      const s = url.searchParams.get('s') || ''
      let target = ''
      try {
        target = dec.decode(unb64u(u))
      } catch {
        return new Response('u', { status: 400, headers: cors })
      }
      if (!allowedUrl(target)) return new Response('host', { status: 400, headers: cors })

      const skip = ['host','cf-connecting-ip','cf-ray','cf-ipcountry','cf-visitor','x-forwarded-proto','x-forwarded-for','accept-encoding','connection']
      const fwd = new Headers()
      for (const [k, v] of req.headers) if (!skip.includes(k.toLowerCase())) fwd.set(k, v)

      fwd.set('accept-encoding', 'identity')
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer()
      const up = await fetch(target, { method: req.method, headers: fwd, body, redirect: 'follow' })

      const out = new Headers(cors)
      out.set('access-control-expose-headers', 'x-token')
      for (const k of ['content-type','x-token','content-length','content-range','accept-ranges']) {
        const v = up.headers.get(k)
        if (v) out.set(k, v)
      }
      const cookies = up.headers.getSetCookie ? up.headers.getSetCookie() : []
      for (const ck of cookies) out.append('set-cookie', ck)
      return new Response(up.body, { status: up.status, headers: out })
    }

    return new Response('yok', { status: 404, headers: cors })
}

addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request))
})