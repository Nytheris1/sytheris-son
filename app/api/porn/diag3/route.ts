export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function GET() {
  const r = await fetch('https://hqporner.com/hdporn/128682-you_have_the_tools_to_not_be_shy.html', {
    headers: { 'User-Agent': UA, Referer: 'https://hqporner.com/' },
    cache: 'no-store',
  })
  const b = await r.text()
  return Response.json({
    status: r.status,
    iframe: (b.match(/<iframe/g) || []).length,
    m3u8: (b.match(/m3u8/g) || []).length,
    vidSrc: [...new Set([...b.matchAll(/(?:src|data-src)="([^"]*(?:video|embed|player)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 5),
    scripts: [...new Set([...b.matchAll(/https:\/\/[^"']*\.js[^"']*/g)].map((m) => m[0]))].slice(0, 4),
  })
}