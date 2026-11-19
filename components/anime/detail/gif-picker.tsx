'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useDebounced } from '@/components/shell/command-palette'
import { cn } from '@/lib/utils'

type Gif = { id: string; url: string; preview: string; width: number; height: number; source: string | null }

const CATS: [string, string][] = [
  ['happy', 'Mutlu'],
  ['laugh', 'Gülme'],
  ['cry', 'Ağlama'],
  ['hug', 'Sarılma'],
  ['wave', 'Selam'],
  ['blush', 'Utanma'],
  ['shocked', 'Şok'],
  ['facepalm', 'Facepalm'],
  ['think', 'Düşünme'],
  ['dance', 'Dans'],
  ['thumbsup', 'Süper'],
  ['smug', 'Kendinden emin'],
  ['clap', 'Alkış'],
  ['pout', 'Surat asma'],
  ['sleep', 'Uyku'],
  ['yeet', 'Fırlat'],
]

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ results: Gif[] }>)

export function GifPicker({ onPick }: { onPick: (url: string) => void }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('happy')
  const dq = useDebounced(q.trim(), 350)
  const { data, isLoading } = useSWR(dq.length > 1 ? `/api/gifs?q=${encodeURIComponent(dq)}` : `/api/gifs?cat=${cat}`, fetcher, { keepPreviousData: true, revalidateOnFocus: false })
  const results = data?.results ?? []

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="GIF ara (İngilizce: happy, cry, hug…)"
          aria-label="GIF ara"
          className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-9 text-sm outline-none focus:border-primary"
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {dq.length < 2 && (
        <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="GIF kategorileri">
          {CATS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={cat === id}
              onClick={() => setCat(id)}
              className={cn('shrink-0 rounded-full border px-3 py-1 text-xs transition', cat === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {/* The scroll box and the grid are separate elements: a grid that is itself height-capped squeezes its
          auto rows, and aspect-ratio tiles then overlap each other and become clickable through one another. */}
      <div className="max-h-64 overflow-y-auto overscroll-contain rounded-lg">
        {results.length === 0 && !isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">GIF bulunamadı.</p>
        ) : (
          <ul className="grid auto-rows-max grid-cols-3 content-start gap-1.5 p-0.5 sm:grid-cols-4">
            {results.map((g) => (
              <li key={g.id} className="relative h-0 pb-[56.25%]">
                <button
                  type="button"
                  onClick={() => onPick(g.url)}
                  className="group absolute inset-0 overflow-hidden rounded-lg bg-muted outline-none ring-primary transition hover:ring-2 focus-visible:ring-2"
                  aria-label={`GIF ekle${g.source ? `: ${g.source}` : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.preview} alt="" loading="lazy" className="size-full object-cover" />
                  {g.source && <span className="absolute inset-x-0 bottom-0 truncate bg-scrim/70 px-1.5 py-0.5 text-left text-[10px] text-on-scrim opacity-0 transition group-hover:opacity-100">{g.source}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-right font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Anime GIF’leri · nekos.best</p>
    </div>
  )
}
