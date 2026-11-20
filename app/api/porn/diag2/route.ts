export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (label: string, url: string, ref: string, linkRe: RegExp) => {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'tr,en;q=0.9', Referer: ref },
      cache: 'no-store',
    })
    const b = await r.text()
    const links = [...new Set([...b.matchAll(linkRe).map((m) => m[1]))]
    return { label, status: r.status, len: b.length, links: links.slice(0, 4), mp4: /\.mp4/.test(b), cf: /just a moment/i.test(b) }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  const q = 'milf'
  const out = []
  out.push(await scan('pornhub', 'https://www.pornhub.com/video/search?search=' + q, 'https://www.pornhub.com/', /href="(\/view_video\.php\?viewkey=[^"]+)"/g))
  out.push(await scan('xvideos', 'https://www.xvideos.com/?k=' + q, 'https://www.xvideos.com/', /href="(\/video\.[^"]+)"/g))
  out.push(await scan('hqporner', 'https://hqporner.com/?q=' + q, 'https://hqporner.com/', /href="(\/hdporn\/[^"]+)"/g))
  return Response.json(out)
}