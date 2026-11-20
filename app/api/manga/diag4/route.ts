export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export async function GET() {
  const r = await fetch('https://nhentai.net/api/v2/galleries/698296', { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store' })
  const b = await r.text()
  const j = JSON.parse(b) as Record<string, unknown>
  return Response.json({
    status: r.status,
    keys: Object.keys(j),
    images: j.images ? Object.keys(j.images as object) : null,
    samplePage: j.images ? JSON.stringify((j.images as { pages?: unknown[] }).pages?.[0]) : null,
    thumbnail: j.thumbnail,
    media: j.media_id,
  })
}