import { getSigner, getCsrf, getSources } from '@/lib/hanime/signer'
import { proxyUrl, UPSTREAM_HEADERS, relayUrl, decodeRelay } from '@/lib/hanime/relay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const out: Record<string, unknown> = {}
  out.worker = process.env.HANIME_WORKER_URL || 'YOK'
  try {
    const signer = await getSigner()
    out.signer = /^[0-9a-f]{64}$/.test(signer.sign().signature) ? 'ok' : 'boş imza'
  } catch (err) {
    const e = err as { message?: string; stack?: string }
    out.signer = ((e && e.message) || String(err)) + ' | ' + ((e && e.stack) || '').split('\n').slice(0, 3).join(' ~ ').slice(0, 300)
  }
  try {
    out.csrf = (await getCsrf()).token ? 'ok' : 'boş'
  } catch (err) {
    out.csrf = err instanceof Error ? err.message : 'hata'
  }
  const bases = [
    process.env.HANIME_AUTH_BASE || 'https://auth.hanime.tv',
    'https://guest.freeanimehentai.net',
    'https://hanime.tv',
  ]
  const hs: string[] = []
  for (const b of bases) {
    try {
      const s = await getSources('yabai-fukushuu-yami-site-2', b)
      hs.push(b + ' = OK (' + s.length + ' kaynak)')
      break
    } catch (err) {
      const e = err as { message?: string }
      hs.push(b + ' = ' + (e && e.message ? e.message : String(err)).slice(0, 80))
    }
  }
  out.handshake = hs
  try {
    const list = await getSources('yabai-fukushuu-yami-site-2')
    const abs = list[0].url
    const pl = await fetch(proxyUrl(abs), { headers: UPSTREAM_HEADERS })
    const text = await pl.text()
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

    const keyUri = /URI="([^"]+)"/.exec(text)?.[1]
    const segLine = lines.find((l) => !l.startsWith('#'))
    out.chain = { playlist: pl.status, ctype: pl.headers.get('content-type'), lines: lines.length }
    const rl = relayUrl(abs)
    const u2 = new URL('https://x' + rl).searchParams.get('u') || ''
    out.relay = { src: abs.slice(0, 70), len: u2.length, back: String(decodeRelay(u2)).slice(0, 70) }

    if (keyUri) {
      const keyAbs = new URL(keyUri, abs).toString()
      const k = await fetch(proxyUrl(keyAbs), { headers: UPSTREAM_HEADERS })
      const kb = await k.arrayBuffer()
      out.key = { host: new URL(keyAbs).host, status: k.status, bytes: kb.byteLength }
    }

    if (segLine) {
      const segAbs = new URL(segLine, abs).toString()
      const s = await fetch(proxyUrl(segAbs), { headers: UPSTREAM_HEADERS })
      const sb = await s.arrayBuffer()
      out.seg = { host: new URL(segAbs).host, status: s.status, bytes: sb.byteLength }
    }
  } catch (err) {
    const e = err as { message?: string }
    out.chain = (e && e.message) || String(err)
  }
  return Response.json(out)
}