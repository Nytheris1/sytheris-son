export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const look = async (label: string, url: string, ref: string) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html', Referer: ref }, cache: 'no-store' })
    const b = await r.text()
    const at = b.indexOf('.mp4')
    return {
      label,
      status: r.status,
      len: b.length,
      mp4Count: (b.match(/\.mp4/g) || []).length,
      flash: b.includes('flashvars'),
      mediaDef: b.includes('mediaDefinitions'),
      around: at > 0 ? b.slice(Math.max(0, at - 280), at + 90).replace(/\s+/g, ' ') : '',
    }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  return Response.json([
    await look('ph', 'https://www.pornhub.com/view_video.php?viewkey=6a0ca93102062', 'https://www.pornhub.com/'),
    await look('hq', 'https://hqporner.com/hdporn/128682-you_have_the_tools_to_not_be_shy.html', 'https://hqporner.com/'),
  ])
}