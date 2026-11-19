import { NextResponse } from 'next/server'
import { getCurrentUser, passwordEmailOf, toPublic } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  const data = {
    exportedAt: new Date().toISOString(),
    account: {
      ...toPublic(user),
      email: user.email ?? null,
      passwordLogin: passwordEmailOf(user),
      provider: user.provider,
      recentLogins: user.security?.logins ?? [],
    },
  }
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="sytheris-${user.username}-veri.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
