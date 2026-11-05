'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { setPrefs, usePrefs } from '@/lib/prefs'
import { BackdropImage } from '@/components/media/backdrop-image'
import { YTTrailer, isTrailerBroken, type YTHandle } from '@/components/media/yt-trailer'

export function DetailBackdrop({ media }: { media: MediaCard }) {
  const prefs = usePrefs()
  const yt = useRef<YTHandle>(null)
  const [on, setOn] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const id = media.trailer?.site === 'youtube' ? media.trailer.id : null

  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 3000)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!playing) return
    if (prefs.trailerSound) yt.current?.unMute()
    else yt.current?.mute()
  }, [prefs.trailerSound, playing])

  const show = Boolean(id) && on && prefs.autoplayTrailers && !failed && !isTrailerBroken(id)

  return (
    <>
      <div className="absolute inset-0 -z-10">
        <BackdropImage media={media} priority />
        {show && id && <YTTrailer ref={yt} videoId={id} start={5} onPlaying={() => setPlaying(true)} onError={() => setFailed(true)} />}
        <div className="absolute inset-0 bg-gradient-to-r from-scrim via-scrim/75 to-scrim/20" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-page to-transparent" />
        <div className="grain absolute inset-0" />
      </div>
      {playing && (
        <button
          type="button"
          onClick={() => setPrefs({ trailerSound: !prefs.trailerSound })}
          aria-label={prefs.trailerSound ? 'Fragman sesini kapat' : 'Fragman sesini aç'}
          className="absolute right-4 top-6 z-10 grid size-11 place-items-center rounded-full border border-foreground/25 bg-scrim/30 backdrop-blur transition hover:bg-scrim/60 sm:right-10"
        >
          {prefs.trailerSound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      )}
    </>
  )
}
