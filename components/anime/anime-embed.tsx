'use client'

import { useState } from 'react'
import { Captions, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

type P = { id: string; label: string; url: string }

const TABS = [
  { id: 'sub' as const, label: 'Altyazılı', icon: Captions },
  { id: 'dub' as const, label: 'Dublajlı', icon: Mic },
]

export function AnimeEmbed({ sub, dub, title }: { sub: P[]; dub: P[]; title: string }) {
  const [tab, setTab] = useState<'sub' | 'dub'>('sub')
  const [pick, setPick] = useState(0)
  const list = tab === 'sub' ? sub : dub
  const active = list[Math.min(pick, list.length - 1)]

  const change = (t: 'sub' | 'dub') => {
    setTab(t)
    setPick(0)
  }

  return (
    <div className="flex flex-col gap-3">
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
                'flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition',
                on ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50',
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
                i === pick ? 'border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border bg-black">
        <iframe
          key={active.url}
          src={active.url}
          title={title + ' - ' + (tab === 'sub' ? 'altyazılı' : 'dublajlı')}
          className="absolute inset-0 size-full"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>

      <p className="text-xs text-muted-foreground">Oynatıcı açılmazsa üstteki diğer kaynağı dene. Altyazı dili oynatıcı menüsünden seçilir.</p>
    </div>
  )
}