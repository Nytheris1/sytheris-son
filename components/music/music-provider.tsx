'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export type Track = {
  id: string
  title: string
  artist: string
  url: string
  cover?: string | null
  source: 'animethemes' | 'itunes' | 'youtube'
  anime?: string | null
  kind?: string | null
}

type Ctx = {
  playlist: Track[]
  current: Track | null
  playing: boolean
  buffering: boolean
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
  playNext: (t: Track) => void
  move: (id: string, dir: -1 | 1) => void
  clear: () => void
  remove: (id: string) => void
  setShuffle: (v: boolean) => void
  setRepeat: (v: boolean) => void
}

type YTPlayer = {
  loadVideoById: (id: string) => void
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  seekTo: (s: number, allow: boolean) => void
  setVolume: (v: number) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
}

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      width: number
      height: number
      playerVars: Record<string, number | string>
      events: { onReady: () => void; onStateChange: (e: { data: number }) => void; onError: (e: { data: number }) => void }
    },
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytReady: Promise<YTNamespace> | null = null
function loadYT() {
  if (ytReady) return ytReady
  ytReady = new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT)
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      if (window.YT) resolve(window.YT)
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.async = true
    s.onerror = () => {
      ytReady = null
      reject(new Error('YouTube yüklenemedi'))
    }
    document.head.appendChild(s)
  })
  return ytReady
}

const isYT = (t: Track) => t.source === 'youtube' || t.url.startsWith('yt:')
const ytId = (t: Track) => t.url.replace(/^yt:/, '')

const MusicCtx = createContext<Ctx | null>(null)

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ytRef = useRef<YTPlayer | null>(null)
  const ytHost = useRef<HTMLDivElement | null>(null)
  const engine = useRef<'audio' | 'yt'>('audio')
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.6)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const stateRef = useRef({ playlist, currentId, shuffle, repeat, volume })
  stateRef.current = { playlist, currentId, shuffle, repeat, volume }
  const nextRef = useRef(() => {})
  const failures = useRef(0)

  const onEnded = useCallback(() => {
    if (stateRef.current.repeat) {
      if (engine.current === 'yt') {
        ytRef.current?.seekTo(0, true)
        ytRef.current?.playVideo()
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
    } else nextRef.current()
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sy-playlist') || '[]') as Track[]
      setPlaylist(saved.filter((t) => t.source !== 'itunes'))
      const v = Number(localStorage.getItem('sy-volume'))
      if (!Number.isNaN(v) && v > 0) setVolumeState(v)
    } catch {}
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio
    const onTime = () => engine.current === 'audio' && setProgress(audio.currentTime)
    const onMeta = () => engine.current === 'audio' && setDuration(audio.duration || 0)
    const onPlay = () => engine.current === 'audio' && setPlaying(true)
    const onPause = () => engine.current === 'audio' && setPlaying(false)
    const onWaiting = () => setBuffering(true)
    const onPlaying = () => setBuffering(false)
    const onEnd = () => engine.current === 'audio' && onEnded()
    const onError = () => {
      if (engine.current !== 'audio' || !audio.src) return
      setPlaying(false)
      setBuffering(false)
      toast.error('Bu parça çalınamadı', { description: 'Kaynak şu an yanıt vermiyor, sıradakine geçebilirsin.' })
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('error', onError)

    const host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = 'position:fixed;left:-10000px;bottom:0;width:200px;height:200px;opacity:0;pointer-events:none;'
    const inner = document.createElement('div')
    host.appendChild(inner)
    document.body.appendChild(host)
    ytHost.current = inner

    const onExternal = () => {
      audio.pause()
      ytRef.current?.pauseVideo()
    }
    window.addEventListener('sy:pause-music', onExternal)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('error', onError)
      window.removeEventListener('sy:pause-music', onExternal)
      host.remove()
    }
  }, [onEnded])

  useEffect(() => {
    if (panelOpen) loadYT().catch(() => {})
  }, [panelOpen])

  // YouTube has no timeupdate event, so poll while it plays.
  useEffect(() => {
    if (!playing || engine.current !== 'yt') return
    const id = window.setInterval(() => {
      const p = ytRef.current
      if (!p) return
      setProgress(p.getCurrentTime() || 0)
      setDuration(p.getDuration() || 0)
    }, 400)
    return () => window.clearInterval(id)
  }, [playing, currentId])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    ytRef.current?.setVolume(Math.round(volume * 100))
    try {
      localStorage.setItem('sy-volume', String(volume))
    } catch {}
  }, [volume])

  const persist = (list: Track[]) => {
    try {
      localStorage.setItem('sy-playlist', JSON.stringify(list.slice(0, 100)))
    } catch {}
  }

  const ensureYT = useCallback(async () => {
    if (ytRef.current) return ytRef.current
    const YT = await loadYT()
    const host = ytHost.current
    if (!host) throw new Error('host yok')
    return new Promise<YTPlayer>((resolve) => {
      const player = new YT.Player(host, {
        width: 200,
        height: 200,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: () => {
            ytRef.current = player
            player.setVolume(Math.round(stateRef.current.volume * 100))
            resolve(player)
          },
          onStateChange: (e) => {
            if (engine.current !== 'yt') return
            // 1 playing, 2 paused, 0 ended, 3 buffering
            if (e.data === 1) {
              failures.current = 0
              setPlaying(true)
              setBuffering(false)
              setDuration(player.getDuration() || 0)
            } else if (e.data === 2) setPlaying(false)
            else if (e.data === 3) setBuffering(true)
            else if (e.data === 0) {
              setPlaying(false)
              onEnded()
            }
          },
          onError: () => {
            setPlaying(false)
            setBuffering(false)
            failures.current += 1
            const canSkip = stateRef.current.playlist.length > 1 && failures.current < 3
            toast.error('Bu video sitede oynatılamıyor', {
              id: 'yt-error',
              description: canSkip ? 'Sanatçı gömülü oynatmayı kapatmış olabilir. Sıradakine geçiliyor.' : 'Sanatçı gömülü oynatmayı kapatmış olabilir. Başka bir sürüm dene.',
            })
            if (canSkip) window.setTimeout(() => nextRef.current(), 1200)
          },
        },
      })
    })
  }, [onEnded])

  const load = useCallback(
    async (t: Track) => {
      const audio = audioRef.current
      if (!audio) return
      setCurrentId(t.id)
      setProgress(0)
      setDuration(0)
      if (isYT(t)) {
        engine.current = 'yt'
        audio.pause()
        setBuffering(true)
        try {
          const p = await ensureYT()
          p.loadVideoById(ytId(t))
          p.playVideo()
        } catch {
          setBuffering(false)
          toast.error('YouTube oynatıcısı yüklenemedi', { description: 'Reklam engelleyici YouTube’u engelliyor olabilir.' })
        }
        return
      }
      engine.current = 'audio'
      ytRef.current?.pauseVideo()
      if (audio.src !== t.url) audio.src = t.url
      audio.play().catch(() => setPlaying(false))
    },
    [ensureYT],
  )

  const add = useCallback((t: Track) => {
    setPlaylist((list) => {
      if (list.some((x) => x.id === t.id)) return list
      const next = [...list, t]
      persist(next)
      return next
    })
  }, [])

  const playNext = useCallback((t: Track) => {
    setPlaylist((list) => {
      const without = list.filter((x) => x.id !== t.id)
      const at = without.findIndex((x) => x.id === stateRef.current.currentId)
      const next = [...without.slice(0, at + 1), t, ...without.slice(at + 1)]
      persist(next)
      return next
    })
  }, [])

  const move = useCallback((id: string, dir: -1 | 1) => {
    setPlaylist((list) => {
      const i = list.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return list
      const next = [...list]
      ;[next[i], next[j]] = [next[j], next[i]]
      persist(next)
      return next
    })
  }, [])

  const play = useCallback(
    (t?: Track) => {
      if (t) {
        add(t)
        void load(t)
        return
      }
      const { playlist: list, currentId: cid } = stateRef.current
      const cur = list.find((x) => x.id === cid)
      if (cur && cid) {
        if (engine.current === 'yt') ytRef.current?.playVideo()
        else audioRef.current?.play().catch(() => {})
        return
      }
      if (list[0]) void load(list[0])
      else setPanelOpen(true)
    },
    [add, load],
  )

  const pause = useCallback(() => {
    if (engine.current === 'yt') ytRef.current?.pauseVideo()
    else audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    if (playing) pause()
    else play()
  }, [playing, pause, play])

  const step = useCallback(
    (dir: 1 | -1) => {
      const { playlist: list, currentId: cid, shuffle: sh } = stateRef.current
      if (!list.length) return
      const i = list.findIndex((x) => x.id === cid)
      let n = sh && list.length > 1 ? Math.floor(Math.random() * list.length) : i + dir
      if (sh && n === i) n = (n + 1) % list.length
      n = (n + list.length) % list.length
      void load(list[n])
    },
    [load],
  )
  nextRef.current = () => step(1)

  const remove = useCallback(
    (id: string) => {
      setPlaylist((list) => {
        const next = list.filter((x) => x.id !== id)
        persist(next)
        return next
      })
      if (stateRef.current.currentId === id) {
        pause()
        setCurrentId(null)
      }
    },
    [pause],
  )

  const clear = useCallback(() => {
    const cid = stateRef.current.currentId
    setPlaylist((list) => {
      const next = list.filter((x) => x.id === cid)
      persist(next)
      return next
    })
  }, [])

  const seek = useCallback((s: number) => {
    setProgress(s)
    if (engine.current === 'yt') ytRef.current?.seekTo(s, true)
    else if (audioRef.current) audioRef.current.currentTime = s
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      playlist,
      current: playlist.find((x) => x.id === currentId) ?? null,
      playing,
      buffering,
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
        if (progress > 4) seek(0)
        else step(-1)
      },
      seek,
      setVolume: setVolumeState,
      add,
      playNext,
      move,
      clear,
      remove,
      setShuffle,
      setRepeat,
    }),
    [playlist, currentId, playing, buffering, progress, duration, volume, shuffle, repeat, panelOpen, play, pause, toggle, step, seek, add, playNext, move, clear, remove],
  )

  const current = value.current
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    if (!current) {
      ms.metadata = null
      return
    }
    try {
      ms.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.anime ?? 'Sytheris',
        artwork: current.cover ? [{ src: current.cover, sizes: '512x512' }] : [],
      })
      ms.setActionHandler('play', () => play())
      ms.setActionHandler('pause', () => pause())
      ms.setActionHandler('nexttrack', () => step(1))
      ms.setActionHandler('previoustrack', () => step(-1))
    } catch {}
  }, [current, play, pause, step])

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : current ? 'paused' : 'none'
  }, [playing, current])

  return <MusicCtx.Provider value={value}>{children}</MusicCtx.Provider>
}

export function useMusic() {
  const ctx = useContext(MusicCtx)
  if (!ctx) throw new Error('useMusic must be used within MusicProvider')
  return ctx
}
