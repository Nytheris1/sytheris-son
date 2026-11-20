import { resolveSources, type Src } from '@/lib/porn'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const out: Record<string, unknown> = {}
  for (const [src, path] of [
    ['ph', '/view_video.php?viewkey=6a0ca93102062'],
    ['xv', '/video.omtackvb341/bet_on_the_red_head_milf'],
  ] as [Src, string][]) {
    try {
      const list = await resolveSources(src, path)
      out[src] = { count: list.length, first: list.slice(0, 3).map((l) => l.label + ' | ' + l.url.slice(0, 70)) }
    } catch (e) {
      out[src] = { error: e instanceof Error ? e.message : 'hata' }
    }
  }
  return Response.json(out)
}