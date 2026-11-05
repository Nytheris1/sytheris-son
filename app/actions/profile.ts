'use server'

import { revalidatePath } from 'next/cache'
import { THEME_IDS } from '@/lib/themes'
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

export async function updateProfile(input: ProfileInput) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Oturum bulunamadı. Lütfen tekrar giriş yap.' }
  try {
    if (input.username && input.username !== user.username) await changeUsername(user, input.username)
    user.displayName = (input.displayName || user.displayName).trim().slice(0, 40)
    user.bio = (input.bio || '').slice(0, 300)
    user.location = (input.location || '').slice(0, 60)
    user.avatar = safeUrl(input.avatar) || user.avatar
    user.background = safeUrl(input.background) || null
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
