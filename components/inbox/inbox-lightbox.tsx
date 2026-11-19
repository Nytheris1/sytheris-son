'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { InboxItem } from '@/lib/inbox'
import { InboxMedia } from './inbox-card'

export function InboxLightbox({ items, index, onClose, onIndex }: { items: InboxItem[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const item = index === null ? null : items[index]

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (item && !d.open) d.showModal()
    if (!item && d.open) d.close()
  }, [item])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onIndex])

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label={item?.original ?? 'Önizleme'}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-scrim/90 backdrop:backdrop-blur-sm"
    >
      {item && (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-4 sm:p-10" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <div className="flex w-full max-w-5xl items-center justify-between gap-4 text-on-scrim">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{item.original}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-scrim/60">
                {item.category} · {index! + 1}/{items.length}
              </span>
            </div>
            <button type="button" onClick={onClose} aria-label="Kapat" className="grid size-10 shrink-0 place-items-center rounded-full bg-on-scrim/10 transition hover:bg-on-scrim/20">
              <X className="size-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center">
            <InboxMedia key={item.name} item={item} controls className="max-h-full max-w-full rounded-xl object-contain" />
            {items.length > 1 && (
              <>
                <button type="button" onClick={() => onIndex((index! - 1 + items.length) % items.length)} aria-label="Önceki" className="absolute left-0 grid size-11 place-items-center rounded-full bg-scrim/70 text-on-scrim backdrop-blur transition hover:bg-scrim sm:-left-16">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" onClick={() => onIndex((index! + 1) % items.length)} aria-label="Sonraki" className="absolute right-0 grid size-11 place-items-center rounded-full bg-scrim/70 text-on-scrim backdrop-blur transition hover:bg-scrim sm:-right-16">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>
          {item.note && <p className="max-w-2xl text-center text-sm leading-relaxed text-on-scrim/75">{item.note}</p>}
        </div>
      )}
    </dialog>
  )
}
