export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UA = 'Sytheris/1.0 (manga reader)'
const H = { 'User-Agent': UA, Accept: 'application/json' }

export async function GET() {
  const out: Record<string, unknown> = {}
  const t = await fetch('https://api.mangadex.org/manga/tag', { headers: H, cache: 'no-store' })
  const tb = await t.text()
  const j = JSON.parse(tb) as { data?: { id: string; attributes?: { name?: Record<string, string> } }[] }
  const hit = (j.data || []).find((x) => (x.attributes?.name?.en || '').trim().toLowerCase() === 'doujinshi')
  out.tagId = hit?.id || ''
  out.tagName = hit?.attributes?.name?.en || ''

  if (hit) {
    const p = new URLSearchParams()
    p.append('includedTags[]', hit.id)
    p.append('includes[]', 'cover_art')
    p.append('hasAvailableChapters', 'true')
    p.append('contentRating[]', 'pornographic')
    p.set('limit', '5')
    const r = await fetch('https://api.mangadex.org/manga?' + p.toString(), { headers: H, cache: 'no-store' })
    const b = await r.text()
    out.listStatus = r.status
    out.sample = [...b.matchAll(/"en":"([^"]{3,60})"/g)].map((x) => x[1]).slice(0, 6)
  }
  return Response.json(out)
}