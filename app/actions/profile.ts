'use server'

import { revalidatePath } from 'next/cache'
import { THEME_IDS } from '@/lib/themes'
import { hasTier, isAnimatedMedia, isVideoMedia } from '@/lib/membership'
import { changeUsername, getCurrentUser, saveUser, type ProfileLink, type ProfileSong } from '@/lib/users'

export type ProfileInput = {
  displayName: string
  username: string
  bio: string
  location: string
  avatar: string
  background: string
  backgroundDim: number
  accent: string
  links: ProfileLink[]
  song: ProfileSong
  favorites: number[]
  effects: { tilt: boolean; typewriter: boolean; glow: boolean }
}

const LINK_TYPES = new Set(['discord', 'github', 'instagram', 'x', 'youtube', 'spotify', 'twitch', 'tiktok', 'steam', 'website'])

function safeUrl(u: string) {
  if (!u) return ''
  try {
    const url = new URL(u.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

const DATA_MEDIA = /^data:(image\/(png|jpeg|webp|gif|avif)|video\/(mp4|webm));base64,[a-z0-9+/=]+$/i
const MAX_AVATAR_CHARS = 2.8 * 1024 * 1024
const MAX_BACKGROUND_CHARS = 5.6 * 1024 * 1024

/** Accepts http(s) links or files picked from the device (base64 data URLs), with a size ceiling. */
function safeMedia(u: string, maxChars: number, allowVideo: boolean) {
  if (!u) return ''
  const v = u.trim()
  if (v.startsWith('data:')) {
    if (v.length > maxChars || !DATA_MEDIA.test(v)) return ''
    if (!allowVideo && /^data:video\//i.test(v)) return ''
    return v
  }
  return safeUrl(v)
}

export async function updateProfile(input: ProfileInput) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' }
  try {
    if (input.avatar?.startsWith('data:') && !safeMedia(input.avatar, MAX_AVATAR_CHARS, true)) {
      return { ok: false as const, error: 'Profil fotoğrafı desteklenmiyor ya da 2 MB sınırını aşıyor.' }
    }
    if (input.background?.startsWith('data:') && !safeMedia(input.background, MAX_BACKGROUND_CHARS, true)) {
      return { ok: false as const, error: 'Afiş dosyası desteklenmiyor ya da 4 MB sınırını aşıyor.' }
    }
    const nextAvatar = safeMedia(input.avatar, MAX_AVATAR_CHARS, true)
    const nextBg = safeMedia(input.background, MAX_BACKGROUND_CHARS, true)
    if (nextAvatar && nextAvatar !== user.avatar && isAnimatedMedia(nextAvatar) && !hasTier(user.premium, 'plus')) {
      return { ok: false as const, error: 'GIF ya da MP4 profil fotoğrafı Sytheris+ aboneliği gerektirir.' }
    }
    if (nextBg && isVideoMedia(nextBg) && !hasTier(user.premium, 'plus')) {
      return { ok: false as const, error: 'Video (MP4) afiş Sytheris+ aboneliği gerektirir.' }
    }
    if (nextBg && isAnimatedMedia(nextBg) && !isVideoMedia(nextBg) && !hasTier(user.premium, 'plus')) {
      return { ok: false as const, error: 'Hareketli afiş Sytheris+ aboneliği gerektirir.' }
    }
    if (input.username && input.username !== user.username) await changeUsername(user, input.username)
    user.displayName = (input.displayName || user.displayName).trim().slice(0, 40)
    user.bio = (input.bio || '').slice(0, 300)
    user.location = (input.location || '').slice(0, 60)
    user.avatar = nextAvatar || user.avatar
    user.background = nextBg || null
    user.backgroundDim = Math.min(90, Math.max(0, Math.round(Number(input.backgroundDim) || 0)))
    user.accent = THEME_IDS.includes(input.accent as never) ? input.accent : 'green'
    user.links = (input.links || [])
      .filter((l) => LINK_TYPES.has(l.type))
      .map((l) => ({ type: l.type, url: l.type === 'discord' && !l.url.startsWith('http') ? l.url.slice(0, 40) : safeUrl(l.url) }))
      .filter((l) => l.url)
      .slice(0, 8)
    user.song = input.song && safeUrl(input.song.url) ? { title: input.song.title.slice(0, 100), artist: input.song.artist.slice(0, 100), url: safeUrl(input.song.url), cover: input.song.cover ? safeUrl(input.song.cover) : null } : null
    user.favorites = (input.favorites || []).filter((n) => Number.isInteger(n)).slice(0, 60)
    user.effects = { tilt: Boolean(input.effects?.tilt), typewriter: Boolean(input.effects?.typewriter), glow: Boolean(input.effects?.glow) }
    await saveUser(user)
    revalidatePath(`/u/${user.username}`)
    revalidatePath('/profil')
    return { ok: true as const, username: user.username }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}
