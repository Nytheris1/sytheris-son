import { NextResponse } from 'next/server'
import { adminActor } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Source = { url: string; isM3U8?: boolean }
type EpisodeRef = { id: string; number: number }

/**
 * Admin-only helper behind "Akış bul": looks an episode up on AnimePahe and returns its stream.
 * The provider is imported lazily so it never slows the build or other routes down, and TLS verification
 * stays on — the old global NODE_TLS_REJECT_UNAUTHORIZED=0 switch disabled it for the whole server.
 */
export async function GET(request: Request) {
  if (!(await adminActor())) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')?.trim().slice(0, 200)
  const epNum = Number(searchParams.get('ep'))
  if (!title || !Number.isInteger(epNum) || epNum <= 0) {
    return NextResponse.json({ error: 'Başlık ve bölüm numarası gerekli' }, { status: 400 })
  }

  try {
    const { ANIME } = await import('@consumet/extensions')
    const provider = new ANIME.AnimePahe()

    const search = await provider.search(title)
    const anime = search.results?.[0]
    if (!anime) return NextResponse.json({ error: 'Anime AnimePahe üzerinde bulunamadı.' }, { status: 404 })

    const info = await provider.fetchAnimeInfo(String(anime.id))
    const episode = (info.episodes as EpisodeRef[] | undefined)?.find((e) => e.number === epNum)
    if (!episode) return NextResponse.json({ error: `Bölüm ${epNum} bulunamadı.` }, { status: 404 })

    const sources = (await provider.fetchEpisodeSources(episode.id)).sources as Source[] | undefined
    const source = sources?.find((s) => s.isM3U8) ?? sources?.[0]
    if (!source) return NextResponse.json({ error: 'Video kaynakları çekilemedi.' }, { status: 404 })

    return NextResponse.json({ streamUrl: `/api/proxy?url=${encodeURIComponent(source.url)}`, originalUrl: source.url })
  } catch (error) {
    return NextResponse.json({ error: `Sağlayıcı hatası: ${(error as Error)?.message ?? 'bilinmiyor'}` }, { status: 502 })
  }
}
