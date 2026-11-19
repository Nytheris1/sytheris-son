'use server'

import { revalidatePath } from 'next/cache'
import { getLists, newCustomList, saveLists } from '@/lib/library'
import type { ListStatus } from '@/lib/library-types'
import { LIST_LIMIT, activeTier } from '@/lib/membership'
import { getCurrentUser } from '@/lib/users'

const STATUSES: ListStatus[] = ['watching', 'planning', 'completed', 'paused', 'dropped']

function validId(n: number) {
  return Number.isInteger(n) && n > 0 && n < 10_000_000
}

export async function setAnimeStatus(animeId: number, status: ListStatus | null) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  if (!validId(animeId)) return { ok: false as const, error: 'Geçersiz anime.' }
  if (status && !STATUSES.includes(status)) return { ok: false as const, error: 'Geçersiz durum.' }
  const lists = await getLists(user.id)
  for (const l of lists) if (l.system) l.items = l.items.filter((i) => i.id !== animeId)
  if (status) {
    const target = lists.find((l) => l.system === status)
    if (target) {
      target.items.unshift({ id: animeId, addedAt: Date.now() })
      target.updatedAt = Date.now()
    }
  }
  await saveLists(user.id, lists)
  revalidatePath('/kutuphane')
  return { ok: true as const, status }
}

export async function toggleInList(listId: string, animeId: number) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  if (!validId(animeId)) return { ok: false as const, error: 'Geçersiz anime.' }
  const lists = await getLists(user.id)
  const list = lists.find((l) => l.id === listId && !l.system)
  if (!list) return { ok: false as const, error: 'Liste bulunamadı.' }
  const has = list.items.some((i) => i.id === animeId)
  list.items = has ? list.items.filter((i) => i.id !== animeId) : [{ id: animeId, addedAt: Date.now() }, ...list.items].slice(0, 500)
  list.updatedAt = Date.now()
  await saveLists(user.id, lists)
  revalidatePath('/kutuphane')
  return { ok: true as const, added: !has }
}

export async function removeFromList(listId: string, animeId: number) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const lists = await getLists(user.id)
  const list = lists.find((l) => l.id === listId)
  if (!list) return { ok: false as const, error: 'Liste bulunamadı.' }
  list.items = list.items.filter((i) => i.id !== animeId)
  list.updatedAt = Date.now()
  await saveLists(user.id, lists)
  revalidatePath('/kutuphane')
  return { ok: true as const }
}

export async function createList(input: { name: string; description: string; hue: number }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const name = input.name.trim().slice(0, 40)
  if (name.length < 2) return { ok: false as const, error: 'Liste adı en az 2 karakter olmalı.' }
  const lists = await getLists(user.id)
  const limit = LIST_LIMIT[activeTier(user.premium)]
  if (lists.filter((l) => !l.system).length >= limit) return { ok: false as const, error: `Liste sınırına ulaştın (${limit}). Sytheris+ ile daha fazlasını aç.` }
  const hue = Number.isFinite(input.hue) ? Math.round(input.hue) % 360 : 155
  const list = newCustomList(name, input.description.trim().slice(0, 140), hue)
  lists.push(list)
  await saveLists(user.id, lists)
  revalidatePath('/kutuphane')
  return { ok: true as const, id: list.id }
}

export async function updateList(id: string, input: { name: string; description: string; hue: number; isPublic: boolean }) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const lists = await getLists(user.id)
  const list = lists.find((l) => l.id === id && !l.system)
  if (!list) return { ok: false as const, error: 'Liste bulunamadı.' }
  const name = input.name.trim().slice(0, 40)
  if (name.length < 2) return { ok: false as const, error: 'Liste adı en az 2 karakter olmalı.' }
  list.name = name
  list.description = input.description.trim().slice(0, 140)
  list.hue = Math.round(input.hue) % 360
  list.isPublic = Boolean(input.isPublic)
  list.updatedAt = Date.now()
  await saveLists(user.id, lists)
  revalidatePath('/kutuphane')
  return { ok: true as const }
}

export async function deleteList(id: string) {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, error: 'Giriş yapmalısın.' }
  const lists = await getLists(user.id)
  if (!lists.some((l) => l.id === id && !l.system)) return { ok: false as const, error: 'Sistem listeleri silinemez.' }
  await saveLists(
    user.id,
    lists.filter((l) => l.id !== id),
  )
  revalidatePath('/kutuphane')
  return { ok: true as const }
}
