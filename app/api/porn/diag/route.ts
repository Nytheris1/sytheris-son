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

const ids = async (url: string) => {
  try {
    const r = await fetch(url, { headers: H, cache: 'no-store' })
    const b = await r.text()
    const list = [...b.matchAll(/href="\/video-([a-z0-9]+)\//g)].map((m) => m[1])
    const uniq = [...new Set(list)]
    const dur = b.match(/class="[^"]*duration[^"]*"[^>]*>([^<]+)</)
    const durAny = [...b.matchAll(/(\d+)\s*min/g)].slice(0, 3).map((m) => m[0])
    return { url, status: r.status, len: b.length, count: uniq.length, head: uniq.slice(0, 2), durSample: dur ? dur[1] : null, durAny }
  } catch (e) {
    return { url, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const id = sp.get('id')
  if (id) {
    const r = await fetch('https://www.xnxx.com/video-' + id, { headers: H, cache: 'no-store' })
    const b = await r.text()
    return Response.json({
      status: r.status,
      len: b.length,
      hls: /setVideoHLS\('([^']+)'\)/.test(b),
      high: /setVideoUrlHigh\('([^']+)'\)/.test(b),
      low: /setVideoUrlLow\('([^']+)'\)/.test(b),
    })
  }
  const out = []
  for (const u of [
    'https://www.xnxx.com/best/1',
    'https://www.xnxx.com/best/2',
    'https://www.xnxx.com/best/3',
    'https://www.xnxx.com/best?p=2',
    'https://www.xnxx.com/search/orgazm/2',
    'https://www.xnxx.com/best/tur/1',
  ]) out.push(await ids(u))
  return Response.json(out)
}