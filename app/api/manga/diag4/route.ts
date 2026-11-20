export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (label: string, qs: string) => {
  const r = await fetch('https://nhentai.net/api/v2/search?' + qs, { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store' })
  const b = await r.text()
  let count = -1
  try {
    const j = JSON.parse(b) as { result?: unknown[] }
    count = (j.result || []).length
  } catch {
    /* json degil */
  }
  return { label, qs, status: r.status, count, head: b.slice(0, 90) }
}

export async function GET() {
  return Response.json([
    await scan('empty', 'query=&page=1'),
    await scan('lang', 'query=language%3Aenglish&page=1'),
    await scan('english', 'query=english&page=1'),
    await scan('yuri', 'query=yuri&page=1'),
    await scan('p1', 'page=1'),
  ])
}