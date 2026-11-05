'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const broken = new Set<string>()
function loadBroken() {
  try {
    for (const id of JSON.parse(sessionStorage.getItem('sy-yt-broken') || '[]')) broken.add(id)
  } catch {}
}
function markBroken(id: string) {
  broken.add(id)
  try {
    sessionStorage.setItem('sy-yt-broken', JSON.stringify([...broken]))
  } catch {}
}
export function isTrailerBroken(id?: string | null) {
  if (!id) return true
  if (typeof window !== 'undefined' && broken.size === 0) loadBroken()
  return broken.has(id)
}

export type YTHandle = {
  mute: () => void
  unMute: () => void
  play: () => void
  pause: () => void
  restart: () => void
}

type Props = {
  videoId: string
  muted?: boolean
  start?: number
  fit?: 'cover' | 'crop'
  className?: string
  onPlaying?: () => void
  onError?: () => void
  onEnded?: () => void
  loop?: boolean
}

/**
 * Chrome-less YouTube trailer. Uses the IFrame postMessage protocol directly so we can
 * hide the iframe until the video is actually playing (no YouTube UI flashes) and detect
 * embed-blocked videos to fall back gracefully.
 */
export const YTTrailer = forwardRef<YTHandle, Props>(function YTTrailer(
  { videoId, muted = true, start = 0, fit = 'cover', className, onPlaying, onError, onEnded, loop = true },
  ref,
) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [visible, setVisible] = useState(false)
  const [origin, setOrigin] = useState('')
  const visibleRef = useRef(false)
  const cbs = useRef({ onPlaying, onError, onEnded })
  cbs.current = { onPlaying, onError, onEnded }

  useEffect(() => setOrigin(window.location.origin), [])

  const command = (func: string, args: unknown[] = []) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
  }

  useImperativeHandle(ref, () => ({
    mute: () => command('mute'),
    unMute: () => {
      command('unMute')
      command('setVolume', [70])
    },
    play: () => command('playVideo'),
    pause: () => command('pauseVideo'),
    restart: () => {
      command('seekTo', [start, true])
      command('playVideo')
    },
  }))

  useEffect(() => {
    if (!origin) return
    let alive = true
    let listening = 0
    const ping = window.setInterval(() => {
      if (!frame.current?.contentWindow || listening > 40) return
      listening++
      frame.current.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: videoId, channel: 'widget' }), '*')
    }, 250)
    const giveUp = window.setTimeout(() => {
      if (alive && !visibleRef.current) cbs.current.onError?.()
    }, 9000)

    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      if (typeof e.data !== 'string') return
      let data: { event?: string; info?: { playerState?: number } | number }
      try {
        data = JSON.parse(e.data)
      } catch {
        return
      }
      listening = 99
      if (data.event === 'onReady') {
        if (muted) command('mute')
        command('playVideo')
      }
      const state =
        data.event === 'onStateChange' ? (data.info as number) : data.event === 'infoDelivery' && typeof data.info === 'object' ? data.info?.playerState : undefined
      if (state === 1 && !visibleRef.current) {
        visibleRef.current = true
        window.setTimeout(() => {
          if (!alive) return
          setVisible(true)
          cbs.current.onPlaying?.()
        }, 350)
      }
      if (state === 0) cbs.current.onEnded?.()
      if (data.event === 'onError') {
        markBroken(videoId)
        cbs.current.onError?.()
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      alive = false
      window.clearInterval(ping)
      window.clearTimeout(giveUp)
      window.removeEventListener('message', onMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, videoId])

  if (!origin) return null

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    showinfo: '0',
    enablejsapi: '1',
    cc_load_policy: '0',
    start: String(start),
    origin,
    widget_referrer: origin,
  })
  if (loop) {
    params.set('loop', '1')
    params.set('playlist', videoId)
  }

  return (
    <div className={cn('yt-wrap pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <iframe
        ref={frame}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
        title="Fragman"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
        className={cn(fit === 'cover' ? 'yt-cover' : 'yt-crop', 'transition-opacity duration-700', visible ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
})
