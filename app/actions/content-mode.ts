'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { CONTENT_COOKIE, type ContentMode } from '@/lib/content-mode-shared'

export async function setContentMode(mode: ContentMode) {
  const value: ContentMode = mode === 'film' ? 'film' : mode === 'hentai' ? 'hentai' : 'anime'
  const store = await cookies()
  // `none` + secure keeps the preference working inside embedded previews (third-party iframes).
  store.set(CONTENT_COOKIE, value, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'none', secure: true, httpOnly: false })
  revalidatePath('/', 'layout')
  return { ok: true as const, mode: value }
}
