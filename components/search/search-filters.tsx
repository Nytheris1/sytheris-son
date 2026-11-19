'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { GENRE_LIST, genreTr } from '@/lib/format'
import { DEMOGRAPHICS, TROPE_GROUPS, TROPE_LABEL } from '@/lib/tropes'
import { cn } from '@/lib/utils'

const SORTS = [
  ['POPULARITY_DESC', 'Popülerlik'],
  ['TRENDING_DESC', 'Trend'],
  ['SCORE_DESC', 'Puan'],
  ['START_DATE_DESC', 'En yeni'],
  ['FAVOURITES_DESC', 'Favori'],
] as const
const FORMATS = [
  ['', 'Tüm formatlar'],
  ['TV', 'TV'],
  ['MOVIE', 'Film'],
  ['ONA', 'ONA'],
  ['OVA', 'OVA'],
  ['SPECIAL', 'Özel'],
] as const
const STATUSES = [
  ['', 'Tüm durumlar'],
  ['RELEASING', 'Yayında'],
  ['FINISHED', 'Tamamlandı'],
  ['NOT_YET_RELEASED', 'Yakında'],
] as const
const SEASONS = [
  ['', 'Tüm sezonlar'],
  ['WINTER', 'Kış'],
  ['SPRING', 'İlkbahar'],
  ['SUMMER', 'Yaz'],
  ['FALL', 'Sonbahar'],
] as const

const selectCls = 'h-11 w-full min-w-0 truncate rounded-full border border-border bg-card px-4 text-sm outline-none transition focus:border-primary sm:w-auto'

export function SearchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [group, setGroup] = useState(TROPE_GROUPS[0].id)
  const years = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() + 1 - i)

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    next.delete('page')
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      if ((params.get('q') ?? '') !== q.trim()) update({ q: q.trim() })
    }, 450)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const genre = params.get('genre') ?? ''
  const tags = (params.get('tag') ?? '').split(',').filter(Boolean)
  const active = ['q', 'genre', 'tag', 'year', 'season', 'format', 'status', 'sort'].some((k) => params.get(k))

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Anime adı ara…"
          aria-label="Anime adı"
          className="h-16 w-full rounded-full border border-border bg-card pl-14 pr-14 text-lg outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
        />
        {pending && <Loader2 className="absolute right-6 top-1/2 size-5 -translate-y-1/2 animate-spin text-ink" />}
      </div>
      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <select aria-label="Sıralama" className={selectCls} value={params.get('sort') ?? ''} onChange={(e) => update({ sort: e.target.value })}>
          <option value="">Sırala: Varsayılan</option>
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              Sırala: {l}
            </option>
          ))}
        </select>
        <select aria-label="Format" className={selectCls} value={params.get('format') ?? ''} onChange={(e) => update({ format: e.target.value })}>
          {FORMATS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Durum" className={selectCls} value={params.get('status') ?? ''} onChange={(e) => update({ status: e.target.value })}>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Sezon" className={selectCls} value={params.get('season') ?? ''} onChange={(e) => update({ season: e.target.value })}>
          {SEASONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Yıl" className={selectCls} value={params.get('year') ?? ''} onChange={(e) => update({ year: e.target.value })}>
          <option value="">Tüm yıllar</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {active && (
          <button
            type="button"
            onClick={() => {
              setQ('')
              start(() => router.push(pathname, { scroll: false }))
            }}
            className="flex h-11 items-center gap-1.5 rounded-full px-4 text-sm text-muted-foreground transition hover:text-destructive"
          >
            <X className="size-4" /> Temizle
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-mono text-muted-foreground">Anime klişeleri · seçilenlerin hepsi</p>
          <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-full bg-muted p-1" role="tablist" aria-label="Klişe grubu">
            {[...TROPE_GROUPS, { id: 'demo', label: 'Demografi', items: DEMOGRAPHICS }].map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={group === g.id}
                onClick={() => setGroup(g.id)}
                className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition', group === g.id ? 'bg-card shadow-sm' : 'text-muted-foreground')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {[...TROPE_GROUPS, { id: 'demo', label: 'Demografi', items: DEMOGRAPHICS }]
            .find((g) => g.id === group)
            ?.items.map((t) => {
              const on = tags.includes(t.tag)
              return (
                <button
                  key={t.tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ tag: (on ? tags.filter((x) => x !== t.tag) : [...tags, t.tag].slice(-3)).join(',') })}
                  className={cn('shrink-0 rounded-full border px-4 py-2 text-sm transition', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-ink')}
                >
                  {t.label}
                </button>
              )
            })}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Seçili:</span>
            {tags.map((t) => (
              <button key={t} type="button" onClick={() => update({ tag: tags.filter((x) => x !== t).join(',') })} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium">
                {TROPE_LABEL[t] ?? t} <X className="size-3" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {GENRE_LIST.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={genre === g}
            onClick={() => update({ genre: genre === g ? '' : g })}
            className={cn('shrink-0 rounded-full border px-4 py-2 text-sm transition', genre === g ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-ink')}
          >
            {genreTr(g)}
          </button>
        ))}
      </div>
    </div>
  )
}
