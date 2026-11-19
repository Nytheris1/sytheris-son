import 'server-only'
import { cookies } from 'next/headers'
import { CONTENT_COOKIE, type ContentMode } from './content-mode-shared'

/** Which catalogue the visitor browses: anime (default) or live-action films. Stored in a plain cookie. */
export async function getContentMode(): Promise<ContentMode> {
  const store = await cookies()
  return store.get(CONTENT_COOKIE)?.value === 'film' ? 'film' : 'anime'
}
