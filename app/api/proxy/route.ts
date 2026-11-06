import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  const referer = searchParams.get('referer') || 'https://hianime.to'

  if (!url) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': referer,
      }
    })

    const data = await res.text()
    
    // Eğer m3u8 dosyasıysa içindeki alt linkleri de proxy'e çevir
    let finalData = data
    if (url.includes('.m3u8') || data.includes('#EXTM3U')) {
      // m3u8 içindeki göreceli linkleri (segmentleri) proxy'e yönlendir
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
      finalData = data.split('\n').map((line: string) => {
        if (line.trim() && !line.startsWith('#')) {
          // Mutlak URL ise direkt, göreceli ise birleştir
          const absUrl = line.startsWith('http') ? line : new URL(line, baseUrl).toString()
          return `/api/proxy?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer)}`
        }
        return line
      }).join('\n')
    }

    return new NextResponse(finalData, {
      headers: {
        'Content-Type': url.includes('.ts') ? 'video/mp2t' : 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Proxy bağlantı hatası' }, { status: 500 })
  }
}