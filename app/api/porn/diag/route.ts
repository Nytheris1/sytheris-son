export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'tr,en;q=0.9',
}

export async function GET(req: Request) {
  const t = (new URL(req.url).searchParams.get('t') || '').trim()
  if (!t) return Response.json({ error: 't yok' })
  const out: Record<string, unknown> = {}

  try {
    const s = await fetch('https://www.xnxx.com/search/' + encodeURIComponent(t), {
      headers: { ...H, Referer: 'https://www.xnxx.com/' },
      cache: 'no-store',
    })
    const html = await s.text()
    const all = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    out.xnxx = {
      status: s.status,
      len: html.length,
      hrefTotal: all.length,
      videoHrefs: all.filter((h) => /video/i.test(h)).slice(0, 6),
      snippet: html.replace(/\s+/g, ' ').slice(0, 300),
    }
  } catch (e) {
    out.xnxx = { error: e instanceof Error ? e.message : 'hata' }
  }

  try {
    const a = await fetch('https://www.pornhub.com/webmasters/search?search=' + encodeURIComponent(t), {
      headers: { ...H, Referer: 'https://www.pornhub.com/' },
      cache: 'no-store',
    })
    const j = (await a.json()) as { videos?: { url?: string; title?: string; duration?: string }[] }
    const first = j.videos?.[0]
    out.ph = { status: a.status, count: j.videos?.length ?? 0, first: first ? { url: first.url, title: first.title } : null }

    if (first?.url) {
      const p = await fetch(first.url, { headers: { ...H, Referer: 'https://www.pornhub.com/' }, cache: 'no-store' })
      const body = await p.text()
      const mp4 = [...new Set([...body.matchAll(/https:\/\/[^"'\s\\]+\.mp4[^"'\s\\]*/g)].map((m) => m[0]))]
      out.phPage = { status: p.status, len: body.length, mp4Count: mp4.length, mp4: mp4.slice(0, 3), flashvars: body.includes('flashvars') }
    }
  } catch (e) {
    out.ph = { error: e instanceof Error ? e.message : 'hata' }
  }

  return Response.json(out)
}