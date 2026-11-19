'use server'

import { revalidatePath } from 'next/cache'
import { addComment, addReport, removeComment, toggleLike } from '@/lib/community'
import { getCurrentUser } from '@/lib/users'

const recent = new Map<string, number>()

const GIF_HOSTS = /^https:\/\/(nekos\.best\/api\/v2\/|media\d*\.giphy\.com\/|i\.giphy\.com\/)/

export async function postComment(animeId: number, animeTitle: string, text: string, spoiler: boolean, gif?: string | null) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Yorum yazmak için giriş yap.' }
  if (!Number.isInteger(animeId) || animeId <= 0) return { ok: false as const, error: 'Geçersiz anime.' }
  const clean = text.replace(/\s+\n/g, '\n').trim().slice(0, 1200)
  const safeGif = gif && GIF_HOSTS.test(gif) && gif.length < 400 ? gif : null
  if (gif && !safeGif) return { ok: false as const, error: 'Bu GIF kaynağı desteklenmiyor.' }
  if (clean.length < 2 && !safeGif) return { ok: false as const, error: 'Yorum çok kısa.' }
  const last = recent.get(user.id) ?? 0
  if (Date.now() - last < 15_000) return { ok: false as const, error: 'Biraz yavaşla — 15 saniyede bir yorum yazabilirsin.' }
  recent.set(user.id, Date.now())
  const c = await addComment({ animeId, animeTitle: animeTitle.slice(0, 200), uid: user.id, text: clean, spoiler: Boolean(spoiler), gif: safeGif })
  revalidatePath(`/anime/${animeId}`)
  return { ok: true as const, id: c.id }
}

export async function likeComment(animeId: number, id: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Beğenmek için giriş yap.' }
  const c = await toggleLike(animeId, id, user.id)
  if (!c) return { ok: false as const, error: 'Yorum bulunamadı.' }
  return { ok: true as const, liked: c.likes.includes(user.id), count: c.likes.length }
}

export async function deleteMyComment(animeId: number, id: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const { listComments } = await import('@/lib/community')
  const c = (await listComments(animeId)).find((x) => x.id === id)
  if (!c || c.uid !== user.id) return { ok: false as const, error: 'Bu yorumu silemezsin.' }
  await removeComment(animeId, id)
  revalidatePath(`/anime/${animeId}`)
  return { ok: true as const }
}

export async function reportContent(input: { kind: 'comment' | 'user'; targetId: string; animeId?: number; reason: string; snapshot: string }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Bildirmek için giriş yap.' }
  const reason = input.reason.trim().slice(0, 200)
  if (!reason) return { ok: false as const, error: 'Bir neden seç.' }
  const r = await addReport({ kind: input.kind, targetId: input.targetId.slice(0, 64), animeId: input.animeId, reason, by: user.id, snapshot: input.snapshot.slice(0, 400) })
  if (!r) return { ok: false as const, error: 'Bunu zaten bildirdin; ekibimiz inceliyor.' }
  return { ok: true as const }
}
