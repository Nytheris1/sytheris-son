'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export type Track = {
  id: string
  title: string
  artist: string
  url: string
  cover?: string | null
  source: 'animethemes' | 'itunes'
  anime?: string | null
  kind?: string | null
}

type Ctx = {
  playlist: Track[]
  current: Track | null
  playing: boolean
  progress: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: boolean
  panelOpen: boolean
  setPanelOpen: (v: boolean) => void
  play: (t?: Track) => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (t: number) => void
  setVolume: (v: number) => void
  add: (t: Track) => void
  remove: (id: string) => void
  setShuffle: (v: boolean) => void
  setRepeat: (v: boolean) => void
}

const MusicCtx = createContext<Ctx | null>(null)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.6)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const stateRef = useRef({ playlist, currentId, shuffle, repeat })
  stateRef.current = { playlist, currentId, shuffle, repeat }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sy-playlist') || '[]') as Track[]
      setPlaylist(saved)
      const v = Number(localStorage.getItem('sy-volume'))
      if (!Number.isNaN(v) && v > 0) setVolumeState(v)
    } catch {}
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio
    const onTime = () => setProgress(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      if (stateRef.current.repeat) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else nextRef.current()
    }
    const onError = () => {
      setPlaying(false)
      toast.error('Bu parça çalınamadı', { description: 'Tarayıcın bu ses formatını desteklemiyor olabilir.' })
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    const onExternal = () => audio.pause()
    window.addEventListener('sy:pause-music', onExternal)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      window.removeEventListener('sy:pause-music', onExternal)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    localStorage.setItem('sy-volume', String(volume))
  }, [volume])

  const persist = (list: Track[]) => {
    try {
      localStorage.setItem('sy-playlist', JSON.stringify(list.slice(0, 100)))
    } catch {}
  }

  const load = useCallback((t: Track) => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.src !== t.url) {
      audio.src = t.url
      setProgress(0)
      setDuration(0)
    }
    setCurrentId(t.id)
    audio.play().catch(() => setPlaying(false))
  }, [])

  const add = useCallback((t: Track) => {
    setPlaylist((list) => {
      if (list.some((x) => x.id === t.id)) return list
      const next = [...list, t]
      persist(next)
      return next
    })
  }, [])

  const play = useCallback(
    (t?: Track) => {
      const audio = audioRef.current
      if (!audio) return
      if (t) {
        add(t)
        load(t)
        return
      }
      const { playlist: list, currentId: cid } = stateRef.current
      const cur = list.find((x) => x.id === cid) ?? list[0]
      if (cur) load(cur)
      else setPanelOpen(true)
    },
    [add, load],
  )

  const pause = useCallback(() => audioRef.current?.pause(), [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) play()
    else audio.pause()
  }, [play])

  const step = useCallback(
    (dir: 1 | -1) => {
      const { playlist: list, currentId: cid, shuffle: sh } = stateRef.current
      if (!list.length) return
      const i = list.findIndex((x) => x.id === cid)
      let n = sh && list.length > 1 ? Math.floor(Math.random() * list.length) : i + dir
      if (sh && n === i) n = (n + 1) % list.length
      n = (n + list.length) % list.length
      load(list[n])
    },
    [load],
  )
  const nextRef = useRef(() => {})
  nextRef.current = () => step(1)

  const remove = useCallback((id: string) => {
    setPlaylist((list) => {
      const next = list.filter((x) => x.id !== id)
      persist(next)
      return next
    })
    if (stateRef.current.currentId === id) {
      audioRef.current?.pause()
      setCurrentId(null)
    }
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      playlist,
      current: playlist.find((x) => x.id === currentId) ?? null,
      playing,
      progress,
      duration,
      volume,
      shuffle,
      repeat,
      panelOpen,
      setPanelOpen,
      play,
      pause,
      toggle,
      next: () => step(1),
      prev: () => {
        const audio = audioRef.current
        if (audio && audio.currentTime > 4) audio.currentTime = 0
        else step(-1)
      },
      seek: (t) => {
        if (audioRef.current) audioRef.current.currentTime = t
      },
      setVolume: setVolumeState,
      add,
      remove,
      setShuffle,
      setRepeat,
    }),
    [playlist, currentId, playing, progress, duration, volume, shuffle, repeat, panelOpen, play, pause, toggle, step, add, remove],
  )

  return <MusicCtx.Provider value={value}>{children}</MusicCtx.Provider>
}

export function useMusic() {
  const ctx = useContext(MusicCtx)
  if (!ctx) throw new Error('useMusic must be used within MusicProvider')
  return ctx
}
