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
    const all = [...new Set([...b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))]
    return {
      label,
      status: r.status,
      len: b.length,
      total: all.length,
      sample: all.filter((h) => /\d/.test(h)).slice(0, 10),
      thumbs: [...new Set([...b.matchAll(/src="([^"]+\.(?:jpg|jpeg|webp|png)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 3),
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
    ['hclips', 'https://hclips.com/search/?q=' + q, 'https://hclips.com/'],
  ] as [string, string, string][]) {
    out.push(await scan(label, url, ref))
  }
  return Response.json(out)
}