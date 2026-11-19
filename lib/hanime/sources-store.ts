import 'server-only'
import { randomBytes } from 'node:crypto'
import { Pool } from 'pg'

export type StoredSource = {
  id: string
  slug: string
  url: string
  kind: 'hls' | 'file'
  label: string
  createdAt: number
}

let pool: Pool | null = null
let ready: Promise<void> | null = null
const mem = new Map<string, StoredSource>()

function db() {
  if (!process.env.DATABASE_URL) return null
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3 })
  return pool
}

async function ensure(p: Pool) {
  ready ??= p
    .query(
      `CREATE TABLE IF NOT EXISTS sy_hentai_sources (
         id text PRIMARY KEY,
         slug text NOT NULL,
         url text NOT NULL,
         kind text NOT NULL,
         label text NOT NULL DEFAULT '',
         created_at bigint NOT NULL
       )`,
    )
    .then(() => undefined)
  await ready
}

const row = (r: Record<string, unknown>): StoredSource => ({
  id: String(r.id),
  slug: String(r.slug),
  url: String(r.url),
  kind: String(r.kind) === 'hls' ? 'hls' : 'file',
  label: String(r.label ?? ''),
  createdAt: Number(r.created_at),
})

export async function listSources(slug: string): Promise<StoredSource[]> {
  const p = db()
  if (!p) return [...mem.values()].filter((s) => s.slug === slug)
  await ensure(p)
  const { rows } = await p.query('SELECT * FROM sy_hentai_sources WHERE slug = $1 ORDER BY created_at ASC', [slug])
  return rows.map(row)
}

export async function addSource(input: { slug: string; url: string; label?: string }) {
  const source: StoredSource = {
    id: randomBytes(6).toString('hex'),
    slug: input.slug,
    url: input.url,
    kind: /\.m3u8(\?|$)/i.test(input.url) ? 'hls' : 'file',
    label: (input.label ?? '').trim() || (input.url.match(/\.(m3u8|mp4|webm)/i)?.[1] ?? 'kaynak'),
    createdAt: Date.now(),
  }
  const p = db()
  if (!p) {
    mem.set(source.id, source)
    return source
  }
  await ensure(p)
  await p.query(
    'INSERT INTO sy_hentai_sources (id, slug, url, kind, label, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
    [source.id, source.slug, source.url, source.kind, source.label, source.createdAt],
  )
  return source
}

export async function deleteSource(id: string) {
  const p = db()
  if (!p) return mem.delete(id)
  await ensure(p)
  const { rowCount } = await p.query('DELETE FROM sy_hentai_sources WHERE id = $1', [id])
  return Boolean(rowCount)
}