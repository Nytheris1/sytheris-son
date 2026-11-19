import { resolveSources } from '@/lib/xnxx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const id = (sp.get('id') || '').trim()
  if (!/^[a-z0-9]+$/i.test(id)) return Response.json({ sources: [] }, { status: 400 })
  try {
    return Response.json({ sources: await resolveSources(id) })
  } catch (err) {
    return Response.json({ sources: [], error: err instanceof Error ? err.message : 'hata' }, { status: 502 })
  }
}