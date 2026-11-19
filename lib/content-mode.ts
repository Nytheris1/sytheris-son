import 'server-only'
import { cookies } from 'next/headers'
import { CONTENT_COOKIE, type ContentMode } from './content-mode-shared'

/** Which catalogue the visitor browses: anime (default), live-action films or hentai. Stored in a plain cookie. */
export async function getContentMode(): Promise<ContentMode> {
  const store = await cookies()
  const value = store.get(CONTENT_COOKIE)?.value
  if (value === 'film') return 'film'
  if (value === 'hentai') return 'hentai'
  return 'anime'
}