import { resolveSourcesByTitle } from '@/lib/xnxx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: Request) {
  const t = (new URL(req.url).searchParams.get('t') || '').trim()
  if (!t) return Response.json({ error: 't yok' })
  try {
    const sources = await resolveSourcesByTitle(t)
    return Response.json({ count: sources.length, sources })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'hata' })
  }
}