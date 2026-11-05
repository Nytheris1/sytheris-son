import 'server-only'
import { randomBytes } from 'crypto'
import { kvDel, kvGet, kvList, kvSet } from './store'

/* ---------- Site settings ---------- */
export type SiteSettings = {
  maintenance: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  maintenanceEta: string
  announcement: string
  announcementTone: 'info' | 'warning' | 'success'
  introEnabled: boolean
  featuredId: number | null
  registrationsOpen: boolean
  aiEnabled: boolean
}

export const DEFAULT_SETTINGS: SiteSettings = {
  maintenance: false,
  maintenanceTitle: 'Kısa bir moladayız',
  maintenanceMessage: 'Sytheris daha iyi bir deneyim için güncelleniyor. Çok yakında geri döneceğiz.',
  maintenanceEta: '',
  announcement: '',
  announcementTone: 'info',
  introEnabled: true,
  featuredId: null,
  registrationsOpen: true,
  aiEnabled: true,
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const s = await kvGet<Partial<SiteSettings>>('settings')
    return { ...DEFAULT_SETTINGS, ...(s ?? {}) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(patch: Partial<SiteSettings>) {
  const current = await getSettings()
  const next = { ...current, ...patch }
  await kvSet('settings', next)
  return next
}

/* ---------- Episodes ---------- */
export type Episode = {
  id: string
  animeId: number
  animeTitle: string
  animeCover?: string | null
  number: number
  title: string
  videoUrl: string
  subtitleUrl?: string | null
  subtitleText?: string | null
  subtitleLang: string
  thumbnail?: string | null
  createdAt: number
}

export async function listEpisodes(animeId: number) {
  const list = (await kvGet<Episode[]>(`episodes:${animeId}`)) ?? []
  return list.sort((a, b) => a.number - b.number)
}

export async function getEpisode(animeId: number, number: number) {
  const list = await listEpisodes(animeId)
  return list.find((e) => e.number === number) ?? null
}

export async function getEpisodeById(id: string) {
  const index = (await kvGet<Record<string, number>>('episode-index')) ?? {}
  const animeId = index[id]
  if (!animeId) return null
  const list = await listEpisodes(animeId)
  return list.find((e) => e.id === id) ?? null
}

export async function addEpisode(input: Omit<Episode, 'id' | 'createdAt'>) {
  const list = await listEpisodes(input.animeId)
  const existing = list.findIndex((e) => e.number === input.number)
  const ep: Episode = { ...input, id: existing >= 0 ? list[existing].id : randomBytes(8).toString('hex'), createdAt: Date.now() }
  if (existing >= 0) list[existing] = ep
  else list.push(ep)
  await kvSet(`episodes:${input.animeId}`, list)
  const index = (await kvGet<Record<string, number>>('episode-index')) ?? {}
  index[ep.id] = ep.animeId
  await kvSet('episode-index', index)
  const catalog = (await kvGet<Record<string, { title: string; cover?: string | null; count: number; updatedAt: number }>>('episode-catalog')) ?? {}
  catalog[input.animeId] = { title: input.animeTitle, cover: input.animeCover, count: list.length, updatedAt: Date.now() }
  await kvSet('episode-catalog', catalog)
  return ep
}

export async function deleteEpisode(animeId: number, id: string) {
  const list = (await listEpisodes(animeId)).filter((e) => e.id !== id)
  if (list.length) await kvSet(`episodes:${animeId}`, list)
  else await kvDel(`episodes:${animeId}`)
  const catalog = (await kvGet<Record<string, { title: string; cover?: string | null; count: number; updatedAt: number }>>('episode-catalog')) ?? {}
  if (list.length) catalog[animeId] = { ...catalog[animeId], count: list.length, updatedAt: Date.now() }
  else delete catalog[animeId]
  await kvSet('episode-catalog', catalog)
}

export async function getEpisodeCatalog() {
  const catalog = (await kvGet<Record<string, { title: string; cover?: string | null; count: number; updatedAt: number }>>('episode-catalog')) ?? {}
  return Object.entries(catalog)
    .map(([id, v]) => ({ animeId: Number(id), ...v }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

/* ---------- Error logs ---------- */
export type LogEntry = {
  id: string
  level: 'error' | 'warn' | 'info'
  source: 'client' | 'server'
  message: string
  stack?: string
  path?: string
  userAgent?: string
  at: number
}

export async function logEvent(entry: Omit<LogEntry, 'id' | 'at'>) {
  try {
    const list = (await kvGet<LogEntry[]>('logs')) ?? []
    list.unshift({ ...entry, message: entry.message.slice(0, 600), stack: entry.stack?.slice(0, 2000), id: randomBytes(6).toString('hex'), at: Date.now() })
    await kvSet('logs', list.slice(0, 200))
  } catch {
    /* logging must never throw */
  }
}

export async function getLogs() {
  return (await kvGet<LogEntry[]>('logs')) ?? []
}

export async function clearLogs() {
  await kvSet('logs', [])
}

export { kvList }
