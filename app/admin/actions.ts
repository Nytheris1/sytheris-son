'use server'

import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { ADMIN_COOKIE, cookieOptions, isAdmin, safeEqual, sign } from '@/lib/session'
import { addEpisode, clearLogs, deleteEpisode, logEvent, saveSettings, type SiteSettings } from '@/lib/site'
import { storeHealth } from '@/lib/store'
import { getUser, saveUser } from '@/lib/users'

const attempts = new Map<string, { n: number; at: number }>()

async function guard() {
  if (!(await isAdmin())) throw new Error('Yetkisiz işlem')
}

export async function adminLogin(_: unknown, formData: FormData) {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const a = attempts.get(ip)
  if (a && now - a.at < 15 * 60_000 && a.n >= 6) return { error: 'Çok fazla hatalı deneme. 15 dakika sonra tekrar dene.' }
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return { error: 'ADMIN_PASSWORD ortam değişkeni tanımlı değil. Vercel proje ayarlarından (Vars) ekleyin.' }
  const password = String(formData.get('password') ?? '')
  if (!password || !safeEqual(password, expected)) {
    attempts.set(ip, a && now - a.at < 15 * 60_000 ? { n: a.n + 1, at: a.at } : { n: 1, at: now })
    await logEvent({ level: 'warn', source: 'server', message: `Hatalı admin girişi denemesi (${ip})`, path: '/admin' })
    return { error: 'Şifre hatalı.' }
  }
  attempts.delete(ip)
  const store = await cookies()
  store.set(ADMIN_COOKIE, sign({ admin: true, exp: Date.now() + 12 * 3600_000 }), cookieOptions(12 * 3600))
  revalidatePath('/admin')
  return { ok: true }
}

export async function adminLogout() {
  const store = await cookies()
  store.set(ADMIN_COOKIE, '', cookieOptions(0))
  revalidatePath('/admin')
}

export async function saveSiteSettings(patch: Partial<SiteSettings>) {
  await guard()
  const next = await saveSettings(patch)
  revalidatePath('/', 'layout')
  return next
}

export async function addEpisodeAction(input: {
  animeId: number
  animeTitle: string
  animeCover?: string | null
  number: number
  title: string
  videoUrl: string
  subtitleUrl?: string
  subtitleText?: string
  subtitleLang: string
  thumbnail?: string
}) {
  await guard()
  const isUrl = (u?: string) => {
    if (!u) return false
    try {
      const p = new URL(u).protocol
      return p === 'https:' || p === 'http:'
    } catch {
      return false
    }
  }
  if (!Number.isInteger(input.animeId) || input.animeId <= 0) return { ok: false as const, error: 'Anime seçmelisin.' }
  if (!Number.isInteger(input.number) || input.number <= 0 || input.number > 5000) return { ok: false as const, error: 'Geçerli bir bölüm numarası gir.' }
  if (!isUrl(input.videoUrl)) return { ok: false as const, error: 'Geçerli bir video (MP4) bağlantısı gir.' }
  if (input.subtitleUrl && !isUrl(input.subtitleUrl)) return { ok: false as const, error: 'Altyazı bağlantısı geçersiz.' }
  const ep = await addEpisode({
    animeId: input.animeId,
    animeTitle: input.animeTitle.slice(0, 200),
    animeCover: input.animeCover ?? null,
    number: input.number,
    title: input.title.slice(0, 200),
    videoUrl: input.videoUrl,
    subtitleUrl: input.subtitleUrl || null,
    subtitleText: input.subtitleText ? input.subtitleText.slice(0, 500_000) : null,
    subtitleLang: (input.subtitleLang || 'tr').slice(0, 5),
    thumbnail: isUrl(input.thumbnail) ? input.thumbnail : null,
  })
  revalidatePath(`/anime/${input.animeId}`)
  revalidatePath('/')
  return { ok: true as const, id: ep.id }
}

export async function deleteEpisodeAction(animeId: number, id: string) {
  await guard()
  await deleteEpisode(animeId, id)
  revalidatePath(`/anime/${animeId}`)
  revalidatePath('/admin')
  return { ok: true }
}

export async function clearLogsAction() {
  await guard()
  await clearLogs()
  revalidatePath('/admin')
}

export async function setUserBanned(id: string, banned: boolean) {
  await guard()
  const u = await getUser(id)
  if (!u) return { ok: false }
  u.banned = banned
  await saveUser(u)
  revalidatePath('/admin')
  return { ok: true }
}

export async function purgeCache() {
  await guard()
  revalidatePath('/', 'layout')
  return { ok: true, at: Date.now() }
}

export async function testIntegration(name: 'anilist' | 'gemini' | 'store' | 'ollama' | 'animethemes') {
  await guard()
  const started = Date.now()
  try {
    if (name === 'store') {
      const h = await storeHealth()
      return { ok: h.ok, ms: h.ms, detail: h.ok ? (process.env.DATABASE_URL ? 'Postgres bağlantısı başarılı' : 'Geçici bellek deposu (kalıcı değil)') : h.error }
    }
    if (name === 'anilist') {
      const res = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: '{ SiteStatistics { anime(perPage:1) { nodes { count } } } }' }), cache: 'no-store' })
      return { ok: res.ok, ms: Date.now() - started, detail: `HTTP ${res.status} · limit ${res.headers.get('x-ratelimit-remaining') ?? '?'} kaldı` }
    }
    if (name === 'animethemes') {
      const res = await fetch('https://api.animethemes.moe/anime?page[size]=1', { cache: 'no-store', headers: { 'User-Agent': 'Sytheris/1.0 (+https://sytheris.vercel.app)', Accept: 'application/json' } })
      return { ok: res.ok, ms: Date.now() - started, detail: `HTTP ${res.status}` }
    }
    if (name === 'gemini') {
      const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
      if (!key) return { ok: false, ms: 0, detail: 'GEMINI_API_KEY tanımlı değil' }
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': key }, cache: 'no-store' })
      return { ok: res.ok, ms: Date.now() - started, detail: res.ok ? 'API anahtarı geçerli' : `HTTP ${res.status}` }
    }
    if (name === 'ollama') {
      if (!process.env.OLLAMA_URL) return { ok: false, ms: 0, detail: 'OLLAMA_URL tanımlı değil (yerel Ollama tarayıcıdan denenir)' }
      const res = await fetch(`${process.env.OLLAMA_URL.replace(/\/$/, '')}/api/tags`, { cache: 'no-store' })
      return { ok: res.ok, ms: Date.now() - started, detail: `HTTP ${res.status}` }
    }
    return { ok: false, ms: 0, detail: 'Bilinmeyen entegrasyon' }
  } catch (e) {
    return { ok: false, ms: Date.now() - started, detail: (e as Error).message }
  }
}
