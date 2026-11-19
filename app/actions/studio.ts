'use server'

import { revalidatePath } from 'next/cache'
import {
  ART_LIMITS,
  clearDraft,
  createArtwork,
  deleteArtwork,
  getArtwork,
  isImageDataUrl,
  saveDraft as storeDraft,
  toggleArtworkLike,
  type Draft,
} from '@/lib/artworks'
import { audit } from '@/lib/community'
import { hasTier } from '@/lib/membership'
import { getCurrentUser, saveUser } from '@/lib/users'

const BLENDS = new Set(['source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'soft-light', 'hard-light', 'difference'])
const publishLog = new Map<string, number[]>()

async function premiumUser() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Atölyeyi kullanmak için giriş yap.' as const }
  if (user.banned) return { error: 'Hesabın askıya alınmış.' as const }
  if (!hasTier(user.premium, 'plus')) return { error: 'Çizim Atölyesi Sytheris+ üyelerine özel.' as const }
  return { user }
}

function cleanTitle(raw: unknown) {
  const t = typeof raw === 'string' ? raw.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim() : ''
  return t.slice(0, ART_LIMITS.titleLen) || 'İsimsiz eser'
}

export async function saveStudioDraft(input: Draft) {
  const auth = await premiumUser()
  if ('error' in auth) return { ok: false as const, error: auth.error }
  const w = Math.round(Number(input?.w))
  const h = Math.round(Number(input?.h))
  if (!(w >= 256 && w <= 2400 && h >= 256 && h <= 2400)) return { ok: false as const, error: 'Geçersiz tuval boyutu.' }
  if (!Array.isArray(input.layers) || input.layers.length < 1 || input.layers.length > 24) return { ok: false as const, error: 'Katman sayısı 1 ile 24 arasında olmalı.' }
  let total = 0
  const layers = []
  for (const l of input.layers) {
    if (!isImageDataUrl(l.data, ART_LIMITS.draftBytes)) return { ok: false as const, error: 'Katman verisi okunamadı.' }
    total += l.data.length
    layers.push({
      id: String(l.id).slice(0, 24),
      name: cleanTitle(l.name).slice(0, 32),
      visible: Boolean(l.visible),
      opacity: Math.min(1, Math.max(0, Number(l.opacity) || 0)),
      blend: BLENDS.has(l.blend) ? l.blend : 'source-over',
      data: l.data,
    })
  }
  if (total > ART_LIMITS.draftBytes * 1.37) return { ok: false as const, error: 'Taslak çok büyük. Bazı katmanları birleştirip tekrar dene.' }
  await storeDraft(auth.user.id, { w, h, layers, at: Date.now(), title: cleanTitle(input.title) })
  return { ok: true as const, at: Date.now() }
}

export async function discardStudioDraft() {
  const auth = await premiumUser()
  if ('error' in auth) return { ok: false as const, error: auth.error }
  await clearDraft(auth.user.id)
  return { ok: true as const }
}

export async function publishArtwork(input: { title: string; image: string; thumb: string; width: number; height: number; effort?: number; layers?: number }) {
  const auth = await premiumUser()
  if ('error' in auth) return { ok: false as const, error: auth.error }
  const { user } = auth

  const now = Date.now()
  const recent = (publishLog.get(user.id) ?? []).filter((t) => now - t < 10 * 60_000)
  if (recent.length >= 6) return { ok: false as const, error: 'Çok hızlı paylaşıyorsun. Biraz nefes al, sonra tekrar dene.' }

  if (!isImageDataUrl(input.image, ART_LIMITS.imageBytes)) return { ok: false as const, error: 'Görsel çok büyük ya da geçersiz.' }
  if (!isImageDataUrl(input.thumb, ART_LIMITS.thumbBytes)) return { ok: false as const, error: 'Önizleme oluşturulamadı.' }
  const width = Math.round(Number(input.width))
  const height = Math.round(Number(input.height))
  if (!(width > 0 && width <= 2400 && height > 0 && height <= 2400)) return { ok: false as const, error: 'Geçersiz boyut.' }

  const art = await createArtwork({
    uid: user.id,
    title: cleanTitle(input.title),
    width,
    height,
    image: input.image,
    thumb: input.thumb,
    effort: Math.min(60 * 60 * 24, Math.max(0, Math.round(Number(input.effort) || 0))),
    layers: Math.min(24, Math.max(1, Math.round(Number(input.layers) || 1))),
  })
  publishLog.set(user.id, [...recent, now])

  let awarded = false
  if (!user.badges?.includes('painter')) {
    user.badges = [...(user.badges ?? []), 'painter']
    awarded = true
    await saveUser(user)
  }
  revalidatePath('/atolye')
  return { ok: true as const, id: art.id, awarded }
}

export async function likeArtwork(id: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Beğenmek için giriş yap.' }
  const art = await toggleArtworkLike(String(id).slice(0, 32), user.id)
  if (!art) return { ok: false as const, error: 'Eser bulunamadı.' }
  return { ok: true as const, liked: art.likes.includes(user.id), count: art.likes.length }
}

export async function removeArtwork(id: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const art = await getArtwork(String(id).slice(0, 32))
  if (!art) return { ok: false as const, error: 'Eser bulunamadı.' }
  const staff = user.role === 'admin' || user.role === 'moderator'
  if (art.uid !== user.id && !staff) return { ok: false as const, error: 'Bu eseri yalnızca sahibi kaldırabilir.' }
  await deleteArtwork(art.id)
  if (staff && art.uid !== user.id) await audit(user.username, 'art:remove', `${art.id} · ${art.title}`)
  revalidatePath('/atolye')
  return { ok: true as const }
}
