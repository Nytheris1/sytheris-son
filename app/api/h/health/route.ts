import { getSigner, getCsrf } from '@/lib/hanime/signer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const out: Record<string, unknown> = {}
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
  return Response.json(out)
}