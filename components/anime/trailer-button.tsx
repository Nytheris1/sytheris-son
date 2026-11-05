'use client'

import { useRef, useState } from 'react'
import { ExternalLink, Film, Loader2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { Modal } from '@/components/ui-kit/modal'
import { YTTrailer, type YTHandle } from '@/components/media/yt-trailer'

export function TrailerButton({ videoId, title, poster }: { videoId: string; title: string; poster?: string | null }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-13 items-center gap-2 rounded-full border border-foreground/25 px-5 font-medium backdrop-blur transition hover:bg-foreground/10"
      >
        <Film className="size-4" />
        Fragmanı izle
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`${title} fragmanı`} hideTitle className="dark bg-scrim sm:max-w-5xl">
        {open && <TrailerStage videoId={videoId} poster={poster} />}
      </Modal>
    </>
  )
}

function TrailerStage({ videoId, poster }: { videoId: string; poster?: string | null }) {
  const yt = useRef<YTHandle>(null)
  const [state, setState] = useState<'loading' | 'playing' | 'paused' | 'error'>('loading')
  const [muted, setMuted] = useState(false)

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-scrim text-on-scrim">
      {poster && state !== 'playing' && state !== 'paused' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
      )}
      {state !== 'error' && (
        <YTTrailer
          ref={yt}
          videoId={videoId}
          muted={false}
          loop={false}
          onPlaying={() => {
            setState('playing')
            yt.current?.unMute()
          }}
          onEnded={() => setState('paused')}
          onError={() => setState('error')}
        />
      )}
      {state === 'loading' && (
        <div className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-semibold">Bu fragman gömülü oynatmaya izin vermiyor</p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            YouTube&apos;da aç <ExternalLink className="size-4" />
          </a>
        </div>
      )}
      {(state === 'playing' || state === 'paused') && (
        <>
          <button
            type="button"
            aria-label={state === 'playing' ? 'Duraklat' : 'Oynat'}
            className="absolute inset-0"
            onClick={() => {
              if (state === 'playing') {
                yt.current?.pause()
                setState('paused')
              } else {
                yt.current?.play()
                setState('playing')
              }
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-scrim/90 to-transparent p-4">
            <button
              type="button"
              aria-label={state === 'playing' ? 'Duraklat' : 'Oynat'}
              onClick={() => {
                if (state === 'playing') {
                  yt.current?.pause()
                  setState('paused')
                } else {
                  yt.current?.play()
                  setState('playing')
                }
              }}
              className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              {state === 'playing' ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
            </button>
            <button
              type="button"
              aria-label="Baştan başlat"
              onClick={() => {
                yt.current?.restart()
                setState('playing')
              }}
              className="grid size-11 place-items-center rounded-full bg-on-scrim/10 backdrop-blur transition hover:bg-on-scrim/20"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
              onClick={() => {
                if (muted) yt.current?.unMute()
                else yt.current?.mute()
                setMuted(!muted)
              }}
              className="grid size-11 place-items-center rounded-full bg-on-scrim/10 backdrop-blur transition hover:bg-on-scrim/20"
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.3em] text-on-scrim/60">Resmî fragman</span>
          </div>
        </>
      )}
    </div>
  )
}
