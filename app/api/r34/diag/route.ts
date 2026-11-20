export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const grab = async (label: string, qs: string) => {
  const r = await fetch('https://rule34.us/index.php?r=posts/index&q=furry&' + qs, {
    headers: { 'User-Agent': UA, Referer: 'https://rule34.us/' },
    cache: 'no-store',
  })
  const b = await r.text()
  const ids = [...new Set([...b.matchAll(/posts\/view&amp;id=(\d+)/g)].map((m) => m[1]))]
  return { label, qs, status: r.status, count: ids.length, head: ids.slice(0, 2) }
}

export async function GET() {
  return Response.json([
    await grab('base', ''),
    await grab('p2', 'p=2'),
    await grab('page2', 'page=2'),
    await grab('pid42', 'pid=42'),
    await grab('offset42', 'offset=42'),
    await grab('pid42p2', 'pid=42&p=2'),
    await grab('lim', 'limit=42&pid=42'),
  ])
}