import { resolveSourcesByTitle } from '@/lib/xhamster'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function GET(req: Request) {
  const t = (new URL(req.url).searchParams.get('t') || '').trim()
  if (!t) return Response.json({ error: 't yok' })

  const url = 'https://xhamster.com/search/' + encodeURIComponent(t)
  let status = 0
  let len = 0
  let hrefs: string[] = []
  let initials = false
  let snippet = ''
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr,en;q=0.9',
        Referer: 'https://xhamster.com/',
      },
      cache: 'no-store',
    })
    status = res.status
    const html = await res.text()
    len = html.length
    initials = html.includes('window.initials')
    hrefs = [...html.matchAll(/href="([^"]*\/videos\/[^"]*)"/g)].map((m) => m[1]).slice(0, 5)
    snippet = html.replace(/\s+/g, ' ').slice(0, 400)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'hata', url })
  }

  let resolved: unknown = null
  try {
    resolved = await resolveSourcesByTitle(t)
  } catch (e) {
    resolved = { hata: e instanceof Error ? e.message : 'hata' }
  }

  return Response.json({ status, len, initials, hrefCount: hrefs.length, hrefs, snippet, resolved })
}