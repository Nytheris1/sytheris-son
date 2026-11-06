'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Users, HardDrive, Wifi } from 'lucide-react'

export function TorrentPlayer({ magnetURI, subtitleSrc, subtitleLang }: { magnetURI: string, subtitleSrc?: string | null, subtitleLang?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ progress: 0, peers: 0, downloadSpeed: 0 })
  const clientRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    async function initTorrent() {
      try {
        const WebTorrent = (await import('webtorrent')).default
        
        if (!isMounted) return
        
        const client = new WebTorrent()
        clientRef.current = client

        client.on('error', (err: Error) => {
          if (isMounted) setError(`Torrent Hatası: ${err.message}`)
        })

        // WebSocket tracker'ları ekle (Tarayıcıdan bağlantı için şart)
        const trackerList = '&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.webtorrent.dev'
        const finalMagnet = magnetURI.includes('&tr=') ? magnetURI : magnetURI + trackerList

        client.add(finalMagnet, (torrent: any) => {
          if (!isMounted) return

          const file = torrent.files.find((f: any) => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm'))

          if (!file) {
            setError('Torrent içinde oynatılabilir bir video dosyası bulunamadı.')
            return
          }

          setLoading(false)

          if (videoRef.current) {
            file.renderTo(videoRef.current, { autoplay: true, muted: false }, (err: any) => {
              if (err) setError('Video oynatılamadı: ' + err.message)
            })
          }

          const interval = setInterval(() => {
            if (!isMounted) return clearInterval(interval)
            setStats({
              progress: Math.round(torrent.progress * 100),
              peers: torrent.numPeers,
              downloadSpeed: torrent.downloadSpeed,
            })
          }, 1000)
        })
      } catch (err) {
        if (isMounted) setError('WebTorrent başlatılamadı. Tarayıcınız desteklemiyor olabilir.')
      }
    }

    initTorrent()

    return () => {
      isMounted = false
      if (clientRef.current) {
        clientRef.current.destroy()
      }
    }
  }, [magnetURI])

  return (
    <div className="relative flex aspect-video w-full flex-col overflow-hidden rounded-3xl bg-black">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
          <Loader2 className="mb-4 size-8 animate-spin text-primary" />
          <p className="font-mono text-sm text-white/70">Torrent ağına bağlanılıyor ve parçalar çekiliyor...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <p className="mt-2 text-sm text-white/60">Magnet linkini kontrol et veya yeterli seed olup olmadığına bak.</p>
        </div>
      )}

      <video ref={videoRef} className="size-full" controls playsInline crossOrigin="anonymous">
        {subtitleSrc && (
          <track kind="subtitles" src={subtitleSrc} srcLang={subtitleLang || 'tr'} label="Altyazı" default />
        )}
      </video>

      {!loading && !error && (
        <div className="absolute right-4 top-4 flex items-center gap-4 rounded-full bg-black/60 px-4 py-2 font-mono text-xs text-white backdrop-blur-md">
          <span className="flex items-center gap-1.5"><Users className="size-3.5 text-primary" /> {stats.peers}</span>
          <span className="flex items-center gap-1.5"><Wifi className="size-3.5 text-primary" /> {(stats.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s</span>
          <span className="flex items-center gap-1.5"><HardDrive className="size-3.5 text-primary" /> %{stats.progress}</span>
        </div>
      )}
    </div>
  )
}