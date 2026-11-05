import 'server-only'
import { neon, neonConfig } from '@neondatabase/serverless'
import { promises as fs } from 'fs'
import path from 'path'

// 🚨 SUPABASE BAĞLANTI AYARLARI 🚨
// Neon sürücüsünün standart Postgres (Supabase) bağlantı havuzlarıyla çalışması için:
neonConfig.pipelineConnect = false;
// Vercel Node.js ortamında global WebSocket bazen bulunmaz, fetch'e zorluyoruz:
neonConfig.fetchConnectionCache = true;

/**
 * Minimal key/value store. Uses Postgres (Neon/Supabase) when DATABASE_URL is present,
 * otherwise falls back to a JSON file in the OS temp dir so the app keeps working
 * in development and previews without a database.
 */

type Row = { key: string; value: unknown }

const g = globalThis as unknown as { __syStore?: Map<string, unknown>; __syStoreReady?: Promise<void>; __syTable?: Promise<void> }

const FILE = path.join(process.env.TMPDIR || '/tmp', 'sytheris-store.json')

export function storeBackend(): 'postgres' | 'memory' {
  return process.env.DATABASE_URL ? 'postgres' : 'memory'
}

function sql() {
  return neon(process.env.DATABASE_URL as string)
}

async function ensureTable() {
  if (!g.__syTable) {
    g.__syTable = (async () => {
      const q = sql()
      await q`CREATE TABLE IF NOT EXISTS sytheris_kv (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`
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
    const rows = (await sql()`SELECT value FROM sytheris_kv WHERE key = ${key}`) as { value: T }[]
    return rows[0]?.value ?? null
  }
  const m = await memory()
  return (m.get(key) as T) ?? null
}

export async function kvSet<T>(key: string, value: T) {
  if (storeBackend() === 'postgres') {
    await ensureTable()
    await sql()`INSERT INTO sytheris_kv (key, value, updated_at) VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`
    return
  }
  const m = await memory()
  m.set(key, value)
  scheduleFlush(m)
}

export async function kvDel(key: string) {
  if (storeBackend() === 'postgres') {
    await ensureTable()
    await sql()`DELETE FROM sytheris_kv WHERE key = ${key}`
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
    const rows = (await sql()`SELECT key, value FROM sytheris_kv WHERE key LIKE ${like} ORDER BY updated_at DESC LIMIT ${limit}`) as Row[]
    return rows as { key: string; value: T }[]
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
      await sql()`SELECT 1`
    } else {
      await memory()
    }
    return { ok: true, ms: Date.now() - started }
  } catch (e) {
    return { ok: false, ms: Date.now() - started, error: (e as Error).message }
  }
}