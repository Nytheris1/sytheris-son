'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { GalleryVerticalEnd, Loader2, X } from 'lucide-react'

export function PublishDialog({
  open,
  preview,
  defaultTitle,
  busy,
  onClose,
  onPublish,
}: {
  open: boolean
  preview: string | null
  defaultTitle: string
  busy: boolean
  onClose: () => void
  onPublish: (title: string) => void
}) {
  const [title, setTitle] = useState(defaultTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setTitle(defaultTitle)
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, defaultTitle, busy, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-scrim/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && onClose()}>
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              if (!busy) onPublish(title)
            }}
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="relative grid w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl sm:grid-cols-[1.1fr_1fr]"
          >
            <div className="studio-checker relative aspect-square sm:aspect-auto">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview || '/placeholder.svg'} alt="Sergilenecek eserin önizlemesi" className="absolute inset-0 size-full object-contain p-4" />
              )}
            </div>
            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink">Galeride sergile</p>
                  <h2 id="publish-title" className="text-balance text-2xl font-semibold leading-tight tracking-tight">
                    Eserine bir <span className="accent-serif">isim</span> ver.
                  </h2>
                </div>
                <button type="button" onClick={onClose} disabled={busy} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Kapat">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="art-title" className="text-sm font-medium">
                  Eser adı
                </label>
                <input
                  ref={inputRef}
                  id="art-title"
                  value={title}
                  maxLength={60}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ör. Yağmurda Syra"
                  className="h-11 rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-primary"
                />
                <span className="text-right font-mono text-[10px] text-muted-foreground">{title.length}/60</span>
              </div>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Eserin herkese açık Atölye galerisinde adınla sergilenir. İstediğin zaman galeriden kaldırabilirsin. İlk eserinde <span className="font-medium text-foreground">Atölye Sanatçısı</span> rozetini kazanırsın.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="mt-auto flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-70"
              >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <GalleryVerticalEnd className="size-4" aria-hidden="true" />}
                {busy ? 'Sergileniyor…' : 'Sergile'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
