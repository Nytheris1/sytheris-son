export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (label: string, url: string, ref: string) => {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'tr,en;q=0.9', Referer: ref },
      cache: 'no-store',
    })
    const b = await r.text()
    return {
      label,
      status: r.status,
      len: b.length,
      videoLinks: [...new Set([...b.matchAll(/href="([^"]*(?:\/video|\/videos|\/watch|\/v\/)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 3),
      mp4: /\.mp4/.test(b),
    }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  const q = 'milf'
  const out = []
  for (const [label, url, ref] of [
    ['txxx', 'https://txxx.com/search/?q=' + q, 'https://txxx.com/'],
    ['hqporner', 'https://hqporner.com/?q=' + q, 'https://hqporner.com/'],
    ['beeg', 'https://beeg.com/search?q=' + q, 'https://beeg.com/'],
    ['spankbang', 'https://spankbang.com/s/' + q + '/', 'https://spankbang.com/'],
    ['hclips', 'https://hclips.com/search/?q=' + q, 'https://hclips.com/'],
    ['eporner-m', 'https://www.eporner.com/search/' + q + '/', 'https://www.eporner.com/'],
  ] as [string, string, string][]) {
    out.push(await scan(label, url, ref))
  }
  return Response.json(out)
}