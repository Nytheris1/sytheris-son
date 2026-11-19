export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (label: string, url: string) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*', 'Accept-Language': 'tr,en;q=0.9' }, cache: 'no-store' })
    const b = await r.text()
    return {
      label,
      status: r.status,
      len: b.length,
      tr: /türkçe|turkish|"tr"|>TR</i.test(b),
      snippet: b.replace(/\s+/g, ' ').slice(0, 120),
    }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  const out = []
  for (const [label, url] of [
    ['zoko', 'https://zokoanime.video/stream/anilist/16498/1/sub'],
    ['animeembed', 'https://animeembed.com/embed/anilist/16498/1?track=sub'],
    ['tryembed', 'https://tryembed.us.cc/embed/anime/16498/1/sub'],
    ['vidrift', 'https://vidrift.net/embed/anilist/16498/1'],
    ['turkanime', 'https://www.turkanime.tv/'],
    ['animecix', 'https://animecix.tv/'],
    ['openani', 'https://openani.me/'],
  ] as [string, string][]) {
    out.push(await scan(label, url))
  }
  return Response.json(out)
}