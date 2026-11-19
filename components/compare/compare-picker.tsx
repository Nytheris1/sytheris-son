'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { Loader2, Search, X } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { pickTitle } from '@/lib/format'
import { useDebounced } from '@/components/shell/command-palette'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AnimePicker({ label, value, onPick }: { label: string; value: { id: number; title: string } | null; onPick: (m: MediaCard | null) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const dq = useDebounced(q.trim(), 250)
  const { data, isLoading } = useSWR<{ results: MediaCard[] }>(dq.length > 1 ? `/api/search?q=${encodeURIComponent(dq)}` : null, fetcher)
  if (value) {
    return (
      <div className="flex h-12 items-center justify-between gap-2 rounded-full border border-primary/50 bg-accent pl-5 pr-2">
        <span className="truncate text-sm font-medium">{value.title}</span>
        <button type="button" onClick={() => onPick(null)} aria-label={`${label} temizle`} className="grid size-8 place-items-center rounded-full hover:bg-background">
          <X className="size-4" />
        </button>
      </div>
    )
  }
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={label}
        aria-label={label}
        className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-10 text-sm outline-none focus:border-primary"
      />
      {isLoading && <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin" />}
      {open && data?.results && data.results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-2xl">
          {data.results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(m)
                  setQ('')
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.coverImage.large || '/placeholder.svg'} alt="" className="h-12 w-9 rounded-md object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{pickTitle(m.title)}</span>
                  <span className="block text-xs text-muted-foreground">{m.seasonYear}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ComparePicker({ a, b }: { a: { id: number; title: string } | null; b: { id: number; title: string } | null }) {
  const router = useRouter()
  const params = useSearchParams()
  const set = (key: 'a' | 'b', m: MediaCard | null) => {
    const next = new URLSearchParams(params.toString())
    if (m) next.set(key, String(m.id))
    else next.delete(key)
    router.push(`/karsilastir?${next.toString()}`, { scroll: false })
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AnimePicker label="Birinci anime" value={a} onPick={(m) => set('a', m)} />
      <AnimePicker label="İkinci anime" value={b} onPick={(m) => set('b', m)} />
    </div>
  )
}
