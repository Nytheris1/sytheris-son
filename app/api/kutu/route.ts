import { NextResponse } from 'next/server'
import { MAX_FILES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, clearInbox, cleanCategory, listInbox, renameCategory, saveBytes, saveToInbox } from '@/lib/inbox'
import { downloadPinMedia, resolvePin } from '@/lib/pinterest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const NO_STORE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

export async function GET() {
  return NextResponse.json({ items: await listInbox() }, { headers: NO_STORE })
}

async function fromLinks(body: { links?: unknown; note?: unknown; category?: unknown }) {
  const links = (Array.isArray(body.links) ? body.links : [body.links])
    .map((l) => String(l ?? '').trim())
    .filter(Boolean)
    .slice(0, 10)
  if (!links.length) return NextResponse.json({ error: 'Bağlantı girilmedi.' }, { status: 400, headers: NO_STORE })

  const existing = await listInbox()
  if (existing.length + links.length > MAX_FILES) return NextResponse.json({ error: `Kutu en fazla ${MAX_FILES} öğe alır. Önce birkaçını sil.` }, { status: 400, headers: NO_STORE })

  const saved = []
  const errors: string[] = []
  for (const link of links) {
    try {
      const media = await resolvePin(link)
      const { bytes, type } = await downloadPinMedia(media, media.kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)
      saved.push(await saveBytes(bytes, { type, original: media.title, note: String(body.note ?? ''), category: cleanCategory(body.category), source: media.pinUrl }))
    } catch (e) {
      errors.push(`${link.slice(0, 60)}: ${e instanceof Error ? e.message : 'Eklenemedi.'}`)
    }
  }
  return NextResponse.json({ saved, errors }, { status: saved.length ? 200 : 400, headers: NO_STORE })
}

export async function POST(request: Request) {
  if (request.headers.get('content-type')?.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as { links?: unknown; note?: unknown; category?: unknown }
    return fromLinks(body)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Form okunamadı.' }, { status: 400, headers: NO_STORE })
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  const note = String(form.get('note') ?? '')
  const category = cleanCategory(form.get('category'))
  if (!files.length) return NextResponse.json({ error: 'Dosya seçilmedi.' }, { status: 400, headers: NO_STORE })

  const existing = await listInbox()
  if (existing.length + files.length > MAX_FILES) {
    return NextResponse.json({ error: `Kutu en fazla ${MAX_FILES} öğe alır. Önce birkaçını sil.` }, { status: 400, headers: NO_STORE })
  }

  const saved = []
  const errors: string[] = []
  for (const file of files) {
    try {
      saved.push(await saveToInbox(file, note, category))
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'Yüklenemedi.')
    }
  }
  return NextResponse.json({ saved, errors }, { status: saved.length ? 200 : 400, headers: NO_STORE })
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { from?: string; to?: string }
  if (!body.from || !body.to) return NextResponse.json({ error: 'Eksik bilgi.' }, { status: 400, headers: NO_STORE })
  await renameCategory(body.from, body.to)
  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}

export async function DELETE(request: Request) {
  const category = new URL(request.url).searchParams.get('kategori') ?? undefined
  await clearInbox(category)
  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
