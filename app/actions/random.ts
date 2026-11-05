'use server'

import { getRandomPool } from '@/lib/anilist'

export async function fetchRandomPool(genre?: string) {
  return getRandomPool(genre)
}
