'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Loader2, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type Source = { url: string; height: number; label: string }

export function HanimePlayer({ slug, title }: { slug: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [active, setActive] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const res = await fetch('/api/h/sources?slug=' + encodeURIComponent(slug), {
          headers: { Accept: 'application/json' },
        })
        const text = await res.text()
        if (!res.ok) throw new Error('Kaynak servisi ' + res.status + ' - ' + text.slice(0, 70))
        let json: { sources?: Source[]; error?: string }
        try {
          json = JSON.parse(text)
        } catch {
          throw new Error('Servis JSON yerine HTML dondurdu: /api yolu gate tarafindan kapatilmis olabilir.')
        }
        if (!json.sources || !json.sources.length) throw new Error(json.error || 'Kaynak yok')
        if (dead) return
        setSources(json.sources)
        setStatus('ready')
      } catch (err) {
        if (dead) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Bilinmeyen hata')
      }
    })()
    return () => {
      dead = true
    }
  }, [slug, nonce])

  useEffect(() => {
    const el = videoRef.current
    const current = sources[active]
    if (!el || !current) return

    let cleanup = () => {}
    ;(async () => {
      const mod = await import('hls.js')
      const Hls = mod.default
      if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 30, enableWorker: true })
        hls.loadSource(current.url)
        hls.attachMedia(el)
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            setStatus('error')
            setMessage('Yayin kesildi. Baska kaliteyi dene.')
          }
        })
        cleanup = () => hls.destroy()
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = current.url
      } else {
        setStatus('error')
        setMessage('Tarayici HLS desteklemiyor.')
      }
    })()

    return () => {
      cleanup()
    }
  }, [sources, active])

  const external = 'https://hanime.tv/videos/hentai/' + slug

  const retry = () => {
    setStatus('loading')
    setMessage('')
    setActive(0)
    setNonce((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-black">
        <video ref={videoRef} controls playsInline className="absolute inset-0 size-full" />
        {status === 'loading' && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
            <TriangleAlert className="size-6 text-amber-400" />
            <p className="text-sm text-foreground/70">{message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={retry}
                className="rounded-full border border-foreground/25 px-4 py-2 text-sm"
              >
                Tekrar dene
              </button>
              <Link
                href={external}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white"
              >
                hanime.tv
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {sources.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((s, i) => (
              <button
                key={s.url}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                  i === active ? 'border-rose-500 bg-rose-600 text-white' : 'border-border hover:border-rose-500/60',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{sources[0]?.label || ''}</span>
        )}
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-rose-500"
        >
          {title} <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  )
}
