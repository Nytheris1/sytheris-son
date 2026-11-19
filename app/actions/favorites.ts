'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, saveUser } from '@/lib/users'

export async function toggleFavorite(animeId: number) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, reason: 'auth' as const }
  if (!Number.isInteger(animeId) || animeId <= 0) return { ok: false as const, reason: 'invalid' as const }
  const has = user.favorites.includes(animeId)
  user.favorites = has ? user.favorites.filter((id) => id !== animeId) : [animeId, ...user.favorites].slice(0, 60)
  await saveUser(user)
  revalidatePath(`/u/${user.username}`)
  return { ok: true as const, favorite: !has }
}
