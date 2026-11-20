export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UA = 'Sytheris/1.0 (manga reader)'
const H = { 'User-Agent': UA, Accept: 'application/json' }

export async function GET() {
  const out: Record<string, unknown> = {}
  const t = await fetch('https://api.mangadex.org/manga/tag', { headers: H, cache: 'no-store' })
  out.tagStatus = t.status
  const tb = await t.text()
  out.tagLen = tb.length
  out.hasDoujinshiName = /"en"\s*:\s*"Doujinshi"/.test(tb)
  const m = tb.match(/"id":"([0-9a-f-]{36})"[\s\S]{0,400}?"en":"Doujinshi"/)
  out.tagId = m ? m[1] : ''

  if (m) {
    const p = new URLSearchParams()
    p.append('includedTags[]', m[1])
    p.append('includes[]', 'cover_art')
    p.append('hasAvailableChapters', 'true')
    p.append('order[followedCount]', 'desc')
    p.append('contentRating[]', 'pornographic')
    p.set('limit', '5')
    const r = await fetch('https://api.mangadex.org/manga?' + p.toString(), { headers: H, cache: 'no-store' })
    const b = await r.text()
    out.listStatus = r.status
    out.listLen = b.length
    out.titles = [...b.matchAll(/"title":\{"en":"([^"]+)"/g)].map((x) => x[1]).slice(0, 3)
  }
  return Response.json(out)
}