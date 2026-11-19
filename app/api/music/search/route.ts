import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type AnimeTheme = {
  id: number
  slug: string
  type: string
  anime?: { name: string; images?: { facet: string; link: string }[] }
  song?: { title?: string; artists?: { name: string }[] }
  animethemeentries?: { videos?: { audio?: { link?: string } }[] }[]
}

type YTRun = { text?: string }
type YTVideo = {
  videoId?: string
  title?: { runs?: YTRun[]; simpleText?: string }
  ownerText?: { runs?: YTRun[] }
  longBylineText?: { runs?: YTRun[] }
  lengthText?: { simpleText?: string }
}

function toSeconds(len?: string) {
  if (!len) return 0
  return len.split(':').reduce((acc, p) => acc * 60 + (Number(p) || 0), 0)
}

function collectVideos(node: unknown, out: YTVideo[], depth = 0) {
  if (!node || typeof node !== 'object' || depth > 40 || out.length >= 40) return
  if (Array.isArray(node)) {
    for (const n of node) collectVideos(n, out, depth + 1)
    return
  }
  const obj = node as Record<string, unknown>
  if (obj.videoRenderer && typeof obj.videoRenderer === 'object') {
    out.push(obj.videoRenderer as YTVideo)
    return
  }
  for (const v of Object.values(obj)) collectVideos(v, out, depth + 1)
}

/** Full-length songs: keyless YouTube search, played in-site through the IFrame player. */
async function searchYouTube(q: string) {
  const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAQ%253D%253D&hl=tr&gl=TR`, {
    next: { revalidate: 86400 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    },
  })
  const html = await res.text()
  const match = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/) ?? html.match(/ytInitialData"\]\s*=\s*(\{[\s\S]*?\});/)
  if (!match) return []
  const data = JSON.parse(match[1]) as unknown
  const videos: YTVideo[] = []
  collectVideos(data, videos)
  return videos
    .filter((v) => v.videoId && v.lengthText?.simpleText)
    .filter((v) => {
      const s = toSeconds(v.lengthText?.simpleText)
      return s > 45 && s < 15 * 60
    })
    .slice(0, 18)
    .map((v) => {
      const title = v.title?.runs?.map((r) => r.text).join('') || v.title?.simpleText || 'Bilinmeyen parça'
      const channel = (v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'YouTube').replace(/\s*-\s*Topic$/i, '')
      return {
        id: `yt-${v.videoId}`,
        title,
        artist: channel,
        url: `yt:${v.videoId}`,
        cover: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        source: 'youtube' as const,
        anime: null,
        kind: v.lengthText?.simpleText ?? null,
      }
    })
}

/** oEmbed answers 401 for videos whose owner disabled embedding, so those never reach the player. */
async function embeddable(videoId: string) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`, {
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(3500),
    })
    return res.ok
  } catch {
    return true
  }
}

async function searchSongs(q: string) {
  const list = await searchYouTube(q)
  const checks = await Promise.all(list.map((t) => embeddable(t.url.slice(3))))
  return list.filter((_, i) => checks[i]).slice(0, 14)
}

async function searchAnimeThemes(q: string) {
  const url = new URL('https://api.animethemes.moe/search')
  url.searchParams.set('q', q)
  url.searchParams.set('fields[search]', 'animethemes')
  url.searchParams.set('include[animetheme]', 'animethemeentries.videos.audio,song.artists,anime.images')
  url.searchParams.set('page[limit]', '15')
  const res = await fetch(url, { next: { revalidate: 86400 }, headers: { Accept: 'application/json', 'User-Agent': 'Sytheris/1.0 (+https://sytheris.vercel.app)' } })
  if (!res.ok) throw new Error(`animethemes ${res.status}`)
  const json = (await res.json()) as { search?: { animethemes?: AnimeTheme[] } }
  return (json.search?.animethemes ?? [])
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 80)
  const source = searchParams.get('source') === 'song' ? 'song' : 'anime'
  if (q.length < 2) return NextResponse.json({ results: [] })

  const strict = searchParams.get('strict') === '1'

  try {
    if (source === 'song') return NextResponse.json({ results: await searchSongs(q) })
    const themes = await searchAnimeThemes(q).catch(() => [])
    if (themes.length || strict) return NextResponse.json({ results: themes })
    // AnimeThemes is down or has no match: fall back to full-length openings from YouTube.
    return NextResponse.json({ results: await searchSongs(`${q} anime opening`), fallback: true })
  } catch (e) {
    return NextResponse.json({ results: [], error: (e as Error).message }, { status: 200 })
  }
}
