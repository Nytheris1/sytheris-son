import { NextResponse } from 'next/server'
import { quickSearch } from '@/lib/anilist'

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 80)
  if (q.length < 2) return NextResponse.json({ results: [] })
  const results = await quickSearch(q)
  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } })
}
