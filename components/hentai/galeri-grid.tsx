'use client'

import { useEffect, useState } from 'react'
import { Play, Star, X } from 'lucide-react'

export type GaleriItem = { id: number; src: string; preview: string; kind: 'image' | 'video'; tags: string[]; score: number }

export function GaleriGrid({ items }: { items: GaleriItem[] }) {
  const [open, setOpen] = useState<GaleriItem | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
        {items.map((it) => (
          <li key={it.id} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpen(it)}
              className="group relative block w-full overflow-hidden rounded-xl border border-border bg-card transition duration-500 hover:border-primary hover:ht-glow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" loading="lazy" decoding="async" className="w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-between opacity-0 transition duration-300 group-hover:opacity-100">
                <span className="line-clamp-1 font-mono text-[9px] uppercase tracking-wider text-white/70">
                  {it.tags.slice(0, 3).join(' · ')}
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white/85">
                  <Star className="size-2.5 fill-current text-primary" aria-hidden="true" />
                  {it.score}
                </span>
              </span>
              {it.kind === 'video' && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                  <Play className="size-2.5 fill-current" aria-hidden="true" /> VIDEO
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
          <div className="flex max-h-full w-full max-w-5xl flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            {open.kind === 'video' ? (
              <video src={open.src} controls autoPlay playsInline className="max-h-[78vh] w-full rounded-2xl bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.src} alt="" className="max-h-[78vh] w-full rounded-2xl object-contain" />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[10px] text-primary">
                <Star className="size-3 fill-current" aria-hidden="true" /> {open.score}
              </span>
              {open.tags.slice(0, 14).map((t) => (
                <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-white/50">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}