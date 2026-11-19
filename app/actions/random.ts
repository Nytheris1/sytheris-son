'use server'

import { drawFatePool, getRandomPool } from '@/lib/anilist'
import { GENRE_LIST } from '@/lib/format'
import { DEMOGRAPHICS, ERAS, TROPE_GROUPS } from '@/lib/tropes'

const VALID_TAGS = new Set([...TROPE_GROUPS.flatMap((g) => g.items.map((t) => t.tag)), ...DEMOGRAPHICS.map((d) => d.tag)])
const VALID_GENRES = new Set(GENRE_LIST)
const FORMATS = new Set(['TV', 'MOVIE', 'OVA', 'ONA'])

export async function fetchRandomPool(genre?: string) {
  return getRandomPool(genre)
}

export async function drawFate(input: { genres: string[]; tags: string[]; era: string | null; format: string | null; length: 'short' | 'mid' | 'long' | null; minScore: number }) {
  const era = ERAS.find((e) => e.id === input.era) ?? null
  return drawFatePool({
    genres: input.genres.filter((g) => VALID_GENRES.has(g)),
    tags: input.tags.filter((t) => VALID_TAGS.has(t)),
    era: era ? { from: era.from, to: era.to } : null,
    format: input.format && FORMATS.has(input.format) ? input.format : null,
    length: input.length && ['short', 'mid', 'long'].includes(input.length) ? input.length : null,
    minScore: Math.min(90, Math.max(0, Math.round(input.minScore || 0))),
  })
}
