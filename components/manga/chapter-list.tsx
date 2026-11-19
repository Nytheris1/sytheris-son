'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowDownUp, Search } from 'lucide-react'
import type { ChapterItem } from '@/lib/manga'

const PAGE = 60

export function ChapterList({ mangaId, chapters }: { mangaId: string; chapters: ChapterItem[] }) {
  const [query, setQuery] = useState('')
  const [desc, setDesc] = useState(false)
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? chapters.filter((c) => (c.chapter ?? '').includes(q) || (c.title ?? '').toLowerCase().includes(q)) : chapters
    return desc ? [...filtered].reverse() : filtered
  }, [chapters, query, desc])

  if (!chapters.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-semibold">Bu dilde okunabilir bölüm yok</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Lisanslı seriler yalnızca resmî platformlarda yayınlanır. Diğer dili denemek için yukarıdaki seçiciyi kullan.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 transition focus-within:border-primary">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Bölüm ara</span>
          <input
            type="search"
            inputMode="decimal"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Bölüm numarası ya da adı"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </label>
        <button
          type="button"
          onClick={() => setDesc((v) => !v)}
          aria-pressed={desc}
          className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm transition hover:bg-muted"
        >
          <ArrowDownUp className="size-4" aria-hidden="true" />
          {desc ? 'Yeniden eskiye' : 'Eskiden yeniye'}
        </button>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        {list.slice(0, limit).map((c) => (
          <li key={c.id} className="bg-background">
            <Link href={`/manga/${mangaId}/oku/${c.id}`} className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-muted/60 focus-visible:bg-muted/60">
              <span className="w-14 shrink-0 font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground/90 transition group-hover:text-ink">{c.chapter ?? '—'}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{c.title || (c.chapter ? `${c.chapter}. bölüm` : 'Tek bölüm')}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {[c.volume && `Cilt ${c.volume}`, c.group, `${c.pages} sayfa`].filter(Boolean).join(' · ')}
                </span>
              </span>
              <time dateTime={c.publishedAt} className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:block">
                {new Date(c.publishedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </time>
            </Link>
          </li>
        ))}
      </ol>

      {list.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="mx-auto rounded-full border border-border px-5 py-2 text-sm transition hover:bg-muted">
          {list.length - limit} bölüm daha göster
        </button>
      )}
    </div>
  )
}
