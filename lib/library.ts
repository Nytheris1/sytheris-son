import 'server-only'
import { randomBytes } from 'crypto'
import { kvGet, kvSet } from './store'
import type { LibraryList, ListStatus } from './library-types'

export type { LibraryList, ListStatus } from './library-types'

const SYSTEM: { status: ListStatus; name: string; hue: number; description: string }[] = [
  { status: 'watching', name: 'İzliyorum', hue: 155, description: 'Şu an devam ettiğin seriler.' },
  { status: 'planning', name: 'İzleyeceğim', hue: 255, description: 'Sıradaki maceraların.' },
  { status: 'completed', name: 'Tamamladım', hue: 80, description: 'Bitirip kalbine gömdüklerin.' },
  { status: 'paused', name: 'Ara verdim', hue: 45, description: 'Bir gün döneceğin seriler.' },
  { status: 'dropped', name: 'Bıraktım', hue: 25, description: 'Yolların ayrıldığı seriler.' },
]

function seed(): LibraryList[] {
  const now = Date.now()
  return SYSTEM.map((s) => ({ id: s.status, name: s.name, description: s.description, hue: s.hue, system: s.status, items: [], isPublic: true, createdAt: now, updatedAt: now }))
}

export async function getLists(uid: string): Promise<LibraryList[]> {
  const stored = await kvGet<LibraryList[]>(`lists:${uid}`)
  if (!stored || !stored.length) return seed()
  const missing = seed().filter((s) => !stored.some((l) => l.id === s.id))
  return [...stored.filter((l) => l.system), ...missing, ...stored.filter((l) => !l.system)].sort((a, b) => {
    if (a.system && b.system) return SYSTEM.findIndex((s) => s.status === a.system) - SYSTEM.findIndex((s) => s.status === b.system)
    if (a.system) return -1
    if (b.system) return 1
    return a.createdAt - b.createdAt
  })
}

export async function saveLists(uid: string, lists: LibraryList[]) {
  await kvSet(`lists:${uid}`, lists)
}

export function newCustomList(name: string, description: string, hue: number): LibraryList {
  const now = Date.now()
  return { id: randomBytes(6).toString('hex'), name, description, hue, items: [], isPublic: true, createdAt: now, updatedAt: now }
}

export function libraryStats(lists: LibraryList[]) {
  const unique = new Set<number>()
  for (const l of lists) for (const i of l.items) unique.add(i.id)
  const by = (s: ListStatus) => lists.find((l) => l.system === s)?.items.length ?? 0
  return {
    total: unique.size,
    watching: by('watching'),
    planning: by('planning'),
    completed: by('completed'),
    custom: lists.filter((l) => !l.system).length,
  }
}

export function statusOf(lists: LibraryList[], animeId: number): ListStatus | null {
  return lists.find((l) => l.system && l.items.some((i) => i.id === animeId))?.system ?? null
}
