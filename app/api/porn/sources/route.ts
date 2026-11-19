import { resolveSourcesByTitle } from '@/lib/xhamster'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const title = (sp.get('t') || '').trim()
  if (title.length < 2) return Response.json({ sources: [] }, { status: 400 })
  try {
    return Response.json({ sources: await resolveSourcesByTitle(title) })
  } catch (err) {
    return Response.json({ sources: [], error: err instanceof Error ? err.message : 'hata' }, { status: 502 })
  }
}