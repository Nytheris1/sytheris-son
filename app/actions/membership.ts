'use server'

import { revalidatePath } from 'next/cache'
import { consumeCode } from '@/lib/community'
import { BANNER_OVERLAYS, COMMENT_COLORS, FRAMES, NAMEPLATES, activeTier, hasTier, type BannerOverlay, type CommentColor, type FrameId, type Nameplate, type Tier } from '@/lib/membership'
import { getCurrentUser, saveUser } from '@/lib/users'

const tries = new Map<string, { n: number; at: number }>()

export async function redeemCode(code: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Kod kullanmak için giriş yap.' }
  const t = tries.get(user.id)
  if (t && Date.now() - t.at < 10 * 60_000 && t.n >= 8) return { ok: false as const, error: 'Çok fazla deneme. Biraz sonra tekrar dene.' }
  tries.set(user.id, t && Date.now() - t.at < 10 * 60_000 ? { n: t.n + 1, at: t.at } : { n: 1, at: Date.now() })

  const res = await consumeCode(code, user.id)
  if (!res.ok) return res
  const now = Date.now()
  const current = activeTier(user.premium)
  const base = current !== 'free' && user.premium?.until && user.premium.until > now ? user.premium.until : now
  const tier = current === 'ultra' && res.code.tier === 'plus' ? 'ultra' : res.code.tier
  user.premium = { tier, since: user.premium?.since ?? now, until: base + res.code.days * 86400_000 }
  await saveUser(user)
  revalidatePath('/', 'layout')
  return { ok: true as const, tier, until: user.premium.until }
}

export async function setFrame(frame: FrameId) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const def = FRAMES.find((f) => f.id === frame)
  if (!def) return { ok: false as const, error: 'Geçersiz çerçeve.' }
  if (!hasTier(user.premium, def.tier)) return { ok: false as const, error: `${def.name} çerçevesi ${def.tier === 'ultra' ? 'Ultra' : 'Sytheris+'} gerektirir.` }
  user.frame = frame
  await saveUser(user)
  revalidatePath('/', 'layout')
  return { ok: true as const }
}


const needLabel = (t: Tier) => (t === 'ultra' ? 'Ultra' : 'Sytheris+')

export async function setBannerOverlay(overlay: BannerOverlay) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const def = BANNER_OVERLAYS.find((b) => b.id === overlay)
  if (!def) return { ok: false as const, error: 'Geçersiz efekt.' }
  if (!hasTier(user.premium, def.tier)) return { ok: false as const, error: `${def.name} efekti ${needLabel(def.tier)} gerektirir.` }
  user.bannerOverlay = overlay
  // Overlays replace the old full-background presets; clear the legacy value so it can't resurface.
  user.bannerPreset = 'none'
  await saveUser(user)
  revalidatePath('/', 'layout')
  return { ok: true as const }
}

/** Awards the "Gece Yarısı Seansı" badge the first time a premium member opens a horror short. */
export async function markMidnightScreening() {
  const user = await getCurrentUser()
  if (!user || !hasTier(user.premium, 'plus')) return { ok: false as const }
  if (user.badges?.includes('midnight')) return { ok: true as const, awarded: false }
  user.badges = [...(user.badges ?? []), 'midnight']
  await saveUser(user)
  return { ok: true as const, awarded: true }
}

export async function setNameplate(plate: Nameplate) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const def = NAMEPLATES.find((p) => p.id === plate)
  if (!def) return { ok: false as const, error: 'Geçersiz isim plakası.' }
  if (!hasTier(user.premium, def.tier)) return { ok: false as const, error: `${def.name} plakası ${needLabel(def.tier)} gerektirir.` }
  user.nameplate = plate
  await saveUser(user)
  revalidatePath('/', 'layout')
  return { ok: true as const }
}

export async function setCommentColor(color: CommentColor) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const def = COMMENT_COLORS.find((c) => c.id === color)
  if (!def) return { ok: false as const, error: 'Geçersiz renk.' }
  if (!hasTier(user.premium, def.tier)) return { ok: false as const, error: `${def.name} rengi ${needLabel(def.tier)} gerektirir.` }
  user.commentColor = color
  await saveUser(user)
  revalidatePath('/', 'layout')
  return { ok: true as const }
}
