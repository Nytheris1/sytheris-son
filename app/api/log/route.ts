import { NextResponse } from 'next/server'
import { logEvent } from '@/lib/site'

const hits = new Map<string, { n: number; at: number }>()

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const h = hits.get(ip)
  if (h && now - h.at < 60_000 && h.n > 20) return NextResponse.json({ ok: false }, { status: 429 })
  hits.set(ip, h && now - h.at < 60_000 ? { n: h.n + 1, at: h.at } : { n: 1, at: now })

  try {
    const body = (await request.json()) as { message?: string; stack?: string; path?: string }
    if (!body.message) return NextResponse.json({ ok: false }, { status: 400 })
    await logEvent({
      level: 'error',
      source: 'client',
      message: String(body.message),
      stack: body.stack ? String(body.stack) : undefined,
      path: body.path ? String(body.path).slice(0, 200) : undefined,
      userAgent: request.headers.get('user-agent')?.slice(0, 200) ?? undefined,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
