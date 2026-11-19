import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import { NextResponse } from 'next/server'
import { inboxFilePath, inboxType, removeFromInbox, updateInbox } from '@/lib/inbox'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_HEADERS = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow', 'Accept-Ranges': 'bytes' }

/** Streams the file and honours Range requests so videos can seek (Safari refuses to play without it). */
export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const found = await inboxFilePath(name)
  if (!found) return new NextResponse('Bulunamadı', { status: 404 })
  const type = inboxType(name)
  const range = request.headers.get('range')?.match(/bytes=(\d*)-(\d*)/)

  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, found.size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), found.size - 1) : found.size - 1
    if (start >= found.size || start > end) {
      return new NextResponse(null, { status: 416, headers: { ...BASE_HEADERS, 'Content-Range': `bytes */${found.size}` } })
    }
    const stream = Readable.toWeb(createReadStream(found.file, { start, end })) as ReadableStream
    return new NextResponse(stream, {
      status: 206,
      headers: { ...BASE_HEADERS, 'Content-Type': type, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${found.size}` },
    })
  }

  const stream = Readable.toWeb(createReadStream(found.file)) as ReadableStream
  return new NextResponse(stream, { headers: { ...BASE_HEADERS, 'Content-Type': type, 'Content-Length': String(found.size) } })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const body = (await request.json().catch(() => ({}))) as { category?: unknown; note?: unknown }
  const item = await updateInbox(name, body)
  return NextResponse.json(item ? { item } : { error: 'Bulunamadı' }, { status: item ? 200 : 404, headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const ok = await removeFromInbox(name)
  return NextResponse.json({ ok }, { status: ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } })
}
