'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GalleryGrid({ images, name }: { images: string[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, images.length])

  if (!images.length) return null

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex h-8 w-fit items-center gap-2 border-2 border-foreground px-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] transition hover:bg-foreground hover:text-background"
      >
        Galeri
        <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-3 overflow-hidden"
          >
            {images.map((src, i) => (
              <li key={src}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`${name} galerisi, ${i + 1}. görseli büyüt`}
                  className="group relative block aspect-video w-full overflow-hidden bg-muted outline-none ring-foreground focus-visible:ring-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src || '/placeholder.svg'} alt="" loading="lazy" className="size-full object-cover object-top grayscale transition duration-700 group-hover:scale-110 group-hover:grayscale-0" />
                  <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-foreground/10 transition group-hover:bg-transparent">
                    <span className="grid size-8 place-items-center rounded-full bg-background/90 text-foreground shadow-lg transition group-hover:scale-110">
                      <ChevronRight className="size-4" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} galerisi`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-scrim/92 p-4 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          >
            <motion.img
              key={images[open]}
              src={images[open]}
              alt={`${name} — hayran çizimi ${open + 1}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-h-[86dvh] max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button type="button" onClick={() => setOpen(null)} aria-label="Kapat" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-on-scrim/10 text-on-scrim transition hover:bg-on-scrim/20">
              <X className="size-5" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => (e.stopPropagation(), setOpen((open - 1 + images.length) % images.length))}
                  aria-label="Önceki görsel"
                  className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-on-scrim/10 text-on-scrim transition hover:bg-on-scrim/20"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => (e.stopPropagation(), setOpen((open + 1) % images.length))}
                  aria-label="Sonraki görsel"
                  className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-on-scrim/10 text-on-scrim transition hover:bg-on-scrim/20"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs tabular-nums text-on-scrim/70">
              {String(open + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
