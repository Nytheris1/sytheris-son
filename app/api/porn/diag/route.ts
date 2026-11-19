export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, Accept: 'text/html', Referer: 'https://www.xnxx.com/' }

const head = async (url: string) => {
  try {
    const r = await fetch(url, { headers: H, cache: 'no-store' })
    const b = await r.text()
    const list = [...new Set([...b.matchAll(/href="\/video-([a-z0-9]+)\//g)].map((m) => m[1]))]
    return { url, status: r.status, count: list.length, head: list.slice(0, 2) }
  } catch (e) {
    return { url, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  const out = []
  for (const u of [
    'https://www.xnxx.com/new/1',
    'https://www.xnxx.com/new/2',
    'https://www.xnxx.com/hot/1',
    'https://www.xnxx.com/hot/2',
    'https://www.xnxx.com/search/orgazm/1',
    'https://www.xnxx.com/search/orgazm/2',
    'https://www.xnxx.com/search/orgazm/3',
    'https://www.xnxx.com/best/2026-10/1',
    'https://www.xnxx.com/best/2026-10/2',
  ]) out.push(await head(u))
  return Response.json(out)
}