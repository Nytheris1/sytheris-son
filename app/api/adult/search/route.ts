import { NextResponse } from 'next/server'
import { adultSearch } from '@/lib/adult'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 80)
  if (q.length < 2) return NextResponse.json({ results: [] })
  const { results } = await adultSearch(q)
  return NextResponse.json({
    results: results.slice(0, 12).map((m) => ({
      id: m.id,
      title: m.title,
      cover: m.coverImage?.large ?? m.coverImage?.extraLarge ?? null,
      year: m.seasonYear ?? null,
      episodes: m.episodes ?? null,
    })),
  })
}