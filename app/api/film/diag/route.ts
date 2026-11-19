export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, Accept: 'application/json,text/html', 'Accept-Language': 'tr,en;q=0.9', Referer: 'https://hdfilmcehennemini.com/' }

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') || 'the other mommy').trim()
  const out: Record<string, unknown> = {}

  for (const path of ['/wp-json/wp/v2/search?search=', '/wp-json/wp/v2/posts?search=']) {
    try {
      const r = await fetch('https://hdfilmcehennemini.com' + path + encodeURIComponent(q) + '&per_page=5', { headers: H, cache: 'no-store' })
      const text = await r.text()
      let parsed: unknown = text.slice(0, 400)
      try {
        const j = JSON.parse(text) as Record<string, unknown>[]
        parsed = j.slice(0, 5).map((x) => ({ id: x.id, title: x.title, url: x.url, link: x.link }))
      } catch {
        /* html dondu */
      }
      out[path] = { status: r.status, len: text.length, body: parsed }
    } catch (e) {
      out[path] = { error: e instanceof Error ? e.message : 'hata' }
    }
  }

  const first = (() => {
    const s = out['/wp-json/wp/v2/search?search='] as { body?: { url?: string }[] } | undefined
    return s?.body?.[0]?.url
  })()

  if (first) {
    try {
      const pg = await fetch(first, { headers: { ...H, Accept: 'text/html' }, cache: 'no-store' })
      const body = await pg.text()
      out.page = {
        status: pg.status,
        len: body.length,
        iframes: [...new Set([...body.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 8),
        playerish: [...new Set([...body.matchAll(/(?:data-(?:src|video|player)|class="[^"]*(?:player|dublaj|altyazi)[^"]*")="?([^">]*)/gi)].map((m) => m[0]))].slice(0, 10),
        hasDub: /dublaj/i.test(body),
        hasAlt: /altyaz/i.test(body),
      }
    } catch (e) {
      out.page = { error: e instanceof Error ? e.message : 'hata' }
    }
  }

  return Response.json(out)
}