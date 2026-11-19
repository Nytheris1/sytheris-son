import 'server-only'
import { randomBytes } from 'node:crypto'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

/*
 * GEÇİCİ REFERANS KUTUSU — işin bitince sil:
 *   app/kutu/   app/api/kutu/   components/inbox/   lib/inbox.ts   lib/pinterest.ts
 * Dosyalar yalnızca sunucunun geçici klasöründe (/tmp/sytheris-inbox) durur; repoya ya da ZIP'e girmez.
 */

export const INBOX_DIR = path.join(tmpdir(), 'sytheris-inbox')
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024
export const MAX_FILES = 150
export const DEFAULT_CATEGORY = 'Genel'

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

const TYPE_BY_EXT: Record<string, string> = Object.fromEntries(Object.entries(EXT_BY_TYPE).map(([t, e]) => [e, t]))

const NAME_RE = /^[a-z0-9-]+\.(png|jpg|webp|gif|avif|mp4|webm|mov)$/

export type InboxKind = 'image' | 'video'

export type InboxItem = {
  name: string
  original: string
  size: number
  type: string
  kind: InboxKind
  category: string
  note: string
  source: string | null
  at: number
}

export function isInboxName(name: string) {
  return NAME_RE.test(name)
}

export function inboxType(name: string) {
  return TYPE_BY_EXT[name.split('.').pop() ?? ''] ?? 'application/octet-stream'
}

export function kindOf(type: string): InboxKind | null {
  if (!EXT_BY_TYPE[type]) return null
  return type.startsWith('video/') ? 'video' : 'image'
}

export function cleanCategory(raw: unknown) {
  const v = String(raw ?? '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32)
  return v || DEFAULT_CATEGORY
}

function normalize(raw: Partial<InboxItem>): InboxItem | null {
  if (!raw.name || !isInboxName(raw.name)) return null
  const type = raw.type ?? inboxType(raw.name)
  return {
    name: raw.name,
    original: raw.original ?? raw.name,
    size: raw.size ?? 0,
    type,
    kind: raw.kind ?? kindOf(type) ?? 'image',
    category: cleanCategory(raw.category),
    note: raw.note ?? '',
    source: raw.source ?? null,
    at: raw.at ?? 0,
  }
}

async function readMeta(name: string) {
  try {
    return normalize(JSON.parse(await readFile(path.join(INBOX_DIR, `${name}.json`), 'utf8')) as Partial<InboxItem>)
  } catch {
    return null
  }
}

export async function listInbox(): Promise<InboxItem[]> {
  await mkdir(INBOX_DIR, { recursive: true })
  const files = await readdir(INBOX_DIR)
  const items = await Promise.all(files.filter((f) => f.endsWith('.json')).map((f) => readMeta(f.slice(0, -5))))
  return items.filter((i): i is InboxItem => !!i).sort((a, b) => b.at - a.at)
}

/** Stores raw bytes with metadata. `type` must be one of the allowed MIME types. */
export async function saveBytes(bytes: Uint8Array, meta: { type: string; original: string; note?: string; category?: string; source?: string | null }): Promise<InboxItem> {
  const ext = EXT_BY_TYPE[meta.type]
  const kind = kindOf(meta.type)
  if (!ext || !kind) throw new Error(`${meta.original}: yalnızca PNG, JPG, WEBP, GIF, AVIF, MP4, WEBM veya MOV.`)
  const limit = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (bytes.byteLength > limit) throw new Error(`${meta.original}: ${Math.round(limit / 1024 / 1024)} MB sınırını aşıyor.`)

  await mkdir(INBOX_DIR, { recursive: true })
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}.${ext}`
  const item: InboxItem = {
    name,
    original: meta.original.slice(0, 120),
    size: bytes.byteLength,
    type: meta.type,
    kind,
    category: cleanCategory(meta.category),
    note: (meta.note ?? '').slice(0, 600),
    source: meta.source ?? null,
    at: Date.now(),
  }
  await writeFile(path.join(INBOX_DIR, name), bytes)
  await writeFile(path.join(INBOX_DIR, `${name}.json`), JSON.stringify(item))
  return item
}

export async function saveToInbox(file: File, note: string, category?: string): Promise<InboxItem> {
  const type = file.type === 'video/x-m4v' ? 'video/mp4' : file.type
  return saveBytes(new Uint8Array(await file.arrayBuffer()), { type, original: file.name, note, category })
}

export async function updateInbox(name: string, patch: { category?: unknown; note?: unknown }) {
  const item = await readMeta(name)
  if (!item) return null
  const next: InboxItem = {
    ...item,
    category: patch.category !== undefined ? cleanCategory(patch.category) : item.category,
    note: patch.note !== undefined ? String(patch.note).slice(0, 600) : item.note,
  }
  await writeFile(path.join(INBOX_DIR, `${name}.json`), JSON.stringify(next))
  return next
}

export async function renameCategory(from: string, to: string) {
  const items = await listInbox()
  const target = cleanCategory(to)
  await Promise.all(items.filter((i) => i.category === from).map((i) => updateInbox(i.name, { category: target })))
}

export async function inboxFilePath(name: string) {
  if (!isInboxName(name)) return null
  const file = path.join(INBOX_DIR, name)
  try {
    const s = await stat(file)
    return { file, size: s.size }
  } catch {
    return null
  }
}

export async function removeFromInbox(name: string) {
  if (!isInboxName(name)) return false
  await rm(path.join(INBOX_DIR, name), { force: true })
  await rm(path.join(INBOX_DIR, `${name}.json`), { force: true })
  return true
}

export async function clearInbox(category?: string) {
  if (!category) {
    await rm(INBOX_DIR, { recursive: true, force: true })
    return
  }
  const items = await listInbox()
  await Promise.all(items.filter((i) => i.category === category).map((i) => removeFromInbox(i.name)))
}
