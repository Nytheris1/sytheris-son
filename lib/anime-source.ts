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