import { NextResponse } from 'next/server'
import { ANIME } from '@genga-movie/aniwatch'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const epNum = searchParams.get('ep')

  if (!title || !epNum) {
    return NextResponse.json({ error: 'Başlık ve bölüm numarası gerekli' }, { status: 400 })
  }

  try {
    const hianime = new ANIME.HiAnime()

    // 1. Animeyi ara
    const searchResults = await hianime.search(title)
    
    if (!searchResults.animes || searchResults.animes.length === 0) {
      return NextResponse.json({ error: 'Anime HiAnime üzerinde bulunamadı.' }, { status: 404 })
    }

    const anime = searchResults.animes[0]
    
    // 2. Bölüm linkini oluştur ve kaynakları çek
    const episodeId = `${anime.id}?ep=${epNum}`
    const sources = await hianime.getEpisodeSources(episodeId, "hd-1", "sub")
    
    if (!sources || !sources.sources || sources.sources.length === 0) {
      return NextResponse.json({ error: 'Video kaynakları çekilemedi.' }, { status: 404 })
    }

    // 3. HLS (m3u8) kaynağını bul
    const source = sources.sources.find((s: any) => s.isM3U8) || sources.sources[0]

    return NextResponse.json({ 
      streamUrl: `/api/proxy?url=${encodeURIComponent(source.url)}`,
      originalUrl: source.url 
    })

  } catch (error: any) {
    console.error('Stream API Hatası:', error)
    return NextResponse.json({ 
      error: 'Sunucu Hatası: Vercel IP engeli veya API çökmesi. Detay: ' + (error.message || 'Bilinmeyen hata.') 
    }, { status: 500 })
  }
}