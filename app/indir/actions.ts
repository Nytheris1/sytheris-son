'use server'

import { ARCHIVE_NAME, CHUNK_BYTES, archiveFilename, downloadsEnabled, listProjectFiles, readChunks, type ArchiveEntry, type ChunkRequest } from '@/lib/project-archive'

/*
 * Why this never answers 401: Server Actions are POSTed to the URL of the page that is already open in the
 * browser, so they ride on whatever let that page load (preview share token, protection cookie, nothing at all
 * on production). No session, cookie or admin check is read here on purpose, and no second URL is involved.
 */

export type ArchiveManifest = { ok: true; name: string; filename: string; chunkBytes: number; files: ArchiveEntry[] } | { ok: false; error: string }

export async function getArchiveManifest(): Promise<ArchiveManifest> {
  if (!downloadsEnabled()) return { ok: false, error: 'İndirme kapalı' }
  try {
    const files = await listProjectFiles()
    if (files.length === 0) return { ok: false, error: 'Sunucuda proje dosyası bulunamadı' }
    return { ok: true, name: ARCHIVE_NAME, filename: archiveFilename(), chunkBytes: CHUNK_BYTES, files }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export type ArchiveChunk = { ok: true; parts: { path: string; offset: number; data: string }[] } | { ok: false; error: string }

export async function getArchiveChunk(requests: ChunkRequest[]): Promise<ArchiveChunk> {
  if (!downloadsEnabled()) return { ok: false, error: 'İndirme kapalı' }
  try {
    return { ok: true, parts: await readChunks(requests) }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
