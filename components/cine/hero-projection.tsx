'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Muted, looping trailer projected behind the detail hero. Only mounts on wide screens, when the visitor
 * hasn't asked for reduced motion or data saving, and fades in once frames are actually playing.
 */
export function HeroProjection({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const ok = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)').matches && !conn?.saveData
    setEnabled(ok)
  }, [])

  if (!enabled) return null

  return (
    <>
      <video
        ref={ref}
        src={`${src}#t=8`}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        className={cn('absolute inset-0 -z-20 size-full object-cover transition-opacity duration-[1600ms]', playing && !paused ? 'opacity-55' : 'opacity-0')}
      />
      <button
        type="button"
        onClick={() => {
          const v = ref.current
          if (!v) return
          if (v.paused) {
            void v.play()
            setPaused(false)
          } else {
            v.pause()
            setPaused(true)
          }
        }}
        className={cn(
          'absolute right-6 top-7 z-10 flex items-center gap-2 rounded-full border border-foreground/20 bg-scrim/60 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70 backdrop-blur transition hover:border-foreground/50 hover:text-foreground xl:right-10',
          !playing && 'pointer-events-none opacity-0',
        )}
        aria-label={paused ? `${title} arka plan fragmanını oynat` : `${title} arka plan fragmanını durdur`}
      >
        {paused ? <Play className="size-3 fill-current" aria-hidden="true" /> : <Pause className="size-3 fill-current" aria-hidden="true" />}
        {paused ? 'Projeksiyon' : 'Projeksiyonu durdur'}
      </button>
    </>
  )
}
