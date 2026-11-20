export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (label: string, url: string) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store' })
    const b = await r.text()
    return { label, status: r.status, len: b.length, head: b.slice(0, 160) }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  return Response.json([
    await scan('nh2-gallery', 'https://nhentai.net/api/v2/gallery/698296'),
    await scan('nh2-gallery-2', 'https://nhentai.net/api/v2/galleries/698296'),
    await scan('nh2-search', 'https://nhentai.net/api/v2/search?query=yuri&page=1'),
  ])
}