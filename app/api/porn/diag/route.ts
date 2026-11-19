import { searchPorn } from '@/lib/xnxx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const q = sp.get('q') || ''
  try {
    const r = await searchPorn(q, 1)
    return Response.json({ count: r.items.length, first: r.items.slice(0, 3) })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'hata' })
  }
}