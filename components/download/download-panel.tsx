'use client'

import useSWR from 'swr'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { ArrowDown, Check, FileArchive, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import { getArchiveChunk, getArchiveManifest, type ArchiveManifest } from '@/app/indir/actions'

type Manifest = Extract<ArchiveManifest, { ok: true }>
type State =
  | { kind: 'idle' }
  | { kind: 'loading'; received: number; total: number; step: string }
  | { kind: 'done'; size: number; count: number; via: string; href: string; filename: string }
  | { kind: 'error'; message: string }

const OUT = [0.16, 1, 0.3, 1] as const
const STORED = /\.(png|jpe?g|webp|gif|avif|woff2?|mp4|webm|mp3|zip)$/i
const FIXED_MTIME = new Date('2026-01-01T00:00:00Z')

/**
 * Triggers the save and returns the object URL. It stays alive for 10 minutes so the manual
 * "click here" link keeps working when a sandboxed preview frame swallows the automatic download.
 */
function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 10 * 60_000)
  return href
}

function base64ToBytes(b64: string) {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

async function manifestFetcher(): Promise<Manifest> {
  const res = await getArchiveManifest()
  if (!res.ok) throw new Error(res.error)
  return res
}

type Progress = (received: number, total: number, step: string) => void
type Request = { path: string; offset: number; length: number }

/** Groups files into requests of ~chunkBytes; large files are split into ranges. */
function plan(files: Manifest['files'], chunkBytes: number) {
  const batches: Request[][] = []
  let current: Request[] = []
  let size = 0
  const flush = () => {
    if (current.length) batches.push(current)
    current = []
    size = 0
  }
  for (const f of files) {
    if (f.size > chunkBytes) {
      flush()
      for (let offset = 0; offset < f.size; offset += chunkBytes) batches.push([{ path: f.path, offset, length: Math.min(chunkBytes, f.size - offset) }])
      continue
    }
    if (size + f.size > chunkBytes || current.length >= 300) flush()
    current.push({ path: f.path, offset: 0, length: f.size })
    size += f.size
  }
  flush()
  return batches
}

/**
 * 1) Server Actions — POSTed to the URL of this already-open page, so whatever let the page load also lets these
 * through. Files arrive in ~2 MB batches and are zipped in the browser; nothing is ever served from a second URL.
 */
async function viaActions(manifest: Manifest, onProgress: Progress) {
  const total = manifest.files.reduce((s, f) => s + f.size, 0)
  const buffers = new Map<string, Uint8Array>(manifest.files.map((f) => [f.path, new Uint8Array(f.size)]))
  let received = 0
  for (const batch of plan(manifest.files, manifest.chunkBytes)) {
    let res = await getArchiveChunk(batch).catch(() => null)
    if (!res?.ok) res = await getArchiveChunk(batch).catch(() => null)
    if (!res?.ok) throw new Error(res?.error ?? 'Sunucuya ulaşılamadı')
    for (const part of res.parts) {
      const bytes = base64ToBytes(part.data)
      buffers.get(part.path)?.set(bytes, part.offset)
      received += bytes.byteLength
    }
    onProgress(received, total, 'Dosyalar alınıyor')
  }
  if (received !== total) throw new Error('Bazı dosyalar eksik geldi')

  onProgress(total, total, 'ZIP oluşturuluyor')
  await new Promise((r) => setTimeout(r, 30))
  const { zipSync } = await import('fflate')
  const tree: Record<string, [Uint8Array, { level: 0 | 6; mtime: Date }]> = {}
  for (const [p, data] of buffers) tree[`${manifest.name}/${p}`] = [data, { level: STORED.test(p) ? 0 : 6, mtime: FIXED_MTIME }]
  const zip = zipSync(tree)
  return new Blob([zip as BlobPart], { type: 'application/zip' })
}

/** 2) Streamed ZIP from the route handler, with the page's query string forwarded (preview share tokens). */
async function viaApi(_: Manifest | undefined, onProgress: Progress) {
  const url = new URL('/api/indir', window.location.origin)
  new URLSearchParams(window.location.search).forEach((v, k) => url.searchParams.set(k, v))
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' })
  if (!res.ok || !res.body || !(res.headers.get('content-type') ?? '').includes('zip')) throw new Error(`Sunucu ${res.status} döndürdü`)
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    onProgress(received, 0, 'Arşiv akıyor')
  }
  return new Blob(chunks as BlobPart[], { type: 'application/zip' })
}

export function DownloadPanel() {
  const { data, error, isLoading } = useSWR('indir-manifest', manifestFetcher, { revalidateOnFocus: false, shouldRetryOnError: false })
  const [state, setState] = useState<State>({ kind: 'idle' })

  const totalBytes = useMemo(() => data?.files.reduce((s, f) => s + f.size, 0) ?? 0, [data])
  const groups = useMemo(() => {
    const map = new Map<string, number>()
    for (const f of data?.files ?? []) {
      const top = f.path.includes('/') ? `${f.path.split('/')[0]}/` : 'kök dosyalar'
      map.set(top, (map.get(top) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [data])

  async function download() {
    const errors: string[] = []
    const strategies = [
      { id: 'Sunucu eylemi', run: async (p: Progress) => viaActions(data ?? (await manifestFetcher()), p) },
      { id: 'API akışı', run: (p: Progress) => viaApi(data, p) },
    ]
    for (const s of strategies) {
      setState({ kind: 'loading', received: 0, total: 0, step: 'Hazırlanıyor' })
      try {
        const blob = await s.run((received, total, step) => setState({ kind: 'loading', received, total, step }))
        if (!blob.size) throw new Error('Boş arşiv')
        const filename = data?.filename ?? `sytheris-proje-${new Date().toISOString().slice(0, 10)}.zip`
        const href = saveBlob(blob, filename)
        setState({ kind: 'done', size: blob.size, count: data?.files.length ?? 0, via: s.id, href, filename })
        return
      } catch (e) {
        errors.push(`${s.id}: ${(e as Error).message}`)
      }
    }
    setState({ kind: 'error', message: errors.join(' · ') })
  }

  const progress = state.kind === 'loading' && state.total ? state.received / state.total : state.kind === 'done' ? 1 : 0
  const label =
    state.kind === 'loading' ? (state.total ? `%${Math.round(progress * 100)}` : state.step) : state.kind === 'done' ? 'İndirildi — tekrar indir' : state.kind === 'error' ? 'Tekrar dene' : 'ZIP olarak indir'

  const icon =
    state.kind === 'loading' ? (
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
    ) : state.kind === 'done' ? (
      <Check className="size-5" aria-hidden="true" />
    ) : state.kind === 'error' ? (
      <RotateCcw className="size-5" aria-hidden="true" />
    ) : (
      <ArrowDown className="size-5 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
    )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: OUT }}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-foreground/12 bg-foreground/[0.03]"
    >
      <div className="flex items-center gap-4 border-b border-foreground/10 p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <FileArchive className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-mono text-sm">{data?.filename ?? 'sytheris-proje.zip'}</span>
          <span className="text-xs text-foreground/55">
            {isLoading ? 'Dosyalar sayılıyor…' : error ? 'Liste alınamadı — buton yine de dener' : `${data?.files.length ?? 0} dosya · ${formatBytes(totalBytes)} (sıkıştırmadan önce)`}
          </span>
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55 sm:flex">
          <ShieldCheck className="size-3" aria-hidden="true" /> Yetki gerekmez
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <button
          type="button"
          onClick={download}
          disabled={state.kind === 'loading'}
          aria-describedby="indir-status"
          className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-foreground font-semibold text-background outline-none transition hover:opacity-90 focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-progress"
        >
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-primary"
            initial={false}
            animate={{ width: `${(state.kind === 'loading' && !state.total ? 0.12 : progress) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
          <span className="relative flex items-center gap-3">
            {icon}
            {label}
          </span>
        </button>

        <div id="indir-status" role="status" aria-live="polite" className="min-h-5 text-sm text-foreground/60">
          {state.kind === 'error' && <span className="text-destructive">İndirme başarısız. {state.message}</span>}
          {state.kind === 'done' && (
            <span className="flex flex-col gap-2">
              <span>
                {state.count ? `${state.count} dosya, ` : ''}
                {formatBytes(state.size)} ZIP indirildi ({state.via}). Arşivi açıp içeriğini eski projenin üzerine kopyalayabilirsin.
              </span>
              <a href={state.href} download={state.filename} className="w-fit font-medium text-primary underline-offset-4 hover:underline">
                İndirme başlamadıysa buraya tıkla
              </a>
            </span>
          )}
          {state.kind === 'loading' && (
            <span className="font-mono tabular-nums">
              {state.step}
              {state.total > 0 ? ` · ${formatBytes(state.received)} / ${formatBytes(state.total)}` : state.received > 0 ? ` · ${formatBytes(state.received)}` : '…'}
            </span>
          )}
        </div>
      </div>

      {groups.length > 0 && (
        <div className="border-t border-foreground/10 p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">Arşiv içeriği</p>
          <ul className="flex flex-col font-mono text-xs" aria-label="Arşiv içeriği">
            {groups.map(([name, n], i) => (
              <li key={name} className="flex items-center gap-3 py-1 text-foreground/75">
                <span className="text-foreground/30" aria-hidden="true">
                  {i === groups.length - 1 ? '└─' : '├─'}
                </span>
                <span className="flex-1 truncate">{name}</span>
                <span className="tabular-nums text-foreground/45">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
