export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (label: string, url: string) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store' })
    const b = await r.text()
    return { label, status: r.status, len: b.length, json: b.trim().startsWith('{') || b.trim().startsWith('['), head: b.slice(0, 120) }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  return Response.json([
    await scan('nh-search', 'https://nhentai.net/api/v2/search?query=dragon%20girl&page=1'),
    await scan('nh-gallery', 'https://nhentai.net/api/gallery/1'),
    await scan('eh-api', 'https://api.e-hentai.org/api.php'),
  ])
}