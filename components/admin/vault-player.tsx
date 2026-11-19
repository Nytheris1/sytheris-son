'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

/**
 * Embedded preview for hunted sources. Plays through the signed /api/medya relay, so the upstream
 * referer/CORS rules are satisfied and the original link never reaches the browser. No download control.
 */
export function VaultPlayer({ src, kind, title, onClose }: { src: string; kind: 'hls' | 'mp4'; title: string; onClose?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const video = ref.current
    if (!video) return
    setState('loading')
    let destroy: (() => void) | undefined
    let cancelled = false

    const fail = (msg: string) => {
      if (cancelled) return
      setMessage(msg)
      setState('error')
    }

    if (kind === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) return fail('Bu tarayıcı HLS oynatmayı desteklemiyor.')
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false, maxBufferLength: 30 })
        hls.on(Hls.Events.MANIFEST_PARSED, () => !cancelled && setState('ready'))
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) return hls.recoverMediaError()
          fail(data.response?.code ? `Kaynak ${data.response.code} döndürdü.` : 'Akış yüklenemedi. Kaynak süresi dolmuş ya da erişime kapalı olabilir.')
        })
        hls.loadSource(src)
        hls.attachMedia(video)
        destroy = () => hls.destroy()
      })
    } else {
      video.src = src
      const onReady = () => setState('ready')
      const onError = () => fail('Video yüklenemedi. Kaynak süresi dolmuş ya da erişime kapalı olabilir.')
      video.addEventListener('loadedmetadata', onReady)
      video.addEventListener('error', onError)
      destroy = () => {
        video.removeEventListener('loadedmetadata', onReady)
        video.removeEventListener('error', onError)
        video.removeAttribute('src')
        video.load()
      }
    }
    return () => {
      cancelled = true
      destroy?.()
    }
  }, [src, kind])

  return (
    <figure className="relative overflow-hidden rounded-2xl border border-border bg-scrim">
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        onContextMenu={(e) => e.preventDefault()}
        className="aspect-video w-full bg-scrim"
        aria-label={`${title} önizleme`}
      />
      {state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-on-scrim/80">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span className="sr-only">Yükleniyor</span>
        </div>
      )}
      {state === 'error' && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-scrim/90 p-6 text-center text-sm text-on-scrim">
          <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
          {message}
        </div>
      )}
      <figcaption className="flex items-center justify-between gap-3 border-t border-on-scrim/10 px-4 py-2.5 text-xs text-on-scrim/70">
        <span className="truncate">{title}</span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="font-mono uppercase tracking-[0.2em]">{kind === 'hls' ? 'HLS' : 'MP4'} · gömülü</span>
          {onClose && (
            <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full text-on-scrim/70 transition hover:bg-on-scrim/10 hover:text-on-scrim" aria-label="Önizlemeyi kapat">
              <X className="size-4" />
            </button>
          )}
        </span>
      </figcaption>
    </figure>
  )
}
