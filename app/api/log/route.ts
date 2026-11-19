import { NextResponse } from 'next/server'
import { logEvent } from '@/lib/site'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  if (rateLimit('client-log', clientIp(request.headers), 20, 60_000)) return NextResponse.json({ ok: false }, { status: 429 })
  if (Number(request.headers.get('content-length') ?? 0) > 16_000) return NextResponse.json({ ok: false }, { status: 413 })

  try {
    const body = (await request.json()) as { message?: string; stack?: string; path?: string }
    if (!body.message) return NextResponse.json({ ok: false }, { status: 400 })
    await logEvent({
      level: 'error',
      source: 'client',
      message: String(body.message).slice(0, 500),
      stack: body.stack ? String(body.stack).slice(0, 4000) : undefined,
      path: body.path ? String(body.path).slice(0, 200) : undefined,
      userAgent: request.headers.get('user-agent')?.slice(0, 200) ?? undefined,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
