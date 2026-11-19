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

export async function GET(req: Request) {
  const t = (new URL(req.url).searchParams.get('t') || '').trim()
  if (!t) return Response.json({ error: 't yok' })

  const out: Record<string, unknown> = {}
  try {
    const s = await fetch('https://www.xnxx.com/search/' + encodeURIComponent(t), { headers: H, cache: 'no-store' })
    const html = await s.text()
    const links = [...html.matchAll(/href="(\/video-[^"]+)"/g)].map((m) => m[1])
    out.search = { status: s.status, len: html.length, links: links.slice(0, 5) }
    if (!links.length) return Response.json(out)

    const pageUrl = 'https://www.xnxx.com' + links[0]
    const p = await fetch(pageUrl, { headers: H, cache: 'no-store' })
    const body = await p.text()
    const mp4 = [...body.matchAll(/https:\/\/[^"'\s\\]+\.mp4[^"'\s\\]*/g)].map((m) => m[0])
    out.page = {
      status: p.status,
      len: body.length,
      pageUrl,
      mp4Count: mp4.length,
      mp4: [...new Set(mp4)].slice(0, 4),
      hasHigh: body.includes('video_high'),
      hasHls: body.includes('setVideoHLS'),
    }
  } catch (e) {
    out.error = e instanceof Error ? e.message : 'hata'
  }
  return Response.json(out)
}