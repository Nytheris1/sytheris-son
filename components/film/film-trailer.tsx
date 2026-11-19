'use client'

import { useRef, useState } from 'react'
import { Play } from 'lucide-react'

/** Poster-first trailer: nothing downloads until the visitor presses play, then native controls take over. */
export function FilmTrailer({ src, poster, title }: { src: string; poster: string; title: string }) {
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)

  return (
    <div className="dark relative aspect-video w-full overflow-hidden rounded-3xl bg-scrim text-foreground ring-1 ring-border">
      {started ? (
        <video ref={ref} src={src} controls autoPlay playsInline className="size-full bg-scrim object-contain" aria-label={`${title} fragmanı`} />
      ) : (
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event('sy:pause-music'))
            setStarted(true)
          }}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`${title} fragmanını oynat`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster || '/placeholder.svg'} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster || '/placeholder.svg'} alt="" className="relative h-[86%] rounded-xl object-contain shadow-2xl transition duration-700 group-hover:scale-[1.02]" />
          <span className="absolute grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_20px_50px_-10px_var(--primary)] transition duration-300 group-hover:scale-110">
            <Play className="ml-1 size-8 fill-current" />
          </span>
          <span className="absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/70">Resmî fragman</span>
        </button>
      )}
    </div>
  )
}
