export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'tr,en;q=0.9', Referer: 'https://hdfilmcehennemini.com/' }

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') || 'the other mommy').trim()
  const out: Record<string, unknown> = {}

  try {
    const s = await fetch('https://hdfilmcehennemini.com/search/' + encodeURIComponent(q) + '/', { headers: H, cache: 'no-store' })
    const html = await s.text()
    const links = [...new Set([...html.matchAll(/href="(https:\/\/hdfilmcehennemini\.com\/[^"]+)"/g)].map((m) => m[1]))]
      .filter((h) => !/\/search\/|\/category\/|\/page\/|wp-|feed|\/tag\//.test(h))
    out.search = { status: s.status, len: html.length, count: links.length, links: links.slice(0, 6) }
    if (!links.length) return Response.json(out)

    const pageUrl = links[0]
    const pg = await fetch(pageUrl, { headers: H, cache: 'no-store' })
    const body = await pg.text()
    out.page = {
      status: pg.status,
      len: body.length,
      pageUrl,
      iframes: [...new Set([...body.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 6),
      tabs: [...new Set([...body.matchAll(/class="[^"]*(?:dublaj|altyazi|player|tab)[^"]*"/gi)].map((m) => m[0]))].slice(0, 8),
      hasAlt: /altyaz/i.test(body),
      hasDub: /dublaj/i.test(body),
      snippet: body.replace(/\s+/g, ' ').slice(0, 200),
    }
  } catch (e) {
    out.error = e instanceof Error ? e.message : 'hata'
  }
  return Response.json(out)
}