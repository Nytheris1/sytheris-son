'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, CalendarDays, Compass, Loader2, Search, Shuffle, Star } from 'lucide-react'
import { Modal } from '@/components/ui-kit/modal'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, pickTitle } from '@/lib/format'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

const QUICK = [
  { href: '/ara?sort=TRENDING_DESC', label: 'Şu an trend olanlar', icon: Star },
  { href: '/takvim', label: 'Yayın takvimi', icon: CalendarDays },
  { href: '/rastgele', label: 'Rastgele anime çevir', icon: Shuffle },
  { href: '/ara', label: 'Tüm katalog', icon: Compass },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const dq = useDebounced(q.trim(), 220)
  const { data, isLoading } = useSWR<{ results: MediaCard[] }>(dq.length > 1 ? `/api/search?q=${encodeURIComponent(dq)}` : null, fetcher, {
    keepPreviousData: true,
  })
  const results = dq.length > 1 ? (data?.results ?? []) : []

  useEffect(() => {
    if (!open) setQ('')
  }, [open])
  useEffect(() => setActive(0), [dq])

  const go = (href: string) => {
    onClose()
    router.push(href)
  }

  return (
    <Modal open={open} onClose={onClose} title="Anime ara" hideTitle side="top" showClose={false} className="sm:max-w-2xl">
      <div className="flex items-center gap-3 border-b border-border px-5">
        <Search className="size-5 text-muted-foreground" />
        <input
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter') {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              if (results[active]) go(`/anime/${results[active].id}`)
              else if (q.trim()) go(`/ara?q=${encodeURIComponent(q.trim())}`)
            }
          }}
          placeholder="Anime adı yaz… (ör. Frieren, Jujutsu Kaisen)"
          className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          aria-label="Anime ara"
        />
        {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {results.length > 0 ? (
          <ul role="listbox" aria-label="Sonuçlar">
            {results.map((m, i) => (
              <li key={m.id} role="option" aria-selected={i === active}>
                <Link
                  href={`/anime/${m.id}`}
                  onClick={onClose}
                  onMouseEnter={() => setActive(i)}
                  className={cn('flex items-center gap-4 rounded-2xl p-2.5 transition', i === active ? 'bg-accent' : 'hover:bg-muted')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.coverImage.large || '/placeholder.svg'} alt="" className="h-16 w-11 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{pickTitle(m.title)}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[m.seasonYear, formatTr(m.format), m.episodes ? `${m.episodes} bölüm` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {m.averageScore ? <span className="font-mono text-sm text-ink">{m.averageScore}%</span> : null}
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ) : dq.length > 1 && !isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {'"'}
            {dq}
            {'"'} için sonuç bulunamadı.
          </p>
        ) : (
          <div className="p-2">
            <p className="label-mono px-2 pb-2 pt-1 text-muted-foreground">Hızlı erişim</p>
            {QUICK.map((l) => (
              <button
                key={l.href}
                type="button"
                onClick={() => go(l.href)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-muted"
              >
                <l.icon className="size-4 text-ink" />
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
