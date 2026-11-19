import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GIF_CATEGORIES = ['happy', 'laugh', 'cry', 'hug', 'wave', 'smile', 'blush', 'shocked', 'facepalm', 'think', 'dance', 'thumbsup', 'pat', 'smug', 'sleep', 'bored', 'clap', 'yeet', 'pout', 'nod'] as const

type Gif = { id: string; url: string; preview: string; width: number; height: number; source: string | null }

async function nekos(path: string): Promise<Gif[]> {
  const res = await fetch(`https://nekos.best/api/v2/${path}`, { next: { revalidate: 3600 }, headers: { 'User-Agent': 'Sytheris/1.0' } })
  if (!res.ok) throw new Error(`nekos ${res.status}`)
  const json = (await res.json()) as { results?: { url: string; anime_name?: string; dimensions?: { width: number; height: number } }[] }
  return (json.results ?? []).map((r) => ({
    id: r.url,
    url: r.url,
    preview: r.url,
    width: r.dimensions?.width ?? 498,
    height: r.dimensions?.height ?? 280,
    source: r.anime_name ?? null,
  }))
}

async function giphy(q: string, key: string): Promise<Gif[]> {
  const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(`anime ${q}`)}&limit=24&rating=pg-13&lang=tr`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`giphy ${res.status}`)
  const json = (await res.json()) as { data?: { id: string; title?: string; images: { fixed_width: { url: string; width: string; height: string }; original: { url: string } } }[] }
  return (json.data ?? []).map((g) => ({
    id: g.id,
    url: g.images.original.url,
    preview: g.images.fixed_width.url,
    width: Number(g.images.fixed_width.width) || 200,
    height: Number(g.images.fixed_width.height) || 120,
    source: g.title ?? null,
  }))
}

/** GET /api/gifs?cat=hug or ?q=mutlu — anime reaction GIFs (nekos.best, keyless; GIPHY when GIPHY_API_KEY is set). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 40)
  const cat = url.searchParams.get('cat') ?? 'happy'
  try {
    let results: Gif[]
    if (q && process.env.GIPHY_API_KEY) results = await giphy(q, process.env.GIPHY_API_KEY)
    else if (q) results = await nekos(`search?query=${encodeURIComponent(q)}&type=2&amount=20`)
    else {
      const safe = (GIF_CATEGORIES as readonly string[]).includes(cat) ? cat : 'happy'
      results = await nekos(`${safe}?amount=20`)
    }
    const seen = new Set<string>()
    return NextResponse.json({ results: results.filter((g) => (seen.has(g.url) ? false : (seen.add(g.url), true))) })
  } catch (e) {
    return NextResponse.json({ results: [], error: (e as Error).message })
  }
}
