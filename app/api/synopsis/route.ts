import { NextResponse } from 'next/server'
import { anilist } from '@/lib/anilist'
import { stripHtml } from '@/lib/format'
import { isSynopsisLang, translate } from '@/lib/translate'

export const runtime = 'nodejs'

/** GET /api/synopsis?id=123&lang=tr — the AniList synopsis, translated server-side and cached. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = Number(url.searchParams.get('id'))
  const lang = url.searchParams.get('lang') ?? 'tr'
  if (!Number.isInteger(id) || id <= 0 || !isSynopsisLang(lang)) {
    return NextResponse.json({ ok: false, error: 'Geçersiz istek' }, { status: 400 })
  }

  const data = await anilist<{ Media: { description: string | null } | null }>(
    'query ($id: Int) { Media(id: $id, type: ANIME) { description(asHtml: false) } }',
    { id },
    86400,
  )
  const original = stripHtml(data?.Media?.description)
  if (!original) return NextResponse.json({ ok: true, lang, text: '', translated: false })
  if (lang === 'en') return NextResponse.json({ ok: true, lang, text: original, translated: false }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } })

  const text = await translate(original, lang)
  return NextResponse.json(
    { ok: true, lang, text: text ?? original, translated: Boolean(text), fallback: !text },
    { headers: { 'Cache-Control': text ? 'public, s-maxage=2592000, stale-while-revalidate=86400' : 'no-store' } },
  )
}
