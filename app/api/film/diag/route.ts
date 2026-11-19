export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (host: string, slug: string) => {
  try {
    const r = await fetch('https://' + host + '/' + slug + '/', {
      headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'tr,en;q=0.9', Referer: 'https://' + host + '/' },
      cache: 'no-store',
    })
    const b = await r.text()
    return {
      host,
      status: r.status,
      len: b.length,
      blocked: /Erisime Kapali|Erişime Kapalı/i.test(b),
      iframes: [...new Set([...b.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 8),
      dataSrc: [...new Set([...b.matchAll(/data-(?:src|video|url)="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 8),
      tabs: [...new Set([...b.matchAll(/class="([^"]*(?:dublaj|altyazi|player|tab)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 8),
      hasDub: /dublaj/i.test(b),
      hasAlt: /altyaz/i.test(b),
    }
  } catch (e) {
    return { host, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get('slug') || 'other-mommy-2026').trim()
  const out = []
  for (const host of ['hdfilmcehennemini.com', 'www.hdfilmcehennemi.land', 'hdfilmcehennemi4.co', 'cfilmizle.com', 'hdfilmcehennemiv6.com']) {
    out.push(await scan(host, slug))
  }
  return Response.json(out)
}