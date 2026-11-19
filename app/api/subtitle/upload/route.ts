import { NextResponse } from 'next/server'
import { kvSet } from '@/lib/store'
import { toVtt } from '@/lib/subtitles'
import { getStaff } from '@/app/sy-core/actions'

const MAX = 1024 * 1024
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/

/** Staff-only: stores an uploaded .srt/.vtt for an episode. */
export async function POST(req: Request) {
  if (!(await getStaff())) return NextResponse.json({ message: 'Yetkisiz işlem.' }, { status: 401 })
  try {
    const formData = await req.formData()
    const file = formData.get('subtitle')
    const episodeId = String(formData.get('episodeId') ?? '')
    const animeId = String(formData.get('animeId') ?? '')

    if (!(file instanceof File) || !ID_RE.test(episodeId) || !ID_RE.test(animeId)) {
      return NextResponse.json({ message: 'Dosya ya da bölüm bilgisi eksik.' }, { status: 400 })
    }
    if (file.size > MAX) return NextResponse.json({ message: 'Altyazı dosyası 1MB sınırını aşıyor.' }, { status: 400 })

    await kvSet(`subtitle:${animeId}:${episodeId}`, toVtt(await file.text()))
    return NextResponse.json({ success: true, message: 'Altyazı kaydedildi.' })
  } catch (error) {
    console.error('Subtitle upload error:', error)
    return NextResponse.json({ message: 'Sunucu hatası.' }, { status: 500 })
  }
}
