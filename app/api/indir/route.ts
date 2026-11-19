import { Zip, ZipDeflate, ZipPassThrough } from 'fflate'
import { ARCHIVE_NAME, CHUNK_BYTES, archiveFilename, downloadsEnabled, listProjectFiles, readChunks } from '@/lib/project-archive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const STORED = /\.(png|jpe?g|webp|gif|avif|woff2?|mp4|webm|mp3|zip)$/i

/**
 * Secondary download path: the whole project as one streamed ZIP. The /indir page uses Server Actions first
 * and only falls back here; it is also handy for `curl -OJ http://localhost:3000/api/indir` locally.
 * No cookies, sessions or admin checks are read.
 */
export async function GET() {
  if (!downloadsEnabled()) return Response.json({ ok: false, error: 'Bulunamadı' }, { status: 404 })

  const files = await listProjectFiles()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const zip = new Zip((err, chunk, final) => {
        if (err) return controller.error(err)
        controller.enqueue(chunk)
        if (final) controller.close()
      })
      try {
        for (const file of files) {
          const entry = STORED.test(file.path) ? new ZipPassThrough(`${ARCHIVE_NAME}/${file.path}`) : new ZipDeflate(`${ARCHIVE_NAME}/${file.path}`, { level: 6 })
          zip.add(entry)
          if (file.size === 0) {
            entry.push(new Uint8Array(0), true)
            continue
          }
          for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
            const length = Math.min(CHUNK_BYTES, file.size - offset)
            const [part] = await readChunks([{ path: file.path, offset, length }])
            entry.push(new Uint8Array(Buffer.from(part.data, 'base64')), offset + length >= file.size)
          }
        }
        zip.end()
      } catch (e) {
        controller.error(e)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${archiveFilename()}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
