export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function GET() {
  const out: Record<string, unknown> = {}
  for (const [label, url] of [
    ['embed', 'https://animeembed.com/embed/anilist/16498/1?track=sub'],
    ['embed-tr', 'https://animeembed.com/embed/anilist/16498/1?track=sub&lang=tr'],
    ['try', 'https://tryembed.us.cc/embed/anime/16498/1/sub'],
  ] as [string, string][]) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, cache: 'no-store' })
      const b = await r.text()
      out[label] = {
        status: r.status,
        len: b.length,
        turkish: /türkçe|turkish|"tr"|lang=tr|subtitle.*tr/i.test(b),
        langs: [...new Set([...b.matchAll(/\b(tr|en|de|fr|es|ar|ru|pt|it)\b/g)].map((m) => m[1]))].slice(0, 10),
      }
    } catch (e) {
      out[label] = { error: e instanceof Error ? e.message : 'hata' }
    }
  }
  return Response.json(out)
}