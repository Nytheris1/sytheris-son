'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Captions,
  CaptionsOff,
  Check,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { setPrefs, usePrefs, type Prefs } from '@/lib/prefs'
import { cn } from '@/lib/utils'
import { fmtTime } from '@/components/music/music-panel'

type Props = {
  src: string
  subtitleSrc?: string | null
  subtitleLang: string
  poster?: string | null
  title: string
  episodeLabel: string
  storageKey: string
  nextHref?: string | null
  prevHref?: string | null
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const SUB_SIZES: Record<Prefs['subtitleSize'], string> = { sm: '1.9cqw', md: '2.4cqw', lg: '3cqw', xl: '3.7cqw' }

export function VideoPlayer({ src, subtitleSrc, subtitleLang, poster, title, episodeLabel, storageKey, nextHref, prevHref }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const trackEl = useRef<HTMLTrackElement>(null)
  const hideTimer = useRef<number | null>(null)
  const prefs = usePrefs()

  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [waiting, setWaiting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [controls, setControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [subsOn, setSubsOn] = useState(true)
  const [cue, setCue] = useState('')
  const [menu, setMenu] = useState(false)
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null)
  const [ended, setEnded] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [pipSupported, setPipSupported] = useState(false)

  useEffect(() => setPipSupported(Boolean(document.pictureInPictureEnabled)), [])

  const poke = useCallback(() => {
    setControls(true)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      if (!video.current?.paused) setControls(false)
    }, 2600)
  }, [])

  const toggle = useCallback(() => {
    const v = video.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  const seekBy = useCallback((s: number) => {
    const v = video.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + s))
    setFlash(s > 0 ? `+${s}s` : `${s}s`)
    window.setTimeout(() => setFlash(null), 500)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) wrap.current?.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    window.dispatchEvent(new Event('sy:pause-music'))
    const v = video.current
    if (!v) return
    const saved = Number(localStorage.getItem(`sy-pos-${storageKey}`))
    const onMeta = () => {
      setDuration(v.duration)
      if (saved && saved < v.duration - 15) v.currentTime = saved
      const tt = v.textTracks[0]
      if (tt) tt.mode = 'hidden'
    }
    let lastSave = 0
    const onTime = () => {
      setTime(v.currentTime)
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1))
      if (Date.now() - lastSave > 4000) {
        lastSave = Date.now()
        localStorage.setItem(`sy-pos-${storageKey}`, String(Math.floor(v.currentTime)))
      }
    }
    const onPlay = () => {
      setPlaying(true)
      setEnded(false)
      window.dispatchEvent(new Event('sy:pause-music'))
    }
    const onPause = () => setPlaying(false)
    const onWaiting = () => setWaiting(true)
    const onCanPlay = () => setWaiting(false)
    const onVolume = () => {
      setVolume(v.volume)
      setMuted(v.muted)
    }
    const onEnded = () => {
      setEnded(true)
      localStorage.removeItem(`sy-pos-${storageKey}`)
    }
    const onError = () => {
      setWaiting(false)
      setError('Video yüklenemedi. Bağlantı geçersiz olabilir ya da kaynak erişime kapalı.')
    }
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('progress', onTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('waiting', onWaiting)
    v.addEventListener('canplay', onCanPlay)
    v.addEventListener('playing', onCanPlay)
    v.addEventListener('volumechange', onVolume)
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('progress', onTime)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('waiting', onWaiting)
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('playing', onCanPlay)
      v.removeEventListener('volumechange', onVolume)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [storageKey])

  useEffect(() => {
    const t = trackEl.current
    if (!t) return
    const onCue = () => {
      const active = t.track.activeCues
      if (!active || active.length === 0) return setCue('')
      setCue(
        Array.from(active)
          .map((c) => (c as VTTCue).text.replace(/<[^>]+>/g, ''))
          .join('\n'),
      )
    }
    const onLoad = () => {
      t.track.mode = 'hidden'
    }
    t.addEventListener('cuechange', onCue)
    t.addEventListener('load', onLoad)
    t.track.mode = 'hidden'
    return () => {
      t.removeEventListener('cuechange', onCue)
      t.removeEventListener('load', onLoad)
    }
  }, [subtitleSrc])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return
      const v = video.current
      if (!v) return
      const k = e.key.toLowerCase()
      if (k === ' ' || k === 'k') {
        e.preventDefault()
        toggle()
      } else if (k === 'arrowright' || k === 'l') seekBy(k === 'l' ? 10 : 5)
      else if (k === 'arrowleft' || k === 'j') seekBy(k === 'j' ? -10 : -5)
      else if (k === 'arrowup') {
        e.preventDefault()
        v.volume = Math.min(1, v.volume + 0.1)
      } else if (k === 'arrowdown') {
        e.preventDefault()
        v.volume = Math.max(0, v.volume - 0.1)
      } else if (k === 'm') v.muted = !v.muted
      else if (k === 'f') toggleFullscreen()
      else if (k === 'c') setSubsOn((s) => !s)
      else return
      poke()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, seekBy, toggleFullscreen, poke])

  const VolIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  const pct = duration ? (time / duration) * 100 : 0
  const bufPct = duration ? (buffered / duration) * 100 : 0
  const showUi = controls || !playing || menu

  return (
    <div
      ref={wrap}
      onMouseMove={poke}
      onTouchStart={poke}
      onMouseLeave={() => playing && setControls(false)}
      className={cn('dark group/player relative aspect-video w-full select-none overflow-hidden bg-black text-foreground [container-type:inline-size]', fullscreen ? 'rounded-none' : 'rounded-3xl', !showUi && 'cursor-none')}
    >
      <video
        ref={video}
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full"
        onClick={toggle}
        onDoubleClick={toggleFullscreen}
      >
        {subtitleSrc && <track ref={trackEl} kind="subtitles" src={subtitleSrc} srcLang={subtitleLang} label={subtitleLang.toUpperCase()} default />}
      </video>

      {subsOn && cue && (
        <div className={cn('pointer-events-none absolute inset-x-0 flex justify-center px-[6%] transition-all duration-300', showUi ? 'bottom-[18%]' : 'bottom-[7%]')}>
          <p
            className={cn('whitespace-pre-line text-center font-semibold leading-snug text-on-scrim', prefs.subtitleBg ? 'rounded-lg bg-black/70 px-[0.6em] py-[0.25em]' : '[text-shadow:0_2px_4px_#000,0_0_2px_#000,0_0_8px_#000]')}
            style={{ fontSize: `max(13px, ${SUB_SIZES[prefs.subtitleSize]})` }}
          >
            {cue}
          </p>
        </div>
      )}

      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="size-12 animate-spin text-primary" />
        </div>
      )}

      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-black/60 px-5 py-3 font-mono text-lg text-on-scrim backdrop-blur">{flash}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!playing && !waiting && !error && !ended && (
        <button type="button" onClick={toggle} aria-label="Oynat" className="absolute inset-0 m-auto grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_60px_var(--primary)] transition hover:scale-105">
          <Play className="ml-1 size-8 fill-current" />
        </button>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
          <p className="text-lg font-semibold text-on-scrim">Oynatma hatası</p>
          <p className="max-w-md text-sm text-on-scrim/70">{error}</p>
          <button type="button" onClick={() => location.reload()} className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
            Tekrar dene
          </button>
        </div>
      )}

      {ended && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 p-6 text-center backdrop-blur-sm">
          <p className="label-mono text-primary">Bölüm bitti</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => video.current?.play()} className="flex items-center gap-2 rounded-full border border-on-scrim/30 px-5 py-2.5 text-sm text-on-scrim">
              <RotateCcw className="size-4" /> Tekrar izle
            </button>
            {nextHref && (
              <Link href={nextHref} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                Sonraki bölüm <SkipForward className="size-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className={cn('pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300 sm:p-6', showUi ? 'opacity-100' : 'opacity-0')}>
        <p className="label-mono text-[10px] text-primary">{episodeLabel}</p>
        <p className="mt-1 truncate text-sm font-semibold text-on-scrim sm:text-lg">{title}</p>
      </div>

      <div className={cn('absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-14 transition-opacity duration-300 sm:px-5 sm:pb-4', showUi ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        <div
          className="group/seek relative mb-2 flex h-5 cursor-pointer items-center"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            const x = Math.min(Math.max(e.clientX - r.left, 0), r.width)
            setHover({ x, t: (x / r.width) * duration })
          }}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            if (video.current) video.current.currentTime = ((e.clientX - r.left) / r.width) * duration
          }}
          role="slider"
          tabIndex={0}
          aria-label="İlerleme"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmtTime(time)} / ${fmtTime(duration)}`}
        >
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-on-scrim/20 transition-all group-hover/seek:h-1.5">
            <div className="absolute inset-y-0 left-0 bg-on-scrim/35" style={{ width: `${bufPct}%` }} />
            <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <div className="absolute size-3.5 -translate-x-1/2 scale-0 rounded-full bg-primary shadow transition group-hover/seek:scale-100" style={{ left: `${pct}%` }} />
          {hover && (
            <span className="absolute -top-8 -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 font-mono text-[11px] text-on-scrim" style={{ left: hover.x }}>
              {fmtTime(hover.t)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-on-scrim sm:gap-2">
          <button type="button" onClick={toggle} aria-label={playing ? 'Duraklat' : 'Oynat'} className="grid size-10 place-items-center rounded-full transition hover:bg-on-scrim/10">
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </button>
          <button type="button" onClick={() => seekBy(-10)} aria-label="10 saniye geri" className="hidden size-10 place-items-center rounded-full transition hover:bg-on-scrim/10 sm:grid">
            <RotateCcw className="size-4" />
          </button>
          <button type="button" onClick={() => seekBy(10)} aria-label="10 saniye ileri" className="hidden size-10 place-items-center rounded-full transition hover:bg-on-scrim/10 sm:grid">
            <RotateCw className="size-4" />
          </button>
          <div className="group/vol flex items-center">
            <button type="button" onClick={() => video.current && (video.current.muted = !video.current.muted)} aria-label={muted ? 'Sesi aç' : 'Sesi kapat'} className="grid size-10 place-items-center rounded-full transition hover:bg-on-scrim/10">
              <VolIcon className="size-5" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={muted ? 0 : volume}
              onChange={(e) => {
                if (!video.current) return
                video.current.volume = Number(e.target.value)
                video.current.muted = Number(e.target.value) === 0
              }}
              aria-label="Ses seviyesi"
              className="w-0 accent-[var(--primary)] opacity-0 transition-all duration-300 group-hover/vol:w-20 group-hover/vol:opacity-100 focus:w-20 focus:opacity-100"
            />
          </div>
          <span className="ml-1 font-mono text-[11px] tabular-nums text-on-scrim/80 sm:text-xs">
            {fmtTime(time)} / {fmtTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            {prevHref && (
              <Link href={prevHref} aria-label="Önceki bölüm" className="hidden size-10 place-items-center rounded-full transition hover:bg-on-scrim/10 sm:grid">
                <SkipBack className="size-4" />
              </Link>
            )}
            {nextHref && (
              <Link href={nextHref} aria-label="Sonraki bölüm" className="grid size-10 place-items-center rounded-full transition hover:bg-on-scrim/10">
                <SkipForward className="size-4" />
              </Link>
            )}
            {subtitleSrc && (
              <button type="button" onClick={() => setSubsOn((s) => !s)} aria-pressed={subsOn} aria-label="Altyazı" className={cn('grid size-10 place-items-center rounded-full transition hover:bg-on-scrim/10', subsOn && 'text-primary')}>
                {subsOn ? <Captions className="size-5" /> : <CaptionsOff className="size-5" />}
              </button>
            )}
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Oynatıcı ayarları" className="grid size-10 place-items-center rounded-full transition hover:bg-on-scrim/10">
                <Settings className={cn('size-5 transition-transform duration-500', menu && 'rotate-90')} />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-12 right-0 w-64 rounded-2xl border border-on-scrim/10 bg-black/90 p-3 text-sm text-on-scrim backdrop-blur-xl"
                  >
                    <p className="label-mono mb-2 text-[9px] text-on-scrim/50">Hız</p>
                    <div className="mb-3 grid grid-cols-3 gap-1">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSpeed(s)
                            if (video.current) video.current.playbackRate = s
                          }}
                          className={cn('rounded-lg py-1.5 font-mono text-xs transition', speed === s ? 'bg-primary text-primary-foreground' : 'hover:bg-on-scrim/10')}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                    {subtitleSrc && (
                      <>
                        <p className="label-mono mb-2 text-[9px] text-on-scrim/50">Altyazı boyutu</p>
                        <div className="mb-3 grid grid-cols-4 gap-1">
                          {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                            <button key={s} type="button" onClick={() => setPrefs({ subtitleSize: s })} className={cn('rounded-lg py-1.5 font-mono text-xs uppercase transition', prefs.subtitleSize === s ? 'bg-primary text-primary-foreground' : 'hover:bg-on-scrim/10')}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => setPrefs({ subtitleBg: !prefs.subtitleBg })} className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition hover:bg-on-scrim/10">
                          Altyazı arka planı
                          {prefs.subtitleBg && <Check className="size-4 text-primary" />}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {pipSupported && (
              <button
                type="button"
                onClick={() => {
                  if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {})
                  else video.current?.requestPictureInPicture().catch(() => {})
                }}
                aria-label="Resim içinde resim"
                className="hidden size-10 place-items-center rounded-full transition hover:bg-on-scrim/10 sm:grid"
              >
                <PictureInPicture2 className="size-4" />
              </button>
            )}
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'} className="grid size-10 place-items-center rounded-full transition hover:bg-on-scrim/10">
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
