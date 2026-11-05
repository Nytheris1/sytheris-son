'use client'

import { cn } from '@/lib/utils'
import { useMusic } from './music-provider'

export function Equalizer({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn('flex h-3.5 items-end gap-[2px]', className)} aria-hidden="true">
      {[0.2, 0.5, 0.1, 0.35].map((d, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full bg-current', playing ? 'eq-bar' : '')}
          style={{ height: playing ? '100%' : `${[40, 70, 55, 30][i]}%`, animationDelay: `${d}s` }}
        />
      ))}
    </span>
  )
}

export function MusicButton() {
  const { playing, setPanelOpen, current } = useMusic()
  return (
    <button
      type="button"
      onClick={() => setPanelOpen(true)}
      aria-label={playing ? `Çalıyor: ${current?.title ?? ''}. Müzik panelini aç` : 'Müzik panelini aç'}
      className={cn(
        'flex h-10 items-center gap-2 rounded-full border px-3.5 transition',
        playing ? 'border-primary/40 bg-accent text-ink' : 'border-border bg-card/60 text-muted-foreground hover:text-foreground',
      )}
    >
      <Equalizer playing={playing} />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">Müzik</span>
    </button>
  )
}
