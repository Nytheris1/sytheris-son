import { getSigner, getCsrf, getSources } from '@/lib/hanime/signer'

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
  return Response.json(out)
}