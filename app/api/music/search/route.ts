import { NextResponse } from 'next/server'

type AnimeTheme = {
  id: number
  slug: string
  type: string
  anime?: { name: string; images?: { facet: string; link: string }[] }
  song?: { title?: string; artists?: { name: string }[] }
  animethemeentries?: { videos?: { audio?: { link?: string } }[] }[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 80)
  const source = searchParams.get('source') === 'song' ? 'song' : 'anime'
  if (q.length < 2) return NextResponse.json({ results: [] })

  try {
    if (source === 'anime') {
      const url = new URL('https://api.animethemes.moe/search')
      url.searchParams.set('q', q)
      url.searchParams.set('fields[search]', 'animethemes')
      url.searchParams.set('include[animetheme]', 'animethemeentries.videos.audio,song.artists,anime.images')
      url.searchParams.set('page[limit]', '15')
      const res = await fetch(url, { next: { revalidate: 86400 }, headers: { Accept: 'application/json', 'User-Agent': 'Sytheris/1.0 (+https://sytheris.vercel.app)' } })
      const json = (await res.json()) as { search?: { animethemes?: AnimeTheme[] } }
      const results = (json.search?.animethemes ?? [])
        .map((t) => {
          const audio = t.animethemeentries?.flatMap((e) => e.videos ?? []).find((v) => v.audio?.link)?.audio?.link
          if (!audio) return null
          const cover = t.anime?.images?.find((i) => i.facet === 'Large Cover')?.link ?? t.anime?.images?.[0]?.link ?? null
          return {
            id: `at-${t.id}`,
            title: t.song?.title || t.slug,
            artist: t.song?.artists?.map((a) => a.name).join(', ') || 'Bilinmeyen sanatçı',
            url: audio,
            cover,
            source: 'animethemes' as const,
            anime: t.anime?.name ?? null,
            kind: t.slug,
          }
        })
        .filter(Boolean)
      return NextResponse.json({ results })
    }

    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=15`, {
      next: { revalidate: 86400 },
    })
    const json = (await res.json()) as {
      results?: { trackId: number; trackName: string; artistName: string; previewUrl?: string; artworkUrl100?: string; collectionName?: string }[]
    }
    const results = (json.results ?? [])
      .filter((r) => r.previewUrl)
      .map((r) => ({
        id: `it-${r.trackId}`,
        title: r.trackName,
        artist: r.artistName,
        url: r.previewUrl as string,
        cover: r.artworkUrl100?.replace('100x100bb', '400x400bb') ?? null,
        source: 'itunes' as const,
        anime: r.collectionName ?? null,
        kind: 'Önizleme',
      }))
    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ results: [], error: (e as Error).message }, { status: 200 })
  }
}
