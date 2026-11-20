export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const scan = async (label: string, url: string, ref: string) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*', Referer: ref }, cache: 'no-store' })
    const b = await r.text()
    return {
      label,
      status: r.status,
      len: b.length,
      json: b.trim().startsWith('[') || b.trim().startsWith('{'),
      posts: (b.match(/"file_url"/g) || []).length,
      thumbs: (b.match(/class="thumb"/g) || []).length,
      head: b.slice(0, 100),
    }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : 'hata' }
  }
}

export async function GET() {
  return Response.json([
    await scan('allthefallen', 'https://booru.allthefallen.moe/posts.json?tags=furry&limit=3', 'https://booru.allthefallen.moe/'),
    await scan('paheal', 'https://rule34.paheal.net/post/list/furry/1', 'https://rule34.paheal.net/'),
    await scan('r34us', 'https://rule34.us/index.php?r=posts/index&q=furry', 'https://rule34.us/'),
  ])
}