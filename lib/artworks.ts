import 'server-only'
import { randomBytes } from 'crypto'
import { kvDel, kvGet, kvSet } from './store'

/**
 * Çizim Atölyesi storage. Images live under their own keys so the gallery
 * listing only ships metadata; pixels are served by /api/art/[id].
 */

export type Artwork = {
  id: string
  uid: string
  title: string
  width: number
  height: number
  at: number
  likes: string[]
  hidden?: boolean
  /** Rough brush-time in seconds, shown as "x dk emek" */
  effort?: number
  layers?: number
}

type ArtPixels = { image: string; thumb: string }
type FeedRef = { id: string; uid: string; at: number }

export type DraftLayer = { id: string; name: string; visible: boolean; opacity: number; blend: string; data: string }
export type Draft = { w: number; h: number; layers: DraftLayer[]; at: number; title?: string }

export const ART_LIMITS = {
  imageBytes: 2_200_000,
  thumbBytes: 400_000,
  /** Keeps a full draft (base64) under the 8 MB server action body limit. */
  draftBytes: 5_400_000,
  perUser: 60,
  feed: 600,
  titleLen: 60,
}

const DATA_URL = /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/

/** Accepts only base64 WebP / PNG / JPEG data URLs whose decoded size stays under `maxBytes`. */
export function isImageDataUrl(s: unknown, maxBytes: number): s is string {
  return typeof s === 'string' && s.length <= Math.ceil(maxBytes * 1.37) + 32 && DATA_URL.test(s)
}

export async function getArtwork(id: string) {
  return kvGet<Artwork>(`art:${id}`)
}

export async function getArtPixels(id: string) {
  return kvGet<ArtPixels>(`art-px:${id}`)
}

export async function listArtworks(limit = 120) {
  const feed = (await kvGet<FeedRef[]>('art-feed')) ?? []
  const items = await Promise.all(feed.slice(0, limit).map((r) => getArtwork(r.id)))
  return items.filter((a): a is Artwork => Boolean(a && !a.hidden))
}

export async function listUserArtworks(uid: string) {
  const ids = (await kvGet<string[]>(`art-user:${uid}`)) ?? []
  const items = await Promise.all(ids.map((id) => getArtwork(id)))
  return items.filter((a): a is Artwork => Boolean(a && !a.hidden))
}

export async function createArtwork(input: { uid: string; title: string; width: number; height: number; image: string; thumb: string; effort?: number; layers?: number }) {
  const id = randomBytes(7).toString('hex')
  const art: Artwork = {
    id,
    uid: input.uid,
    title: input.title,
    width: input.width,
    height: input.height,
    at: Date.now(),
    likes: [],
    effort: input.effort,
    layers: input.layers,
  }
  await kvSet(`art-px:${id}`, { image: input.image, thumb: input.thumb } satisfies ArtPixels)
  await kvSet(`art:${id}`, art)
  const feed = (await kvGet<FeedRef[]>('art-feed')) ?? []
  feed.unshift({ id, uid: input.uid, at: art.at })
  await kvSet('art-feed', feed.slice(0, ART_LIMITS.feed))
  const mine = (await kvGet<string[]>(`art-user:${input.uid}`)) ?? []
  mine.unshift(id)
  const overflow = mine.slice(ART_LIMITS.perUser)
  await kvSet(`art-user:${input.uid}`, mine.slice(0, ART_LIMITS.perUser))
  await Promise.all(overflow.map((old) => removeArtworkData(old)))
  return art
}

async function removeArtworkData(id: string) {
  await Promise.all([kvDel(`art:${id}`), kvDel(`art-px:${id}`)])
}

export async function deleteArtwork(id: string) {
  const art = await getArtwork(id)
  if (!art) return null
  await removeArtworkData(id)
  const feed = (await kvGet<FeedRef[]>('art-feed')) ?? []
  await kvSet(
    'art-feed',
    feed.filter((r) => r.id !== id),
  )
  const mine = (await kvGet<string[]>(`art-user:${art.uid}`)) ?? []
  await kvSet(
    `art-user:${art.uid}`,
    mine.filter((x) => x !== id),
  )
  return art
}

export async function toggleArtworkLike(id: string, uid: string) {
  const art = await getArtwork(id)
  if (!art || art.hidden) return null
  art.likes = art.likes.includes(uid) ? art.likes.filter((u) => u !== uid) : [...art.likes, uid]
  await kvSet(`art:${id}`, art)
  return art
}

export async function getDraft(uid: string) {
  return kvGet<Draft>(`art-draft:${uid}`)
}

export async function saveDraft(uid: string, draft: Draft) {
  await kvSet(`art-draft:${uid}`, draft)
}

export async function clearDraft(uid: string) {
  await kvDel(`art-draft:${uid}`)
}
