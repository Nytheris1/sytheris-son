'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtTime } from '@/components/music/music-panel'

export type ProfileSongData = { url: string; title: string; artist: string; cover?: string | null }

/** Opt-in player: nothing plays until the visitor presses play. */
export function ProfileSong({ song }: { song: ProfileSongData }) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const a = new Audio(song.url)
    a.preload = 'metadata'
    a.volume = 0.6
    audio.current = a
    const onTime = () => setTime(a.currentTime)
    const onMeta = () => setDuration(a.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onPause)
    return () => {
      a.pause()
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onPause)
    }
  }, [song.url])

  const toggle = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) {
      window.dispatchEvent(new Event('sy:pause-music'))
      a.play().catch(() => {})
    } else a.pause()
  }

  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={song.cover || '/placeholder.svg'} alt="" className={cn('size-14 shrink-0 rounded-xl object-cover ring-1 ring-border transition-[border-radius] duration-700', playing && 'animate-[spin_14s_linear_infinite] rounded-full')} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{song.title}</p>
        <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: duration ? `${(time / duration) * 100}%` : '0%' }} />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{fmtTime(time)}</span>
        </div>
      </div>
      <button type="button" onClick={toggle} aria-label={playing ? 'Duraklat' : 'Oynat'} className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:brightness-110">
        {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
      </button>
    </div>
  )
}
