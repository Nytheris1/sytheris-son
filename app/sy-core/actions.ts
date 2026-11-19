'use server'

import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE, cookieOptions, isAdmin, safeEqual, sign } from '@/lib/session'
import { addEpisode, clearLogs, deleteEpisode, logEvent, saveSettings, type SiteSettings } from '@/lib/site'
import { storeHealth } from '@/lib/store'
import { getCurrentUser, getUser, saveUser } from '@/lib/users'
import { audit, createCodes, deleteCode, removeComment, setReportStatus, type Report } from '@/lib/community'
import { BADGE_IDS, type BadgeId, type Role } from '@/lib/membership'

const attempts = new Map<string, { n: number; at: number }>()

export type StaffLevel = 'admin' | 'moderator'

/** Password session = full admin. Logged-in users with role admin/moderator get their role's access. */
export async function getStaff(): Promise<{ level: StaffLevel; actor: string } | null> {
  if (await isAdmin()) return { level: 'admin', actor: 'yönetici' }
  const u = await getCurrentUser()
  if (u?.role === 'admin') return { level: 'admin', actor: `@${u.username}` }
  if (u?.role === 'moderator') return { level: 'moderator', actor: `@${u.username}` }
  return null
}

async function guard() {
  const s = await getStaff()
  if (s?.level !== 'admin') throw new Error('Yetkisiz işlem')
  return s
}

async function guardMod() {
  const s = await getStaff()
  if (!s) throw new Error('Yetkisiz işlem')
  return s
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
    await logEvent({ level: 'warn', source: 'server', message: `Hatalı admin girişi denemesi (${ip})`, path: '/sy-core' })
    return { error: 'Şifre hatalı.' }
  }
  attempts.delete(ip)
  const store = await cookies()
  store.set(ADMIN_COOKIE, sign({ admin: true, exp: Date.now() + 12 * 3600_000 }), cookieOptions(12 * 3600))
  revalidatePath('/sy-core')
  return { ok: true }
}

export async function adminLogout() {
  const store = await cookies()
  store.set(ADMIN_COOKIE, '', cookieOptions(0))
  revalidatePath('/sy-core')
  redirect('/')
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
  magnetUrl?: string // <-- BURAYA EKLENDİ
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

  // Video veya Magnet'ten en az biri olmalı
  const hasVideo = isUrl(input.videoUrl)
  const hasMagnet = Boolean(input.magnetUrl && (input.magnetUrl.startsWith('magnet:?') || input.magnetUrl.endsWith('.torrent')))

  if (!Number.isInteger(input.animeId) || input.animeId <= 0) return { ok: false as const, error: 'Anime seçmelisin.' }
  if (!Number.isInteger(input.number) || input.number <= 0 || input.number > 5000) return { ok: false as const, error: 'Geçerli bir bölüm numarası gir.' }
  if (!hasVideo && !hasMagnet) return { ok: false as const, error: 'Geçerli bir video bağlantısı veya Magnet linki gir.' }
  if (input.subtitleUrl && !isUrl(input.subtitleUrl)) return { ok: false as const, error: 'Altyazı bağlantısı geçersiz.' }

  const ep = await addEpisode({
    animeId: input.animeId,
    animeTitle: input.animeTitle.slice(0, 200),
    animeCover: input.animeCover ?? null,
    number: input.number,
    title: input.title.slice(0, 200),
    videoUrl: input.videoUrl || '', // Boş olabilir
    magnetUrl: input.magnetUrl || null, // Veritabanına kaydedildi
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
  revalidatePath('/sy-core')
  return { ok: true }
}

export async function clearLogsAction() {
  await guard()
  await clearLogs()
  revalidatePath('/sy-core')
}

export async function setUserBanned(id: string, banned: boolean, reason = '') {
  const s = await guardMod()
  const u = await getUser(id)
  if (!u) return { ok: false }
  if (s.level === 'moderator' && (u.role === 'admin' || u.role === 'moderator')) return { ok: false, error: 'Ekip üyelerini yalnızca yönetici askıya alabilir.' }
  u.banned = banned
  u.banReason = banned ? reason.slice(0, 200) || null : null
  await saveUser(u)
  await audit(s.actor, banned ? 'askıya aldı' : 'yasağı kaldırdı', `@${u.username}${reason ? ` — ${reason}` : ''}`)
  revalidatePath('/sy-core')
  return { ok: true }
}

export async function resetUserContent(id: string, field: 'avatar' | 'bio' | 'background') {
  const s = await guardMod()
  const u = await getUser(id)
  if (!u) return { ok: false }
  if (field === 'avatar') u.avatar = null
  if (field === 'bio') u.bio = ''
  if (field === 'background') {
    u.background = null
    u.bannerPreset = 'none'
  }
  await saveUser(u)
  await audit(s.actor, `${field === 'avatar' ? 'avatarı' : field === 'bio' ? 'biyografiyi' : 'afişi'} sıfırladı`, `@${u.username}`)
  revalidatePath('/sy-core')
  revalidatePath(`/u/${u.username}`)
  return { ok: true }
}

export async function setUserRole(id: string, role: Role) {
  const s = await guard()
  if (!['user', 'moderator', 'admin'].includes(role)) return { ok: false }
  const u = await getUser(id)
  if (!u) return { ok: false }
  u.role = role
  await saveUser(u)
  await audit(s.actor, `rolü "${role}" yaptı`, `@${u.username}`)
  revalidatePath('/sy-core')
  return { ok: true }
}

export async function grantPremium(id: string, tier: 'plus' | 'ultra' | null, days: number) {
  const s = await guard()
  const u = await getUser(id)
  if (!u) return { ok: false }
  if (!tier) u.premium = null
  else {
    const d = Math.min(3650, Math.max(1, Math.round(days)))
    u.premium = { tier, since: u.premium?.since ?? Date.now(), until: Date.now() + d * 86400_000 }
  }
  await saveUser(u)
  await audit(s.actor, tier ? `${tier} verdi (${days} gün)` : 'aboneliği kaldırdı', `@${u.username}`)
  revalidatePath('/sy-core')
  return { ok: true }
}

export async function setUserBadges(id: string, badges: BadgeId[]) {
  const s = await guard()
  const u = await getUser(id)
  if (!u) return { ok: false }
  u.badges = badges.filter((b) => BADGE_IDS.includes(b))
  await saveUser(u)
  await audit(s.actor, `rozetleri güncelledi (${u.badges.length})`, `@${u.username}`)
  revalidatePath('/sy-core')
  return { ok: true }
}

export async function moderateComment(animeId: number, commentId: string, reportId?: string) {
  const s = await guardMod()
  const removed = await removeComment(animeId, commentId)
  if (reportId) await setReportStatus(reportId, 'resolved')
  await audit(s.actor, 'yorumu sildi', `${removed?.animeTitle ?? animeId}: “${removed?.text.slice(0, 60) ?? ''}”`)
  revalidatePath('/sy-core')
  revalidatePath(`/anime/${animeId}`)
  return { ok: true }
}

export async function resolveReport(id: string, status: Report['status']) {
  const s = await guardMod()
  const r = await setReportStatus(id, status)
  if (r) await audit(s.actor, status === 'resolved' ? 'bildirimi çözdü' : status === 'dismissed' ? 'bildirimi reddetti' : 'bildirimi yeniden açtı', r.snapshot.slice(0, 60))
  revalidatePath('/sy-core')
  return { ok: Boolean(r) }
}

export async function createPremiumCodes(tier: 'plus' | 'ultra', days: number, count: number, note: string) {
  const s = await guard()
  const n = Math.min(50, Math.max(1, Math.round(count)))
  const d = Math.min(3650, Math.max(1, Math.round(days)))
  const codes = await createCodes(tier, d, n, note.slice(0, 80))
  await audit(s.actor, `${n} adet ${tier} kodu üretti (${d} gün)`, note || '—')
  revalidatePath('/sy-core')
  return { ok: true, codes: codes.map((c) => c.code) }
}

export async function deletePremiumCode(code: string) {
  const s = await guard()
  await deleteCode(code)
  await audit(s.actor, 'kodu sildi', code)
  revalidatePath('/sy-core')
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
