export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const grab = async (label: string, url: string) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://rule34.us/' }, cache: 'no-store' })
  const b = await r.text()
  const ids = [...new Set([...b.matchAll(/posts\/view&amp;id=(\d+)/g)].map((m) => m[1]))]
  return { label, status: r.status, count: ids.length, head: ids.slice(0, 2) }
}

export async function GET() {
  return Response.json([
    await grab('p1', 'https://rule34.us/index.php?r=posts/index&q=furry&pid=0'),
    await grab('p2', 'https://rule34.us/index.php?r=posts/index&q=furry&pid=42'),
    await grab('p3', 'https://rule34.us/index.php?r=posts/index&q=furry&pid=84'),
    await grab('meimei', 'https://rule34.us/index.php?r=posts/index&q=mei+mei&pid=0'),
    await grab('meimei2', 'https://rule34.us/index.php?r=posts/index&q=mei%20mei&pid=0'),
  ])
}