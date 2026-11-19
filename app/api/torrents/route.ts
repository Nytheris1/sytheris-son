import { NextResponse } from 'next/server'

// Tarayıcıda (WebTorrent) çalışabilmesi için gerekli WSS Tracker'ları
const WSS_TRACKERS = [
  'wss://tracker.btorrent.xyz',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.webtorrent.dev',
]

function addWssTrackers(magnet: string) {
  let url = magnet
  for (const tr of WSS_TRACKERS) {
    if (!url.includes(encodeURIComponent(tr))) {
      url += `&tr=${encodeURIComponent(tr)}`
    }
  }
  return url
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q')

  if (!rawQuery) return NextResponse.json({ error: 'Arama terimi gerekli' }, { status: 400 })

  // Gelen aramayı temizle (örneğin "One Piece 1" -> "One Piece")
  // Sadece bölüm numarasını ayırıp Nyaa'da daha iyi sonuç almak için kullanacağız.
  const parts = rawQuery.trim().split(/\s+/)
  const episodeNum = parts.length > 1 ? parts.pop() : ''
  const animeName = parts.join(' ') || rawQuery

  // Nyaa aramasını bölüm numarasıyla veya tek başına yap
  const searchTerm = episodeNum ? `${animeName} ${episodeNum}` : animeName
  // Nyaa sadece İngilizce çevirileri arasın (c=1_2)
  const nyaaUrl = `https://nyaa.si/?page=rss&q=${encodeURIComponent(searchTerm)}&c=1_2&f=0`

  try {
    const res = await fetch(nyaaUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Nyaa HTTP Hatası: ${res.status}`)

    const xml = await res.text()
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]

    if (items.length === 0) {
      return NextResponse.json({ error: 'Bu arama için Nyaa üzerinde sonuç bulunamadı.' }, { status: 404 })
    }

    const results: { title: string; magnet: string; seeders: number; size: string }[] = []

    items.forEach((item) => {
      const itemXml = item[1]
      
      const titleMatch = itemXml.match(/<title>(.*?)<\/title>/)
      const infoHashMatch = itemXml.match(/<nyaa:infoHash>(.*?)<\/nyaa:infoHash>/)
      const seedersMatch = itemXml.match(/<nyaa:seeders>(.*?)<\/nyaa:seeders>/)
      const sizeMatch = itemXml.match(/<nyaa:size>(.*?)<\/nyaa:size>/)

      if (titleMatch && infoHashMatch) {
        // CDATA etiketlerini temizle
        const title = decodeURIComponent(titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim())
        const infoHash = infoHashMatch[1].trim()
        const seeders = seedersMatch ? parseInt(seedersMatch[1], 10) : 0
        const size = sizeMatch ? sizeMatch[1].trim() : 'Bilinmiyor'

        const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`
        
        results.push({ title, magnet, seeders, size })
      }
    })

    // Seed sayısına göre en yüksekten en düşüğe sırala
    results.sort((a, b) => b.seeders - a.seeders)

    // En iyi sonucu seç
    const best = results[0]

    if (!best) {
      return NextResponse.json({ error: 'Uygun magnet linki oluşturulamadı.' }, { status: 404 })
    }

    // WebTorrent için WSS tracker'larını ekle
    const finalMagnet = addWssTrackers(best.magnet)

    return NextResponse.json({
      magnet: finalMagnet,
      title: best.title,
      seeders: best.seeders,
      size: best.size,
    })

  } catch (error) {
    console.error('Torrent arama hatası:', error)
    return NextResponse.json({ 
      error: 'Nyaa sunucusuna ulaşılamadı veya bir hata oluştu.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}