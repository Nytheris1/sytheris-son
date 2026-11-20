import { listDoujin, listChaptersAll } from '@/lib/mangadex'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const out: Record<string, unknown> = {}
  try {
    const list = await listDoujin(1)
    out.count = list.items.length
    out.first = list.items.slice(0, 2).map((m) => ({ id: m.id, title: m.title }))
    if (list.items[0]) {
      const ch = await listChaptersAll(list.items[0].id)
      out.chapters = ch.length
      out.sample = ch.slice(0, 3)
    }
  } catch (e) {
    out.error = e instanceof Error ? e.message : 'hata'
  }
  return Response.json(out)
}