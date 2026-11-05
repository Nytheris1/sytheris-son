import { getEpisodeById, logEvent } from '@/lib/site'
import { toVtt } from '@/lib/subtitles'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ep = await getEpisodeById(id)
  if (!ep) return new Response('Bulunamadı', { status: 404 })

  let raw = ep.subtitleText ?? ''
  if (!raw && ep.subtitleUrl) {
    try {
      const url = new URL(ep.subtitleUrl)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Geçersiz protokol')
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      raw = await res.text()
    } catch (e) {
      await logEvent({ level: 'warn', source: 'server', message: `Altyazı alınamadı (${ep.animeTitle} #${ep.number}): ${(e as Error).message}`, path: `/api/subtitle/${id}` })
      return new Response('WEBVTT\n', { status: 200, headers: { 'Content-Type': 'text/vtt; charset=utf-8' } })
    }
  }
  return new Response(toVtt(raw || ''), {
    headers: { 'Content-Type': 'text/vtt; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  })
}
