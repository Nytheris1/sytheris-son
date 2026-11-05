'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMusic } from './music-provider'

export function MusicMiniPlayer({ className }: { className?: string }) {
  const m = useMusic()
  // Sadece müzik ÇALARKEN (playing) ve panel açık değilken görünür.
  const visible = Boolean(m.current) && m.playing && !m.panelOpen

  return (
    <AnimatePresence>
      {visible && m.current && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className={cn(
            'fixed z-50 flex w-[calc(100vw-1.5rem)] max-w-xs items-center gap-2 overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-2 shadow-2xl shadow-black/10 backdrop-blur-3xl dark:border-white/10 dark:bg-black/40',
            className,
          )}
          role="region"
          aria-label="Müzik çalar"
        >
          <button
            type="button"
            onClick={() => m.setPanelOpen(true)}
            className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-muted"
            aria-label="Müzik panelini aç"
          >
            {m.current.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.current.cover}
                alt=""
                className={cn('size-full object-cover transition-transform duration-700', m.playing && 'scale-110')}
              />
            ) : (
              <Music2 className="absolute inset-0 m-auto size-5 text-muted-foreground" />
            )}
          </button>

          <button type="button" onClick={() => m.setPanelOpen(true)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium leading-tight text-foreground">{m.current.title}</p>
            <p className="truncate text-xs leading-tight text-muted-foreground">{m.current.artist}</p>
          </button>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={m.prev}
              aria-label="Önceki parça"
              className="hidden size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-black/10 hover:text-foreground sm:grid dark:hover:bg-white/10"
            >
              <SkipBack className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={m.toggle}
              aria-label={m.playing ? 'Duraklat' : 'Oynat'}
              className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:brightness-110 active:scale-95"
            >
              {m.playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
            </button>
            <button
              type="button"
              onClick={m.next}
              aria-label="Sonraki parça"
              className="hidden size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-black/10 hover:text-foreground sm:grid dark:hover:bg-white/10"
            >
              <SkipForward className="size-3.5" />
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: m.duration ? `${Math.min(100, (m.progress / m.duration) * 100)}%` : '0%' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}