import { cache } from 'react'

export type AnimeProvider = { id: string; label: string; build: (animeId: number, ep: number) => string }

/** AniList id + episode; the player resolves the stream itself, so every title works without manual entry. */
export const SUB_PROVIDERS: AnimeProvider[] = [
  { id: 'animeembed', label: 'AnimeEmbed', build: (a, e) => 'https://animeembed.com/embed/anilist/' + a + '/' + e + '?track=sub' },
  { id: 'tryembed', label: 'TryEmbed', build: (a, e) => 'https://tryembed.us.cc/embed/anime/' + a + '/' + e + '/sub' },
]

export const DUB_PROVIDERS: AnimeProvider[] = [
  { id: 'animeembed-dub', label: 'AnimeEmbed', build: (a, e) => 'https://animeembed.com/embed/anilist/' + a + '/' + e + '?track=dub' },
  { id: 'tryembed-dub', label: 'TryEmbed', build: (a, e) => 'https://tryembed.us.cc/embed/anime/' + a + '/' + e + '/dub' },
]

/** AniList episode count drives the list, so a title with no stored episodes is still fully watchable. */
export function syntheticEpisodes(total: number, isMovie: boolean) {
  const n = isMovie ? 1 : Math.min(Math.max(total || 12, 1), 2000)
  return Array.from({ length: n }, (_, i) => i + 1)
}
const ENDPOINT = 'https://graphql.anilist.co'
const EP_QUERY =
  'query ($id: Int) { Media(id: $id) { format episodes nextAiringEpisode { episode } streamingEpisodes { title thumbnail } } }'

export type AniEpisode = { id: string; number: number; title: string; thumbnail: string | null }

/**
 * Real episode titles and stills come from AniList's streamingEpisodes. The count follows AniList's own
 * data: the total episode number, otherwise how many episodes have aired, otherwise a format based
 * guess. The list is therefore never empty, even for titles AniList has no episode count for.
 */
export const aniEpisodes = cache(async (animeId: number, count: number): Promise<AniEpisode[]> => {
  let titles: { title: string; thumbnail: string | null }[] = []
  let total = count
  let format = ''
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: EP_QUERY, variables: { id: animeId } }),
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const json = (await res.json()) as {
        data?: {
          Media?: {
            format?: string | null
            episodes?: number | null
            nextAiringEpisode?: { episode?: number | null } | null
            streamingEpisodes?: { title?: string; thumbnail?: string }[]
          }
        }
      }
      const media = json.data?.Media
      if (media) {
        format = media.format || ''
        const aired = media.nextAiringEpisode?.episode ? media.nextAiringEpisode.episode - 1 : 0
        if (media.episodes) total = media.episodes
        else if (aired > 0) total = aired
        titles = (media.streamingEpisodes || []).map((e) => ({ title: e.title || '', thumbnail: e.thumbnail || null }))
        if (titles.length > total) total = titles.length
      }
    }
  } catch {
    /* AniList sustu, mevcut sayıyla devam */
  }
  if (!total) total = format === 'MOVIE' ? 1 : 12
  const n = Math.min(Math.max(total || 1, 1), 2000)
  return Array.from({ length: n }, (_, i) => ({
    id: 'a' + animeId + '-e' + (i + 1),
    number: i + 1,
    title: titles[i]?.title || '',
    thumbnail: titles[i]?.thumbnail || null,
  }))
})