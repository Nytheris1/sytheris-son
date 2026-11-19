'use client'

import { useState } from 'react'
import { Captions, ExternalLink, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

type P = { id: string; label: string; url: string }

const TABS = [
  { id: 'sub' as const, label: 'Altyazılı', icon: Captions },
  { id: 'dub' as const, label: 'Dublajlı', icon: Mic },
]

export function FilmWatch({ sub, dub, title, tmdb }: { sub: P[]; dub: P[]; title: string; tmdb: number }) {
  const [tab, setTab] = useState<'sub' | 'dub'>('sub')
  const [pick, setPick] = useState(0)
  const list = tab === 'sub' ? sub : dub
  const active = list[Math.min(pick, list.length - 1)]

  const change = (t: 'sub' | 'dub') => {
    setTab(t)
    setPick(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const on = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => change(t.id)}
              aria-pressed={on}
              className={cn(
                'flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition',
                on ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t.label}
            </button>
          )
        })}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Kaynak</span>
        <div className="flex flex-wrap gap-1.5">
          {list.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={cn(
                'h-8 rounded-full border px-3 font-mono text-[10px] uppercase tracking-wider transition',
                i === pick ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:border-foreground/40',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-black">
        <iframe
          key={active.url}
          src={active.url}
          title={title + ' - ' + (tab === 'sub' ? 'altyazılı' : 'dublajlı')}
          className="absolute inset-0 size-full"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="origin"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <p>Oynatıcı açılmazsa üstteki kaynaklardan başka birini dene.</p>
        <a
          href={'https://www.themoviedb.org/movie/' + tmdb}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5"
        >
          TMDB <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  )
}