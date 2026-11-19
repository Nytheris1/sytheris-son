import { getArtPixels, getArtwork } from '@/lib/artworks'

export const runtime = 'nodejs'

/** Public image endpoint for gallery works. `?s=thumb` returns the small preview. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f0-9]{6,32}$/.test(id)) return new Response('Bulunamadı', { status: 404 })
  const [art, px] = await Promise.all([getArtwork(id), getArtPixels(id)])
  if (!art || art.hidden || !px) return new Response('Bulunamadı', { status: 404 })

  const thumb = new URL(req.url).searchParams.get('s') === 'thumb'
  const dataUrl = thumb ? px.thumb : px.image
  const comma = dataUrl.indexOf(',')
  const mime = dataUrl.slice(5, dataUrl.indexOf(';')) || 'image/webp'
  const bytes = Buffer.from(dataUrl.slice(comma + 1), 'base64')

  return new Response(bytes, {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
