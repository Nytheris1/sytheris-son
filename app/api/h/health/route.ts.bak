import { getSigner, getCsrf } from '@/lib/hanime/signer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const out: Record<string, unknown> = {}
  try {
    const signer = await getSigner()
    out.signer = /^[0-9a-f]{64}$/.test(signer.sign().signature) ? 'ok' : 'boş imza'
  } catch (err) {
    out.signer = err instanceof Error ? err.message : 'hata'
  }
  try {
    out.csrf = (await getCsrf()).token ? 'ok' : 'boş'
  } catch (err) {
    out.csrf = err instanceof Error ? err.message : 'hata'
  }
  return Response.json(out)
}