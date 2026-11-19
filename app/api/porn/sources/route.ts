import { resolveSources } from '@/lib/eporner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!/^[A-Za-z0-9]+$/.test(id)) return Response.json({ sources: [] }, { status: 400 })
  try {
    const sources = await resolveSources(id)
    return Response.json({ sources })
  } catch (err) {
    return Response.json({ sources: [], error: err instanceof Error ? err.message : 'hata' }, { status: 502 })
  }
}