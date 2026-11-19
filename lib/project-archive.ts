import 'server-only'
import { promises as fs } from 'fs'
import path from 'path'

/*
 * Source of the hidden /indir download. Everything here reads the project from disk; on Vercel the files are
 * bundled next to the function through `outputFileTracingIncludes` in next.config.mjs.
 * The fs calls carry `turbopackIgnore` so the bundler doesn't trace the whole repository into every route.
 */

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', '.turbo', '.v0-trash', '.design-cache', '.snowflake', 'v0_memories', 'user_read_only_context', 'v0_plans', '.pnpm-store', '.scratch', '.temizle-yedek'])
/** `___next_launcher.cjs` and friends only exist inside the Vercel function bundle; secrets never leave the server. */
const SKIP_FILES = [/^\.env/, /\.zip$/i, /\.tsbuildinfo$/, /^\.DS_Store$/, /^__v0_/, /^___/, /\.log$/, /^AGENTS\.md$/]

export const ARCHIVE_NAME = 'sytheris-proje'
/** Keeps each Server Action response (base64 adds a third) far under Vercel's 4.5 MB response cap. */
export const CHUNK_BYTES = 2 * 1024 * 1024

/** Set INDIR_DISABLED=1 to hide the download page without deleting it. */
export function downloadsEnabled() {
  return process.env.INDIR_DISABLED !== '1'
}

export type ArchiveEntry = { path: string; size: number }

function projectRoot() {
  return process.cwd()
}

async function walk(root: string, dir: string, out: ArchiveEntry[]) {
  let items: import('fs').Dirent[]
  try {
    items = await fs.readdir(/* turbopackIgnore: true */ dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const item of items) {
    const abs = path.join(/* turbopackIgnore: true */ dir, item.name)
    if (item.isDirectory()) {
      if (SKIP_DIRS.has(item.name) || item.name.startsWith('.temizle-yedek')) continue
      await walk(root, abs, out)
    } else if (item.isFile()) {
      if (SKIP_FILES.some((r) => r.test(item.name))) continue
      const stat = await fs.stat(/* turbopackIgnore: true */ abs).catch(() => null)
      if (!stat) continue
      out.push({ path: path.relative(root, abs).split(path.sep).join('/'), size: stat.size })
    }
  }
}

let cachedList: { files: ArchiveEntry[]; at: number } | null = null

export async function listProjectFiles(): Promise<ArchiveEntry[]> {
  if (cachedList && Date.now() - cachedList.at < 30_000) return cachedList.files
  const root = projectRoot()
  const files: ArchiveEntry[] = []
  await walk(root, root, files)
  files.sort((a, b) => a.path.localeCompare(b.path))
  cachedList = { files, at: Date.now() }
  return files
}

export type ChunkRequest = { path: string; offset: number; length: number }

/**
 * Reads byte ranges of files that appear in the manifest. Anything not in the manifest — `../`, absolute
 * paths, .env files — is rejected, so this can never be used to read arbitrary files from the server.
 */
export async function readChunks(requests: ChunkRequest[]) {
  if (!Array.isArray(requests) || requests.length === 0 || requests.length > 400) throw new Error('Geçersiz istek')
  const manifest = new Map((await listProjectFiles()).map((f) => [f.path, f.size]))
  let budget = CHUNK_BYTES + 64 * 1024
  const root = projectRoot()
  const out: { path: string; offset: number; data: string }[] = []

  for (const req of requests) {
    const size = manifest.get(req.path)
    if (size === undefined) throw new Error(`Arşivde olmayan dosya: ${String(req.path).slice(0, 80)}`)
    if (!Number.isInteger(req.offset) || !Number.isInteger(req.length) || req.offset < 0 || req.length < 0 || req.offset + req.length > size) {
      throw new Error('Geçersiz parça aralığı')
    }
    budget -= req.length
    if (budget < 0) throw new Error('Parça çok büyük')

    const handle = await fs.open(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ root, req.path), 'r')
    try {
      const buffer = Buffer.alloc(req.length)
      if (req.length > 0) await handle.read(buffer, 0, req.length, req.offset)
      out.push({ path: req.path, offset: req.offset, data: buffer.toString('base64') })
    } finally {
      await handle.close()
    }
  }
  return out
}

export function archiveFilename() {
  return `${ARCHIVE_NAME}-${new Date().toISOString().slice(0, 10)}.zip`
}
