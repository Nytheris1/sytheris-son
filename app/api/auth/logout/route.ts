import { NextResponse } from 'next/server'
import { appOrigin } from '@/lib/oauth'
import { SESSION_COOKIE, cookieOptions } from '@/lib/session'

export async function POST(request: Request) {
  const res = NextResponse.redirect(`${appOrigin(request)}/`, { status: 303 })
  res.cookies.set(SESSION_COOKIE, '', cookieOptions(0))
  return res
}
