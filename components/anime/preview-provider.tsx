'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Play, Volume2, VolumeX } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, genreTr, pickTitle } from '@/lib/format'
import { setPrefs, usePrefs } from '@/lib/prefs'
import { YTTrailer, isTrailerBroken, type YTHandle } from '@/components/media/yt-trailer'

type Active = { media: MediaCard; rect: DOMRect }
type Ctx = { show: (media: MediaCard, el: HTMLElement) => void; hide: () => void; cancelShow: () => void }

const PreviewCtx = createContext<Ctx | null>(null)

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Active | null>(null)
  const showTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)
  const pathname = usePathname()

  const clear = () => {
    if (showTimer.current) window.clearTimeout(showTimer.current)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
  }

  const show = useCallback((media: MediaCard, el: HTMLElement) => {
    if (window.innerWidth < 768) return
    clear()
    showTimer.current = window.setTimeout(() => setActive({ media, rect: el.getBoundingClientRect() }), 520)
  }, [])

  const cancelShow = useCallback(() => {
    if (showTimer.current) window.clearTimeout(showTimer.current)
    hideTimer.current = window.setTimeout(() => setActive(null), 140)
  }, [])

  const hide = useCallback(() => {
    clear()
    setActive(null)
  }, [])

  const keep = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
  }

  useEffect(() => {
    setActive(null)
  }, [pathname])

  useEffect(() => {
    if (!active) return
    const onScroll = () => setActive(null)
    window.addEventListener('scroll', onScroll, { passive: true, once: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [active])

  return (
    <PreviewCtx.Provider value={{ show, hide, cancelShow }}>
      {children}
      <PreviewLayer active={active} onEnter={keep} onLeave={hide} />
    </PreviewCtx.Provider>
  )
}

export function usePreview() {
  return useContext(PreviewCtx)
}

function PreviewLayer({ active, onEnter, onLeave }: { active: Active | null; onEnter: () => void; onLeave: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(
    <AnimatePresence>{active && <PreviewCard key={active.media.id} active={active} onEnter={onEnter} onLeave={onLeave} />}</AnimatePresence>,
    document.body,
  )
}

function PreviewCard({ active, onEnter, onLeave }: { active: Active; onEnter: () => void; onLeave: () => void }) {
  const { media, rect } = active
  const prefs = usePrefs()
  const yt = useRef<YTHandle>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [startTrailer, setStartTrailer] = useState(false)
  const title = pickTitle(media.title)
  const trailerId = media.trailer?.site === 'youtube' ? media.trailer.id : null
  const canTrailer = Boolean(trailerId) && prefs.autoplayTrailers && !failed && !isTrailerBroken(trailerId)

  useEffect(() => {
    const id = window.setTimeout(() => setStartTrailer(true), 350)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!playing) return
    if (prefs.trailerSound) yt.current?.unMute()
    else yt.current?.mute()
  }, [prefs.trailerSound, playing])

  const width = Math.min(Math.max(rect.width * 1.75, 340), 420)
  const vw = window.innerWidth
  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), vw - width - 16)
  const mediaH = (width * 9) / 16
  const top = Math.max(rect.top + rect.height * 0.32 - mediaH / 2, 76)
  const originX = ((rect.left + rect.width / 2 - left) / width) * 100

  const image = media.bannerImage || media.coverImage.extraLarge || media.coverImage.large

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ position: 'fixed', left, top, width, transformOrigin: `${originX}% 30%` }}
      className="z-[80] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]"
    >
      <Link href={`/anime/${media.id}`} className="relative block aspect-video overflow-hidden bg-scrim" aria-label={`${title} detayları`} onClick={onLeave}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover" />
        {canTrailer && startTrailer && trailerId && (
          <YTTrailer ref={yt} videoId={trailerId} start={4} onPlaying={() => setPlaying(true)} onError={() => setFailed(true)} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-popover via-popover/40 to-transparent" />
        <p className="absolute bottom-3 left-4 right-14 line-clamp-2 text-lg font-semibold leading-tight text-foreground drop-shadow">{title}</p>
      </Link>
      {playing && (
        <button
          type="button"
          onClick={() => setPrefs({ trailerSound: !prefs.trailerSound })}
          aria-label={prefs.trailerSound ? 'Sesi kapat' : 'Sesi aç'}
          className="absolute right-3 top-[calc(var(--h)-3rem)] grid size-9 place-items-center rounded-full border border-on-scrim/30 bg-scrim/40 text-on-scrim backdrop-blur transition hover:bg-scrim/70"
          style={{ ['--h' as string]: `${mediaH}px` }}
        >
          {prefs.trailerSound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
      )}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/anime/${media.id}`}
            onClick={onLeave}
            className="grid size-10 place-items-center rounded-full bg-foreground text-background transition hover:bg-primary hover:text-primary-foreground"
            aria-label={`${title} izle`}
          >
            <Play className="ml-0.5 size-4 fill-current" />
          </Link>
          <Link
            href={`/anime/${media.id}`}
            onClick={onLeave}
            className="ml-auto grid size-10 place-items-center rounded-full border border-border transition hover:border-foreground"
            aria-label="Daha fazla bilgi"
          >
            <ChevronDown className="size-4" />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {media.averageScore ? <span className="font-semibold text-ink">%{media.averageScore} eşleşme</span> : null}
          {media.seasonYear && <span className="text-muted-foreground">{media.seasonYear}</span>}
          {media.format && <span className="rounded border border-border px-1.5 text-[11px] text-muted-foreground">{formatTr(media.format)}</span>}
          {media.episodes ? <span className="text-muted-foreground">{media.episodes} bölüm</span> : null}
        </div>
        {media.genres && media.genres.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            {media.genres.slice(0, 3).map((g, i) => (
              <span key={g} className="flex items-center gap-2">
                {i > 0 && <span className="size-1 rounded-full bg-muted-foreground/50" />}
                {genreTr(g)}
              </span>
            ))}
          </p>
        )}
      </div>
    </motion.div>
  )
}
