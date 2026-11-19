'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export type GaleriItem = { id: number; src: string; preview: string; kind: 'image' | 'video'; tags: string[]; score: number }

export function GaleriGrid({ items }: { items: GaleriItem[] }) {
  const [open, setOpen] = useState<GaleriItem | null>(null)

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
        {items.map((it) => (
          <li key={it.id} className="mb-3 break-inside-avoid">
            <button type="button" onClick={() => setOpen(it)} className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" loading="lazy" className="w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
              {it.kind === 'video' && (
                <span className="absolute right-2 top-2 rounded bg-rose-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">VIDEO</span>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button type="button" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white" aria-label="Kapat">
            <X className="size-5" />
          </button>
          <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {open.kind === 'video' ? (
              <video src={open.src} controls autoPlay playsInline className="max-h-[85vh] w-full rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.src} alt="" className="max-h-[85vh] rounded-xl object-contain" />
            )}
            <p className="mt-3 line-clamp-2 font-mono text-[11px] text-white/45">{open.tags.slice(0, 18).join(' ')}</p>
          </div>
        </div>
      )}
    </>
  )
}