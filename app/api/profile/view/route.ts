import { NextResponse } from 'next/server'
import { getUserByUsername, saveUser } from '@/lib/users'

export async function POST(request: Request) {
  try {
    const { username } = (await request.json()) as { username?: string }
    if (!username) return NextResponse.json({ ok: false }, { status: 400 })
    const user = await getUserByUsername(String(username).slice(0, 30))
    if (!user) return NextResponse.json({ ok: false }, { status: 404 })
    user.views = (user.views || 0) + 1
    await saveUser(user)
    return NextResponse.json({ ok: true, views: user.views })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
