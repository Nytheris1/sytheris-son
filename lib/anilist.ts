import 'server-only'
import type { MediaCard, MediaDetail } from './anilist-types'
import { currentSeason } from './format'

const ENDPOINT = 'https://graphql.anilist.co'

export async function anilist<T>(query: string, variables: Record<string, unknown> = {}, revalidate = 1800): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        next: { revalidate },
      })
      if (res.status === 429 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200))
        continue
      }
      const json = await res.json()
      if (json.errors && !json.data) {
        console.error('[anilist]', json.errors?.[0]?.message)
        return null
      }
      return json.data as T
    } catch (e) {
      console.error('[anilist] fetch failed', (e as Error).message)
      if (attempt === 0) continue
      return null
    }
  }
  return null
}

export const CARD = `
  id
  title { romaji english native userPreferred }
  coverImage { extraLarge large color }
  bannerImage
  format
  season
  seasonYear
  episodes
  duration
  averageScore
  popularity
  genres
  status
  trailer { id site }
  nextAiringEpisode { episode airingAt timeUntilAiring }
`

export async function getHomeData() {
  const { season, year } = currentSeason()
  const query = `
    query ($season: MediaSeason, $year: Int) {
      hero: Page(perPage: 6) { media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${CARD} description(asHtml: false) } }
      top: Page(perPage: 10) { media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false, status_in: [RELEASING, FINISHED]) { ${CARD} } }
      seasonal: Page(perPage: 18) { media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) { ${CARD} } }
      allTime: Page(perPage: 18) { media(type: ANIME, sort: SCORE_DESC, isAdult: false) { ${CARD} } }
      popular: Page(perPage: 18) { media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${CARD} } }
      upcoming: Page(perPage: 18) { media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) { ${CARD} } }
      pick: Page(perPage: 1, page: 2) { media(type: ANIME, sort: TRENDING_DESC, isAdult: false, format_in: [TV, ONA, MOVIE]) { ${CARD} description(asHtml: false) } }
    }`
  type R = Record<'hero' | 'top' | 'seasonal' | 'allTime' | 'popular' | 'upcoming' | 'pick', { media: MediaCard[] }>
  const data = await anilist<R>(query, { season, year }, 1800)
  return {
    season,
    year,
    hero: data?.hero.media ?? [],
    top: data?.top.media ?? [],
    seasonal: data?.seasonal.media ?? [],
    allTime: data?.allTime.media ?? [],
    popular: data?.popular.media ?? [],
    upcoming: data?.upcoming.media ?? [],
    pick: data?.pick.media?.[0] ?? null,
  }
}

export async function getIntroCovers() {
  const data = await anilist<{ Page: { media: { coverImage: { extraLarge?: string; large?: string } }[] } }>(
    `query { Page(perPage: 36) { media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { coverImage { extraLarge large } } } }`,
    {},
    86400,
  )
  return (data?.Page.media ?? []).map((m) => m.coverImage.extraLarge || m.coverImage.large || '').filter(Boolean)
}

export async function getAnime(id: number) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${CARD}
        description(asHtml: false)
        synonyms source meanScore favourites isAdult countryOfOrigin hashtag
        startDate { year month day }
        endDate { year month day }
        studios { nodes { id name isAnimationStudio } }
        tags { id name rank isMediaSpoiler }
        characters(sort: [ROLE, RELEVANCE], perPage: 18) {
          edges { role node { id name { full native } image { large } }
            voiceActors(language: JAPANESE, sort: RELEVANCE) { id name { full native } image { large } languageV2 } }
        }
        staff(perPage: 10, sort: RELEVANCE) { edges { role node { id name { full } image { large } } } }
        relations { edges { relationType node { ${CARD} type } } }
        recommendations(perPage: 12, sort: RATING_DESC) { nodes { mediaRecommendation { ${CARD} } } }
        stats { scoreDistribution { score amount } statusDistribution { status amount } }
        externalLinks { id site url type color icon }
        rankings { id rank type allTime context year season }
      }
    }`
  const data = await anilist<{ Media: MediaDetail }>(query, { id }, 3600)
  return data?.Media ?? null
}

export async function getAnimeMeta(id: number) {
  const data = await anilist<{ Media: MediaCard }>(`query ($id:Int){ Media(id:$id, type: ANIME){ ${CARD} description(asHtml:false) } }`, { id }, 3600)
  return data?.Media ?? null
}

export type CharacterDetail = {
  id: number
  name: { full: string; native?: string | null; alternative?: string[] }
  image: { large?: string | null }
  description?: string | null
  gender?: string | null
  age?: string | null
  bloodType?: string | null
  dateOfBirth?: { year?: number | null; month?: number | null; day?: number | null }
  favourites?: number | null
  media: {
    edges: {
      characterRole: string
      node: MediaCard
      voiceActors: { id: number; name: { full: string }; image: { large?: string | null }; languageV2?: string }[]
    }[]
  }
}

export async function getCharacter(id: number) {
  const query = `
    query ($id: Int) {
      Character(id: $id) {
        id name { full native alternative } image { large } description(asHtml: false)
        gender age bloodType dateOfBirth { year month day } favourites
        media(sort: POPULARITY_DESC, type: ANIME, perPage: 24) {
          edges { characterRole node { ${CARD} } voiceActors(sort: RELEVANCE) { id name { full } image { large } languageV2 } }
        }
      }
    }`
  const data = await anilist<{ Character: CharacterDetail }>(query, { id }, 86400)
  return data?.Character ?? null
}

export type StaffDetail = {
  id: number
  name: { full: string; native?: string | null }
  image: { large?: string | null }
  description?: string | null
  primaryOccupations?: string[]
  gender?: string | null
  age?: number | null
  homeTown?: string | null
  languageV2?: string | null
  yearsActive?: number[]
  dateOfBirth?: { year?: number | null; month?: number | null; day?: number | null }
  favourites?: number | null
  characterMedia: {
    edges: {
      characterRole: string
      node: MediaCard
      characters: { id: number; name: { full: string }; image: { large?: string | null } }[]
    }[]
  }
}

export async function getStaff(id: number) {
  const query = `
    query ($id: Int) {
      Staff(id: $id) {
        id name { full native } image { large } description(asHtml: false)
        primaryOccupations gender age homeTown languageV2 yearsActive dateOfBirth { year month day } favourites
        characterMedia(sort: POPULARITY_DESC, perPage: 30) {
          edges { characterRole node { ${CARD} } characters { id name { full } image { large } } }
        }
      }
    }`
  const data = await anilist<{ Staff: StaffDetail }>(query, { id }, 86400)
  return data?.Staff ?? null
}

export type SearchParams = {
  q?: string
  genre?: string
  year?: number
  season?: string
  format?: string
  status?: string
  sort?: string
  page?: number
}

export async function searchAnime(p: SearchParams) {
  const query = `
    query ($page: Int, $search: String, $genre: String, $year: Int, $season: MediaSeason, $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage total currentPage }
        media(type: ANIME, isAdult: false, search: $search, genre: $genre, seasonYear: $year, season: $season, format: $format, status: $status, sort: $sort) { ${CARD} }
      }
    }`
  const sort = p.sort || (p.q ? 'SEARCH_MATCH' : 'POPULARITY_DESC')
  const data = await anilist<{ Page: { pageInfo: { hasNextPage: boolean; total: number; currentPage: number }; media: MediaCard[] } }>(
    query,
    {
      page: p.page || 1,
      search: p.q || undefined,
      genre: p.genre || undefined,
      year: p.year || undefined,
      season: p.season || undefined,
      format: p.format || undefined,
      status: p.status || undefined,
      sort: [sort],
    },
    900,
  )
  return data?.Page ?? { pageInfo: { hasNextPage: false, total: 0, currentPage: 1 }, media: [] }
}

export async function quickSearch(q: string) {
  const data = await anilist<{ Page: { media: MediaCard[] } }>(
    `query ($q: String) { Page(perPage: 8) { media(type: ANIME, search: $q, isAdult: false, sort: SEARCH_MATCH) { ${CARD} } } }`,
    { q },
    600,
  )
  return data?.Page.media ?? []
}

export type ScheduleItem = { id: number; episode: number; airingAt: number; media: MediaCard }

export async function getSchedule() {
  const now = Math.floor(Date.now() / 1000)
  const start = now - (now % 86400) - 3 * 3600
  const end = start + 7 * 86400
  const query = `
    query ($start: Int, $end: Int, $page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo { hasNextPage }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) { id episode airingAt media { ${CARD} isAdult } }
      }
    }`
  const all: ScheduleItem[] = []
  for (let page = 1; page <= 4; page++) {
    const data = await anilist<{ Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: (ScheduleItem & { media: MediaCard & { isAdult?: boolean } })[] } }>(
      query,
      { start, end, page },
      1800,
    )
    if (!data) break
    all.push(...data.Page.airingSchedules.filter((s) => !s.media.isAdult))
    if (!data.Page.pageInfo.hasNextPage) break
  }
  return all
}

export async function getRandomPool(genre?: string) {
  const page = Math.floor(Math.random() * 20) + 1
  const data = await anilist<{ Page: { media: (MediaCard & { description?: string })[] } }>(
    `query ($page: Int, $genre: String) { Page(page: $page, perPage: 50) { media(type: ANIME, isAdult: false, genre: $genre, sort: POPULARITY_DESC, averageScore_greater: 60) { ${CARD} description(asHtml:false) } } }`,
    { page, genre: genre || undefined },
    3600,
  )
  return data?.Page.media ?? []
}

export async function getManyAnime(ids: number[]) {
  if (!ids.length) return []
  const data = await anilist<{ Page: { media: MediaCard[] } }>(
    `query ($ids: [Int]) { Page(perPage: 50) { media(id_in: $ids, type: ANIME) { ${CARD} } } }`,
    { ids },
    3600,
  )
  const media = data?.Page.media ?? []
  return ids.map((id) => media.find((m) => m.id === id)).filter(Boolean) as MediaCard[]
}

export async function getCompare(ids: number[]) {
  if (!ids.length) return []
  const data = await anilist<{ Page: { media: MediaDetail[] } }>(
    `query ($ids: [Int]) { Page(perPage: 2) { media(id_in: $ids, type: ANIME) { ${CARD} meanScore favourites source
      studios(isMain: true) { nodes { id name isAnimationStudio } }
      startDate { year month day }
      rankings { id rank type allTime context year season }
      stats { statusDistribution { status amount } } } } }`,
    { ids },
    3600,
  )
  const media = data?.Page.media ?? []
  return ids.map((id) => media.find((m) => m.id === id)).filter(Boolean) as MediaDetail[]
}
