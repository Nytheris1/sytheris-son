'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { VideoPlayer } from '@/components/player/video-player'
import { cn } from '@/lib/utils'

type S = { label: string; url: string }

const relay = (url: string, referer: string) =>
  '/api/proxy?url=' + encodeURIComponent(url) + '&referer=' + encodeURIComponent(referer)

export function PornPlayer({ id, title, poster }: { id: string; title: string; poster?: string | null }) {
  const [list, setList] = useState<S[] | null>(null)
  const [pick, setPick] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setList(null)
    setError('')
    setPick(0)
    fetch('/api/porn/sources?id=' + encodeURIComponent(id))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('kaynak ' + r.status))))
      .then((j: { sources?: S[] }) => {
        if (!live) return
        if (!j.sources || !j.sources.length) setError('Kaynak çözülemedi.')
        else setList(j.sources)
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : 'hata')
      })
    return () => {
      live = false
    }
  }, [id])

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
          <iframe
            src={'https://www.eporner.com/embed/' + id + '/'}
            title={title}
            className="absolute inset-0 size-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">yedek oynatıcı</p>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="grid aspect-video place-items-center rounded-3xl border border-white/10 bg-black">
        <Loader2 className="size-6 animate-spin text-rose-400" aria-hidden="true" />
      </div>
    )
  }

  const active = list[Math.min(pick, list.length - 1)]

  return (
    <div className="flex flex-col gap-3">
      <VideoPlayer
        key={active.url}
        src={relay(active.url, 'https://www.eporner.com/')}
        subtitleLang="tr"
        title={title}
        episodeLabel=""
        storageKey={'porn-' + id}
        poster={poster ? '/api/porn/thumb?u=' + btoa(poster).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : null}
      />
      {list.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">kalite</span>
          {list.map((s, i) => (
            <button
              key={s.url}
              onClick={() => setPick(i)}
              aria-pressed={i === pick}
              className={cn(
                'h-8 rounded-full border px-3 font-mono text-[10px] uppercase tracking-wider transition',
                i === pick ? 'border-rose-400 text-rose-300' : 'border-white/15 text-white/45 hover:border-white/40',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}