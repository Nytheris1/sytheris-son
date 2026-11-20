export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function GET() {
  const r = await fetch('https://rule34.us/index.php?r=posts/index&q=furry', {
    headers: { 'User-Agent': UA, Referer: 'https://rule34.us/' },
    cache: 'no-store',
  })
  const b = await r.text()
  return Response.json({
    status: r.status,
    len: b.length,
    thumbClass: (b.match(/class="thumb"/g) || []).length,
    viewLinks: (b.match(/r=posts\/view/g) || []).length,
    imgTags: (b.match(/<img/g) || []).length,
    sampleHref: [...new Set([...b.matchAll(/href="([^"]*posts\/view[^"]*)"/g)].map((m) => m[1]))].slice(0, 3),
    sampleImg: [...new Set([...b.matchAll(/src="([^"]*(?:thumb|sample)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 3),
  })
}