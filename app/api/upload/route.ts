import { NextResponse } from 'next/server'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX = 2 * 1024 * 1024

/** The declared MIME type is client-controlled, so the file's magic bytes must agree with it. */
function sniff(b: Buffer): string | null {
  const hex = b.subarray(0, 12).toString('hex')
  if (hex.startsWith('89504e47')) return 'image/png'
  if (hex.startsWith('ffd8ff')) return 'image/jpeg'
  if (hex.startsWith('47494638')) return 'image/gif'
  if (hex.startsWith('52494646') && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (hex.startsWith('1a45dfa3')) return 'video/webm'
  if (b.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = b.subarray(8, 12).toString('ascii')
    return brand.startsWith('avi') ? 'image/avif' : 'video/mp4'
  }
  return null
}

export async function POST(req: Request) {
  const wait = rateLimit('upload', clientIp(req.headers), 20, 10 * 60_000)
  if (wait) return tooMany(wait, 'Çok fazla yükleme. Biraz sonra tekrar dene.')
  if (Number(req.headers.get('content-length') ?? 0) > MAX + 64 * 1024) {
    return NextResponse.json({ ok: false, error: 'Dosya 2MB sınırını aşıyor' }, { status: 413 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'Dosya bulunamadı' }, { status: 400 })
    if (file.size > MAX) return NextResponse.json({ ok: false, error: 'Dosya 2MB sınırını aşıyor' }, { status: 400 })
    const buf = Buffer.from(await file.arrayBuffer())
    const type = sniff(buf)
    if (!type) return NextResponse.json({ ok: false, error: 'Desteklenmeyen dosya türü (PNG, JPG, WEBP, GIF, AVIF, MP4, WEBM)' }, { status: 400 })
    return NextResponse.json({ ok: true, url: `data:${type};base64,${buf.toString('base64')}`, size: file.size, type })
  } catch {
    return NextResponse.json({ ok: false, error: 'Dosya işlenemedi' }, { status: 500 })
  }
}
