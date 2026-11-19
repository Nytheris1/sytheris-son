export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'tr,en;q=0.9', Referer: 'https://www.hdfilmcehennemi.nl/' }

export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get('slug') || 'other-mommy-2026').trim()
  const out: Record<string, unknown> = {}
  try {
    const r = await fetch('https://www.hdfilmcehennemi.nl/' + slug + '/', { headers: H, cache: 'no-store' })
    const b = await r.text()
    out.page = {
      status: r.status,
      len: b.length,
      cf: /just a moment|challenge-platform/i.test(b),
      iframes: [...new Set([...b.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 10),
      dataAttrs: [...new Set([...b.matchAll(/data-(?:src|video|url|player)="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 10),
      tabs: [...new Set([...b.matchAll(/class="([^"]*(?:dublaj|altyazi|player|tab|source)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 10),
      hasDub: /dublaj/i.test(b),
      hasAlt: /altyaz/i.test(b),
      snippet: b.replace(/\s+/g, ' ').slice(0, 260),
    }
  } catch (e) {
    out.error = e instanceof Error ? e.message : 'hata'
  }
  return Response.json(out)
}