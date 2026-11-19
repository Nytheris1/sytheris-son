import 'server-only'
import { randomBytes } from 'crypto'
import { kvGet, kvSet } from './store'
import type { Tier } from './membership'

/* ---------- Comments ---------- */
export type Comment = {
  id: string
  animeId: number
  animeTitle: string
  uid: string
  text: string
  spoiler: boolean
  likes: string[]
  at: number
  hidden?: boolean
  gif?: string | null
}

type FeedRef = { animeId: number; id: string; at: number }

export async function listComments(animeId: number) {
  return ((await kvGet<Comment[]>(`comments:${animeId}`)) ?? []).filter((c) => !c.hidden).sort((a, b) => b.at - a.at)
}

export async function addComment(input: Omit<Comment, 'id' | 'likes' | 'at'>) {
  const list = (await kvGet<Comment[]>(`comments:${input.animeId}`)) ?? []
  const c: Comment = { ...input, id: randomBytes(8).toString('hex'), likes: [], at: Date.now() }
  list.push(c)
  await kvSet(`comments:${input.animeId}`, list.slice(-500))
  const feed = (await kvGet<FeedRef[]>('comments-feed')) ?? []
  feed.unshift({ animeId: c.animeId, id: c.id, at: c.at })
  await kvSet('comments-feed', feed.slice(0, 300))
  const count = ((await kvGet<number>(`comment-count:${c.uid}`)) ?? 0) + 1
  await kvSet(`comment-count:${c.uid}`, count)
  return c
}

export async function getCommentCount(uid: string) {
  return (await kvGet<number>(`comment-count:${uid}`)) ?? 0
}

export async function toggleLike(animeId: number, id: string, uid: string) {
  const list = (await kvGet<Comment[]>(`comments:${animeId}`)) ?? []
  const c = list.find((x) => x.id === id)
  if (!c) return null
  c.likes = c.likes.includes(uid) ? c.likes.filter((u) => u !== uid) : [...c.likes, uid]
  await kvSet(`comments:${animeId}`, list)
  return c
}

export async function removeComment(animeId: number, id: string) {
  const list = (await kvGet<Comment[]>(`comments:${animeId}`)) ?? []
  const target = list.find((c) => c.id === id)
  await kvSet(
    `comments:${animeId}`,
    list.filter((c) => c.id !== id),
  )
  return target ?? null
}

export async function recentComments(limit = 60) {
  const feed = (await kvGet<FeedRef[]>('comments-feed')) ?? []
  const byAnime = new Map<number, Comment[]>()
  const out: Comment[] = []
  for (const ref of feed.slice(0, limit)) {
    if (!byAnime.has(ref.animeId)) byAnime.set(ref.animeId, (await kvGet<Comment[]>(`comments:${ref.animeId}`)) ?? [])
    const c = byAnime.get(ref.animeId)!.find((x) => x.id === ref.id)
    if (c) out.push(c)
  }
  return out
}

/* ---------- Reports ---------- */
export type Report = {
  id: string
  kind: 'comment' | 'user'
  targetId: string
  animeId?: number
  reason: string
  by: string
  at: number
  status: 'open' | 'resolved' | 'dismissed'
  snapshot: string
}

export async function listReports() {
  return (await kvGet<Report[]>('reports')) ?? []
}

export async function addReport(r: Omit<Report, 'id' | 'at' | 'status'>) {
  const list = await listReports()
  if (list.some((x) => x.by === r.by && x.targetId === r.targetId && x.status === 'open')) return null
  const report: Report = { ...r, id: randomBytes(6).toString('hex'), at: Date.now(), status: 'open' }
  list.unshift(report)
  await kvSet('reports', list.slice(0, 500))
  return report
}

export async function setReportStatus(id: string, status: Report['status']) {
  const list = await listReports()
  const r = list.find((x) => x.id === id)
  if (r) r.status = status
  await kvSet('reports', list)
  return r ?? null
}

/* ---------- Premium codes ---------- */
export type PremiumCode = { code: string; tier: Exclude<Tier, 'free'>; days: number; createdAt: number; usedBy?: string | null; usedAt?: number | null; note?: string }

export async function listCodes() {
  return (await kvGet<PremiumCode[]>('premium-codes')) ?? []
}

export async function createCodes(tier: PremiumCode['tier'], days: number, count: number, note = '') {
  const list = await listCodes()
  const fresh: PremiumCode[] = Array.from({ length: count }, () => ({
    code: `SY-${randomBytes(2).toString('hex')}-${randomBytes(2).toString('hex')}`.toUpperCase(),
    tier,
    days,
    note,
    createdAt: Date.now(),
  }))
  await kvSet('premium-codes', [...fresh, ...list].slice(0, 1000))
  return fresh
}

export async function consumeCode(code: string, uid: string) {
  const list = await listCodes()
  const c = list.find((x) => x.code === code.trim().toUpperCase())
  if (!c) return { ok: false as const, error: 'Kod bulunamadı.' }
  if (c.usedBy) return { ok: false as const, error: 'Bu kod daha önce kullanılmış.' }
  c.usedBy = uid
  c.usedAt = Date.now()
  await kvSet('premium-codes', list)
  return { ok: true as const, code: c }
}

export async function deleteCode(code: string) {
  const list = await listCodes()
  await kvSet(
    'premium-codes',
    list.filter((c) => c.code !== code),
  )
}

/* ---------- Audit log (moderation history) ---------- */
export type AuditEntry = { id: string; actor: string; action: string; target: string; at: number }

export async function audit(actor: string, action: string, target: string) {
  const list = (await kvGet<AuditEntry[]>('audit')) ?? []
  list.unshift({ id: randomBytes(5).toString('hex'), actor, action, target, at: Date.now() })
  await kvSet('audit', list.slice(0, 300))
}

export async function getAudit() {
  return (await kvGet<AuditEntry[]>('audit')) ?? []
}
