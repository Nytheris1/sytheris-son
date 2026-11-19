import { cache } from 'react'

export type AnimeProvider = { id: string; label: string; build: (animeId: number, ep: number) => string }

/** AniList id + episode; the player resolves the stream itself, so every title works without manual entry. */
export const SUB_PROVIDERS: AnimeProvider[] = [
  { id: 'animeembed', label: 'AnimeEmbed', build: (a, e) => 'https://animeembed.com/embed/anilist/' + a + '/' + e + '?track=sub&lang=tr' },
  { id: 'tryembed', label: 'TryEmbed', build: (a, e) => 'https://tryembed.us.cc/embed/anime/' + a + '/' + e + '/sub?lang=tr' },
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
const EP_QUERY = 'query ($id: Int) { Media(id: $id) { episodes streamingEpisodes { title thumbnail } } }'

export type AniEpisode = { id: string; number: number; title: string; thumbnail: string | null }

/**
 * Real episode titles and stills come from AniList's streamingEpisodes. The count follows AniList's own
 * episode number, so a title with 8 episodes never lists 12. Falls back to `count` when AniList is silent.
 */
export const aniEpisodes = cache(async (animeId: number, count: number): Promise<AniEpisode[]> => {
  let titles: { title: string; thumbnail: string | null }[] = []
  let total = count
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query: EP_QUERY, variables: { id: animeId } }),
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { Media?: { episodes?: number | null; streamingEpisodes?: { title?: string; thumbnail?: string }[] } }
      }
      const media = json.data?.Media
      if (media) {
        if (media.episodes) total = media.episodes
        titles = (media.streamingEpisodes || []).map((e) => ({ title: e.title || '', thumbnail: e.thumbnail || null }))
        if (titles.length > total) total = titles.length
      }
    }
  } catch {
    /* AniList sustu, mevcut sayıyla devam */
  }
  const n = Math.min(Math.max(total || 1, 1), 2000)
  return Array.from({ length: n }, (_, i) => ({
    id: 'a' + animeId + '-e' + (i + 1),
    number: i + 1,
    title: titles[i]?.title || '',
    thumbnail: titles[i]?.thumbnail || null,
  }))
})