export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Sytheris/1.0 (manga reader)'
const H = { 'User-Agent': UA, Accept: 'application/json' }

export async function GET() {
  const out: Record<string, unknown> = {}
  const variants: [string, string][] = [
    ['full', 'https://api.mangadex.org/manga?translatedLanguage%5B%5D=tr&includes%5B%5D=cover_art&hasAvailableChapters=true&order%5BfollowedCount%5D=desc&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&contentRating%5B%5D=pornographic&limit=3'],
    ['nolang', 'https://api.mangadex.org/manga?limit=3&includes%5B%5D=cover_art'],
    ['plain', 'https://api.mangadex.org/manga?limit=3'],
  ]
  for (const [label, url] of variants) {
    try {
      const r = await fetch(url, { headers: H, cache: 'no-store' })
      const b = await r.text()
      out[label] = { status: r.status, body: b.slice(0, 200) }
    } catch (e) {
      out[label] = { error: e instanceof Error ? e.message : 'hata' }
    }
  }
  return Response.json(out)
}