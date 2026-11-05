import 'server-only'
import { Pool } from 'pg'
import { promises as fs } from 'fs'
import path from 'path'

type Row = { key: string; value: unknown }

const g = globalThis as unknown as { __syStore?: Map<string, unknown>; __syStoreReady?: Promise<void>; __syTable?: Promise<void> }

const FILE = path.join(process.env.TMPDIR || '/tmp', 'sytheris-store.json')

export function storeBackend(): 'postgres' | 'memory' {
  return process.env.DATABASE_URL ? 'postgres' : 'memory'
}

// Standart PostgreSQL bağlantı havuzu (Supabase ile tam uyumlu)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function ensureTable() {
  if (!g.__syTable) {
    g.__syTable = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sytheris_kv (
          key TEXT PRIMARY KEY, 
          value JSONB NOT NULL, 
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)
    })().catch((e) => {
      g.__syTable = undefined
      throw e
    })
  }
  return g.__syTable
}

async function memory() {
  if (!g.__syStore) {
    g.__syStore = new Map()
    g.__syStoreReady = fs
      .readFile(FILE, 'utf8')
      .then((raw) => {
        const obj = JSON.parse(raw) as Record<string, unknown>
        for (const [k, v] of Object.entries(obj)) g.__syStore!.set(k, v)
      })
      .catch(() => {})
  }
  await g.__syStoreReady
  return g.__syStore
}

let flushTimer: ReturnType<typeof setTimeout> | null = null
function scheduleFlush(map: Map<string, unknown>) {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    fs.writeFile(FILE, JSON.stringify(Object.fromEntries(map))).catch(() => {})
  }, 150)
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (storeBackend() === 'postgres') {
    await ensureTable()
    const res = await pool.query('SELECT value FROM sytheris_kv WHERE key = $1', [key])
    return res.rows[0]?.value ?? null
  }
  const m = await memory()
  return (m.get(key) as T) ?? null
}

export async function kvSet<T>(key: string, value: T) {
  if (storeBackend() === 'postgres') {
    await ensureTable()
    await pool.query(
      `INSERT INTO sytheris_kv (key, value, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)]
    )
    return
  }
  const m = await memory()
  m.set(key, value)
  scheduleFlush(m)
}

export async function kvDel(key: string) {
  if (storeBackend() === 'postgres') {
    await ensureTable()
    await pool.query('DELETE FROM sytheris_kv WHERE key = $1', [key])
    return
  }
  const m = await memory()
  m.delete(key)
  scheduleFlush(m)
}

export async function kvList<T>(prefix: string, limit = 500): Promise<{ key: string; value: T }[]> {
  if (storeBackend() === 'postgres') {
    await ensureTable()
    const like = prefix.replace(/[%_]/g, (c) => `\\${c}`) + '%'
    const res = await pool.query(
      'SELECT key, value FROM sytheris_kv WHERE key LIKE $1 ORDER BY updated_at DESC LIMIT $2',
      [like, limit]
    )
    return res.rows as { key: string; value: T }[]
  }
  const m = await memory()
  const out: { key: string; value: T }[] = []
  for (const [key, value] of m) if (key.startsWith(prefix)) out.push({ key, value: value as T })
  return out.reverse().slice(0, limit)
}

export async function storeHealth() {
  const started = Date.now()
  try {
    if (storeBackend() === 'postgres') {
      await ensureTable()
      await pool.query('SELECT 1')
    } else {
      await memory()
    }
    return { ok: true, ms: Date.now() - started }
  } catch (e) {
    return { ok: false, ms: Date.now() - started, error: (e as Error).message }
  }
}