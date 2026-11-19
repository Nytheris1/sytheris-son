import { NextResponse } from 'next/server'
import { getUserByUsername, saveUser } from '@/lib/users'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const { username } = (await request.json()) as { username?: string }
    const name = String(username ?? '').slice(0, 30)
    if (!name) return NextResponse.json({ ok: false }, { status: 400 })
    const ip = clientIp(request.headers)
    // One counted view per visitor per profile every 30 minutes, and a global cap against scripted inflation.
    if (rateLimit('profile-view', `${ip}:${name.toLowerCase()}`, 1, 30 * 60_000) || rateLimit('profile-view-ip', ip, 60, 60_000)) {
      return NextResponse.json({ ok: true, counted: false })
    }
    const user = await getUserByUsername(name)
    if (!user) return NextResponse.json({ ok: false }, { status: 404 })
    user.views = (user.views || 0) + 1
    await saveUser(user)
    return NextResponse.json({ ok: true, views: user.views })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
