export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const KEY = (process.env.TMDB_API_KEY || '').trim()

const scan = async (label: string, url: string, headers: Record<string, string>) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, cache: 'no-store' })
    const b = await r.text()
    return {
      label,
      status: r.status,
      len: b.length,
      cf: /just a moment|cf-challenge|challenge-platform/i.test(b),
      iframe: [...new Set([...b.matchAll(/<iframe[^>]+src="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 4),
      links: [...new Set([...b.matchAll(/href="([^"]*(?:film|dublaj|izle)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 6),
    }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get('q') || 'the other mommy').trim()
  const out: unknown[] = []

  if (KEY) {
    const auth: Record<string, string> = KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + KEY } : {}
    const u = 'https://api.themoviedb.org/3/search/movie?query=' + encodeURIComponent(q) + '&language=tr-TR' + (KEY.startsWith('eyJ') ? '' : '&api_key=' + KEY)
    try {
      const r = await fetch(u, { headers: { accept: 'application/json', ...auth }, cache: 'no-store' })
      const j = (await r.json()) as { results?: { id: number; title: string; release_date?: string }[] }
      out.push({ label: 'tmdb', status: r.status, hits: (j.results || []).slice(0, 3) })
    } catch (e) {
      out.push({ label: 'tmdb', error: e instanceof Error ? e.message : 'hata' })
    }
  } else {
    out.push({ label: 'tmdb', error: 'anahtar yok' })
  }

  const slug = q.replace(/\s+/g, '-')
  for (const [label, url] of [
    ['hdfc-ara', 'https://www.hdfilmcehennemi.nl/arama/?s=' + encodeURIComponent(q)],
    ['hdfc-ara2', 'https://hdfilmcehennemini.com/?s=' + encodeURIComponent(q)],
    ['hdfc-ara3', 'https://www.hdfilmcehennemi.land/?s=' + encodeURIComponent(q)],
  ] as [string, string][]) {
    out.push(await scan(label, url, { Referer: 'https://www.google.com/' }))
  }

  return Response.json(out)
}