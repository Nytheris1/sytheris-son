export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr,en;q=0.9',
  Referer: 'https://www.xnxx.com/',
}

const scan = async (url: string) => {
  try {
    const r = await fetch(url, { headers: H, cache: 'no-store' })
    const b = await r.text()
    return {
      url,
      status: r.status,
      len: b.length,
      blocks: (b.match(/thumb-block/g) || []).length,
      links: (b.match(/\/video-[a-z0-9]+/gi) || []).length,
      first: [...b.matchAll(/href="([^"]*\/video-[^"]*)"/g)].map((m) => m[1]).slice(0, 4),
      classes: [...new Set([...b.matchAll(/class="([a-z-]*(?:thumb|mozaique|video)[a-z-]*)"/gi)].map((m) => m[1]))].slice(0, 12),
      snippet: b.replace(/\s+/g, ' ').slice(0, 260),
    }
  } catch (e) {
    return { url, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  const out = []
  for (const u of ['https://www.xnxx.com/', 'https://www.xnxx.com/best', 'https://www.xnxx.com/best/1', 'https://www.xnxx.com/best/2']) {
    out.push(await scan(u))
  }
  return Response.json(out)
}