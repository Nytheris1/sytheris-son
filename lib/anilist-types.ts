export type MediaTitle = {
  romaji?: string | null
  english?: string | null
  native?: string | null
  userPreferred?: string | null
}

export type Trailer = { id: string; site: string } | null

export type MediaCard = {
  id: number
  title: MediaTitle
  coverImage: { extraLarge?: string | null; large?: string | null; color?: string | null }
  bannerImage?: string | null
  format?: string | null
  seasonYear?: number | null
  season?: string | null
  episodes?: number | null
  duration?: number | null
  averageScore?: number | null
  popularity?: number | null
  genres?: string[]
  status?: string | null
  trailer?: Trailer
  description?: string | null
  nextAiringEpisode?: { episode: number; airingAt: number; timeUntilAiring: number } | null
}

export type CharacterEdge = {
  role: string
  node: { id: number; name: { full: string; native?: string | null }; image: { large?: string | null } }
  voiceActors: { id: number; name: { full: string; native?: string | null }; image: { large?: string | null }; languageV2?: string }[]
}

export type MediaDetail = MediaCard & {
  synonyms?: string[]
  source?: string | null
  studios?: { nodes: { id: number; name: string; isAnimationStudio: boolean }[] }
  startDate?: { year?: number | null; month?: number | null; day?: number | null }
  endDate?: { year?: number | null; month?: number | null; day?: number | null }
  meanScore?: number | null
  favourites?: number | null
  isAdult?: boolean
  countryOfOrigin?: string | null
  hashtag?: string | null
  tags?: { id: number; name: string; rank: number; isMediaSpoiler: boolean }[]
  characters?: { edges: CharacterEdge[] }
  staff?: { edges: { role: string; node: { id: number; name: { full: string }; image: { large?: string | null } } }[] }
  relations?: { edges: { relationType: string; node: MediaCard & { type?: string } }[] }
  recommendations?: { nodes: { mediaRecommendation: MediaCard | null }[] }
  stats?: {
    scoreDistribution?: { score: number; amount: number }[]
    statusDistribution?: { status: string; amount: number }[]
  }
  externalLinks?: { id: number; site: string; url: string; type?: string; color?: string | null; icon?: string | null }[]
  rankings?: { id: number; rank: number; type: string; allTime: boolean; context: string; year?: number | null; season?: string | null }[]
}
