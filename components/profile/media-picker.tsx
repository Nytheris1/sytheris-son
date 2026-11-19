'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useId, useRef, useState } from 'react'
import { ImageUp, Link2, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Kind = 'avatar' | 'banner'

const LIMITS: Record<Kind, { raw: number; label: string; accept: string; seconds: number }> = {
  avatar: { raw: 2 * 1024 * 1024, label: '2 MB', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm', seconds: 15 },
  banner: { raw: 4 * 1024 * 1024, label: '4 MB', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm', seconds: 30 },
}

/** Reads a clip's length without uploading it, so overly long loops are caught on the device. */
function videoDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.muted = true
    const done = (d: number) => {
      URL.revokeObjectURL(url)
      resolve(d)
    }
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : 0)
    v.onerror = () => done(0)
    v.src = url
  })
}

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error ?? new Error('Dosya okunamadı'))
    r.readAsDataURL(file)
  })
}

/** Re-encodes still images on the device so uploads stay small: square 512px avatars, 1920px-wide banners. */
async function compress(file: File, kind: Kind) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tarayıcı görseli işleyemedi')
  if (kind === 'avatar') {
    const side = Math.min(bitmap.width, bitmap.height)
    const out = Math.min(512, side)
    canvas.width = out
    canvas.height = out
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out)
  } else {
    const scale = Math.min(1, 1920 / bitmap.width)
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  }
  bitmap.close()
  const webp = canvas.toDataURL('image/webp', 0.86)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.88)
}

export function MediaPicker({ kind, value, onChange, label, hint }: { kind: Kind; value: string; onChange: (v: string) => void; label: string; hint?: string }) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [urlMode, setUrlMode] = useState(Boolean(value) && !value.startsWith('data:'))
  const limit = LIMITS[kind]
  const isVideo = /^data:video\//.test(value) || /\.(mp4|webm)(\?|$)/i.test(value)

  async function handle(file?: File | null) {
    if (!file) return
    if (!limit.accept.split(',').includes(file.type)) {
      toast.error('Bu dosya türü desteklenmiyor')
      return
    }
    setBusy(true)
    try {
      const animated = file.type === 'image/gif' || file.type.startsWith('video/')
      if (animated && file.size > limit.raw) throw new Error(`Hareketli dosyalar en fazla ${limit.label} olabilir`)
      if (file.type.startsWith('video/')) {
        const seconds = await videoDuration(file)
        if (seconds > limit.seconds) throw new Error(`Video en fazla ${limit.seconds} saniye olabilir (seçilen: ${Math.round(seconds)} sn)`)
      }
      const url = animated ? await readAsDataUrl(file) : await compress(file, kind)
      onChange(url)
      setUrlMode(false)
      toast.success(kind === 'avatar' ? 'Profil fotoğrafı hazır — kaydetmeyi unutma' : 'Afiş hazır — kaydetmeyi unutma')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-file`} className="font-medium">
          {label}
        </label>
        <button type="button" onClick={() => setUrlMode((v) => !v)} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-ink">
          <Link2 className="size-3.5" />
          {urlMode ? 'Dosya seç' : 'Bağlantı yapıştır'}
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {urlMode ? (
          <motion.input
            key="url"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            type="url"
            inputMode="url"
            aria-label={`${label} bağlantısı`}
            className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
            value={value.startsWith('data:') ? '' : value}
            placeholder="https://…"
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              handle(e.dataTransfer.files?.[0])
            }}
            className={cn(
              'group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-dashed p-3 transition',
              drag ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/60',
            )}
          >
            <span className={cn('relative grid shrink-0 place-items-center overflow-hidden bg-muted', kind === 'avatar' ? 'size-16 rounded-full' : 'h-16 w-28 rounded-xl')}>
              {value ? (
                isVideo ? (
                  <video src={value} muted loop autoPlay playsInline className="size-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={value || '/placeholder.svg'} alt="" className="size-full object-cover" />
                )
              ) : (
                <ImageUp className="size-5 text-muted-foreground" />
              )}
              {busy && (
                <span className="absolute inset-0 grid place-items-center bg-scrim/60">
                  <Loader2 className="size-5 animate-spin text-on-scrim" />
                </span>
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium">{drag ? 'Bırak, yükleyelim' : 'Bilgisayarından seç'}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{hint ?? `PNG, JPG, WebP, GIF, MP4 · en fazla ${limit.label}, video ${limit.seconds} sn`}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {value && (
                <button type="button" onClick={() => onChange('')} aria-label={`${label} kaldır`} className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
              >
                <ImageUp className="size-3.5" />
                Gözat
              </button>
            </span>
            <input ref={fileRef} id={`${id}-file`} type="file" accept={limit.accept} className="sr-only" onChange={(e) => handle(e.target.files?.[0])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
