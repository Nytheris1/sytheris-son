'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { Clapperboard, Flame, Loader2, Sparkles } from 'lucide-react'
import { setContentMode } from '@/app/actions/content-mode'
import type { ContentMode } from '@/lib/content-mode-shared'
import { cn } from '@/lib/utils'

const MODES: { id: ContentMode; label: string; hint: string; icon: typeof Sparkles }[] = [
  { id: 'anime', label: 'Anime', hint: 'AniList kataloğu, sezonlar, karakterler', icon: Sparkles },
  { id: 'film', label: 'Sinema', hint: 'Anime olmayan filmler, resmî fragmanlar', icon: Clapperboard },
]

/** Segmented switch between the anime and live-action catalogues. Persists in a cookie and refreshes server data. */
export function ModeSwitcher({ mode, className, size = 'md' }: { mode: ContentMode; className?: string; size?: 'sm' | 'md' }) {
  const router = useRouter()
  const [current, setCurrent] = useState(mode)
  const [pending, start] = useTransition()

  const choose = (next: ContentMode) => {
    if (next === current || pending) return
    setCurrent(next)
    start(async () => {
      await setContentMode(next)
      router.refresh()
    })
  }

  return (
    <div role="radiogroup" aria-label="İçerik modu" className={cn('relative grid grid-cols-3 gap-1 rounded-full border border-border bg-card p-1', className)}>
      {MODES.map((m) => {
        const on = current === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => choose(m.id)}
            title={m.hint}
            className={cn('relative flex items-center justify-center gap-2 rounded-full font-medium transition-colors', size === 'sm' ? 'h-9 px-3 text-xs' : 'h-11 px-5 text-sm', on ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {on && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative flex items-center gap-2">
              {pending && on ? <Loader2 className="size-4 animate-spin" /> : <m.icon className="size-4" />}
              {m.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
