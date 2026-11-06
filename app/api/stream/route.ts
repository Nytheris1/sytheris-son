// SSL sertifika doğrulama hatasını aşmak için (Vercel ortamı için)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { NextResponse } from 'next/server'
import { ANIME } from '@consumet/extensions'

const provider = new ANIME.AnimePahe()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const epNum = searchParams.get('ep')

  if (!title || !epNum) {
    return NextResponse.json({ error: 'Başlık ve bölüm numarası gerekli' }, { status: 400 })
  }

  try {
    // 1. Animeyi ara
    const searchResults = await provider.search(title)

    if (!searchResults.results || searchResults.results.length === 0) {
      return NextResponse.json({ error: 'Anime AnimePahe üzerinde bulunamadı.' }, { status: 404 })
    }

    const anime = searchResults.results[0]

    // 2. Bölüm listesini al
    const info = await provider.fetchAnimeInfo(anime.id)

    if (!info.episodes || info.episodes.length === 0) {
      return NextResponse.json({ error: 'Bu anime için bölüm listesi bulunamadı.' }, { status: 404 })
    }

    // 3. İstenen bölümü bul
    const episode = info.episodes.find((e: any) => e.number === Number(epNum))
    if (!episode) {
      return NextResponse.json({ error: `Bölüm ${epNum} bulunamadı.` }, { status: 404 })
    }

    // 4. Bölümün video kaynaklarını çek
    const sources = await provider.fetchEpisodeSources(episode.id)

    if (!sources || !sources.sources || sources.sources.length === 0) {
      return NextResponse.json({ error: 'Video kaynakları çekilemedi.' }, { status: 404 })
    }

    // 5. M3U8 formatındaki kaynağı bul
    const source = sources.sources.find((s: any) => s.isM3U8) || sources.sources[0]

    return NextResponse.json({
      streamUrl: `/api/proxy?url=${encodeURIComponent(source.url)}`,
      originalUrl: source.url
    })

  } catch (error: any) {
    console.error('Stream API Hatası:', error)

    let errorMessage = 'Bilinmeyen bir hata.'
    if (error.message) errorMessage = error.message
    else if (typeof error === 'string') errorMessage = error
    else if (error.toString) errorMessage = error.toString()

    return NextResponse.json({
      error: 'Sağlayıcı Hatası: ' + errorMessage
    }, { status: 500 })
  }
}
