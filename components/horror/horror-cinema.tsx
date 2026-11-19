'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Dices, Lock, Play, Search, Skull, Volume2, X } from 'lucide-react'
import { toast } from 'sonner'
import { markMidnightScreening } from '@/app/actions/membership'
import { HORROR_KINDS, horrorRuntime, horrorThumb, type HorrorFilm, type HorrorKind } from '@/lib/horror'
import { cn } from '@/lib/utils'
import { Mascot } from '@/components/mascot/mascot'

export type CinemaFilm = Omit<HorrorFilm, 'youtubeId'> & { youtubeId?: string }

const OUT = [0.16, 1, 0.3, 1] as const
const WARNED_KEY = 'sy-horror-warned'
const SCREENED_KEY = 'sy-horror-screened'

type Length = 'all' | 'micro' | 'mid' | 'long'
type Sort = 'curated' | 'short' | 'scary'
const LENGTHS: { id: Length; label: string }[] = [
  { id: 'all', label: 'Her süre' },
  { id: 'micro', label: '5 dk altı' },
  { id: 'mid', label: '5–10 dk' },
  { id: 'long', label: '10 dk +' },
]
const SORTS: { id: Sort; label: string }[] = [
  { id: 'curated', label: 'Küratör seçimi' },
  { id: 'scary', label: 'En korkutucu' },
  { id: 'short', label: 'En kısa' },
]

function Intensity({ level, className }: { level: 1 | 2 | 3; className?: string }) {
  return (
    <span className={cn('flex items-center gap-0.5', className)} aria-label={`Korku seviyesi ${level}/3`} role="img">
      {[1, 2, 3].map((n) => (
        <Skull key={n} className={cn('size-3.5', n <= level ? 'text-[var(--hx)]' : 'text-foreground/20')} aria-hidden="true" />
      ))}
    </span>
  )
}

function Still({ film, index, className, quality = 'hq' }: { film: CinemaFilm; index: number; className?: string; quality?: 'hq' | 'max' }) {
  if (film.youtubeId) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={horrorThumb(film.youtubeId, quality) || '/placeholder.svg'} alt="" loading="lazy" className={cn('size-full object-cover', className)} />
  }
  const x = 15 + ((index * 37) % 70)
  const y = 20 + ((index * 53) % 60)
  return (
    <span
      aria-hidden="true"
      className={cn('relative flex size-full items-center justify-center overflow-hidden bg-scrim', className)}
      style={{ backgroundImage: `radial-gradient(60% 80% at ${x}% ${y}%, color-mix(in oklch, var(--hx) 38%, transparent), transparent 70%)` }}
    >
      <span className="absolute -bottom-[0.18em] -left-[0.04em] whitespace-nowrap font-serif text-[5.5rem] italic leading-none text-foreground/[0.07]">{film.title}</span>
      <span className="relative flex flex-col items-center gap-2 px-6 text-center">
        <Lock className="size-4 text-[var(--hx)]" />
        <span className="line-clamp-2 text-balance font-serif text-2xl italic leading-tight text-foreground/85">{film.title}</span>
      </span>
    </span>
  )
}

function Sprockets() {
  return (
    <span aria-hidden="true" className="absolute inset-x-0 flex justify-between px-2">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="h-2 w-3 rounded-[2px] bg-scrim" />
      ))}
    </span>
  )
}

function FilmCard({ film, index, number, onPlay }: { film: CinemaFilm; index: number; number: number; onPlay: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: OUT }}
    >
      <button type="button" onClick={onPlay} className="group flex w-full flex-col text-left outline-none" aria-label={`${film.title} — ${film.director}${film.youtubeId ? '' : ' (kilitli)'}`}>
        <span className="relative block overflow-hidden rounded-2xl bg-foreground/[0.04] ring-1 ring-foreground/10 transition duration-500 group-hover:-translate-y-1 group-hover:ring-[var(--hx)] group-hover:shadow-[0_30px_60px_-30px_var(--hx)] group-focus-visible:ring-2 group-focus-visible:ring-[var(--hx)]">
          <span className="relative block aspect-video overflow-hidden">
            <Still film={film} index={index} className="scale-[1.03] grayscale-[0.6] transition duration-700 group-hover:scale-110 group-hover:grayscale-0" />
            <span className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/20 to-transparent" />
            <span className="hx-grain absolute inset-0 opacity-60" />
            <span className="absolute inset-0 bg-[var(--hx)] opacity-0 mix-blend-color transition duration-500 group-hover:opacity-25" />
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-scrim/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/85 backdrop-blur">
              <Clock className="size-3" aria-hidden="true" />
              {horrorRuntime(film.duration)}
            </span>
            <span className="absolute right-3 top-3 rounded-full bg-scrim/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">{film.kind}</span>
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-14 scale-75 place-items-center rounded-full bg-[var(--hx)] text-foreground opacity-0 shadow-[0_0_50px_var(--hx)] transition duration-500 group-hover:scale-100 group-hover:opacity-100">
                {film.youtubeId ? <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" /> : <Lock className="size-5" aria-hidden="true" />}
              </span>
            </span>
            <span className="absolute inset-x-3 bottom-3 font-serif text-lg italic leading-tight text-foreground/90 transition duration-500 group-hover:translate-y-0 sm:translate-y-1">{film.tagline}</span>
          </span>
          {/* ticket stub */}
          <span className="relative flex items-center gap-3 border-t border-dashed border-foreground/15 px-4 py-3">
            <span aria-hidden="true" className="absolute -left-2 -top-2 size-4 rounded-full bg-scrim" />
            <span aria-hidden="true" className="absolute -right-2 -top-2 size-4 rounded-full bg-scrim" />
            <span className="font-mono text-[10px] uppercase leading-tight tracking-[0.2em] text-[var(--hx)]">
              Seans
              <span className="block text-lg font-bold tabular-nums tracking-normal">{String(number).padStart(2, '0')}</span>
            </span>
            <span className="h-8 w-px bg-foreground/10" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold tracking-tight">{film.title}</span>
              <span className="block truncate text-xs text-foreground/50">{[film.director, film.year, film.country].filter(Boolean).join(' · ')}</span>
            </span>
            <Intensity level={film.intensity} />
          </span>
        </span>
      </button>
    </motion.li>
  )
}

function Theater({
  film,
  index,
  total,
  films,
  warned,
  onAccept,
  onStep,
  onJump,
  onClose,
}: {
  film: CinemaFilm
  index: number
  total: number
  films: CinemaFilm[]
  warned: boolean
  onAccept: () => void
  onStep: (d: number) => void
  onJump: (i: number) => void
  onClose: () => void
}) {
  const [curtain, setCurtain] = useState(true)
  useEffect(() => {
    setCurtain(true)
    if (!warned) return
    const id = window.setTimeout(() => setCurtain(false), 1600)
    return () => clearTimeout(id)
  }, [film.slug, warned])

  const upcoming = Array.from({ length: Math.min(6, total - 1) }, (_, k) => (index + k + 1) % total)

  return (
    <motion.div
      key="theater"
      role="dialog"
      aria-modal="true"
      aria-label={`${film.title} oynatılıyor`}
      className="fixed inset-0 z-[120] flex flex-col overflow-y-auto bg-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="hx-grain pointer-events-none fixed inset-0 opacity-40" />
      <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hx)]">
            Seans {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · {horrorRuntime(film.duration)}
          </p>
          <p className="truncate text-lg font-semibold tracking-tight">{film.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onStep(-1)} aria-label="Önceki film" className="grid size-11 place-items-center rounded-full border border-foreground/15 transition hover:border-[var(--hx)]">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onStep(1)} aria-label="Sonraki film" className="grid size-11 place-items-center rounded-full border border-foreground/15 transition hover:border-[var(--hx)]">
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={onClose} aria-label="Sinemadan çık" className="grid size-11 place-items-center rounded-full bg-foreground text-background transition hover:scale-105">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center px-4 sm:px-8">
        <div className="relative aspect-video w-full max-w-[min(1280px,calc((100dvh-260px)*16/9))] overflow-hidden rounded-2xl bg-scrim shadow-[0_0_140px_-30px_var(--hx)] ring-1 ring-foreground/10">
          {warned && film.youtubeId ? (
            <iframe
              key={film.youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&color=white`}
              title={film.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
              <Skull className="size-10 text-[var(--hx)]" aria-hidden="true" />
              <p className="max-w-md text-balance text-2xl font-semibold tracking-tight">Bu seçki ani, yüksek sesli ve rahatsız edici sahneler içerir.</p>
              <p className="max-w-sm text-sm leading-relaxed text-foreground/60">Kalp rahatsızlığın varsa ya da yalnızsan, ışıkları açık bırakmanı öneririz.</p>
              <button type="button" onClick={onAccept} className="flex h-12 items-center gap-2 rounded-full bg-[var(--hx)] px-6 font-semibold text-foreground transition hover:brightness-110">
                <Play className="size-4 fill-current" aria-hidden="true" /> İzlemeye hazırım
              </button>
            </div>
          )}

          {/* Velvet curtain hides YouTube's own loading chrome */}
          <AnimatePresence>
            {warned && curtain && (
              <motion.div key={`curtain-${film.slug}`} className="pointer-events-none absolute inset-0 flex" exit={{ opacity: 1, transition: { duration: 0.95 } }}>
                <motion.span className="relative h-full flex-1 overflow-hidden bg-scrim" initial={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}>
                  <Still film={film} index={index} quality="max" className="absolute inset-0 h-full w-[200%] max-w-none opacity-50" />
                </motion.span>
                <motion.span className="relative h-full flex-1 overflow-hidden bg-scrim" initial={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}>
                  <Still film={film} index={index} quality="max" className="absolute inset-0 -left-full h-full w-[200%] max-w-none opacity-50" />
                </motion.span>
                <motion.div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-scrim/50 text-center" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--hx)]">Perde açılıyor</p>
                  <p className="text-balance px-6 font-serif text-3xl italic sm:text-5xl">{film.tagline}</p>
                  <span className="mt-2 h-px w-40 overflow-hidden bg-foreground/15">
                    <motion.span className="block h-full origin-left bg-[var(--hx)]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: 'linear' }} />
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 pb-8 pt-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-foreground/60">
          <p className="max-w-2xl text-pretty leading-relaxed">{film.synopsis}</p>
          <span className="flex items-center gap-3">
            <Intensity level={film.intensity} />
            <span className="font-mono text-xs">{[film.director, film.year].filter(Boolean).join(' · ')}</span>
          </span>
        </div>
        {upcoming.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/45">Sıradaki seanslar</p>
            <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {upcoming.map((i) => {
                const f = films[i]
                return (
                  <li key={f.slug} className="w-48 shrink-0">
                    <button type="button" onClick={() => onJump(i)} className="group flex w-full flex-col gap-2 text-left">
                      <span className="relative block aspect-video overflow-hidden rounded-xl ring-1 ring-foreground/10 transition group-hover:ring-[var(--hx)]">
                        <Still film={f} index={i} className="grayscale-[0.5] transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-scrim/80 px-1.5 py-0.5 font-mono text-[10px]">{horrorRuntime(f.duration)}</span>
                      </span>
                      <span className="truncate text-sm font-medium">{f.title}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function HorrorCinema({ films, unlocked, loggedIn }: { films: CinemaFilm[]; unlocked: boolean; loggedIn: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState<number | null>(null)
  const [warned, setWarned] = useState(true)
  const [upsell, setUpsell] = useState(false)
  const [kind, setKind] = useState<HorrorKind | 'all'>('all')
  const [length, setLength] = useState<Length>('all')
  const [sort, setSort] = useState<Sort>('curated')
  const [query, setQuery] = useState('')
  const [freshOnly, setFreshOnly] = useState(false)
  const freshCount = useMemo(() => films.filter((f) => f.tags.includes('Yeni')).length, [films])
  const film = open === null ? null : films[open]

  const featuredIndex = useMemo(() => {
    const day = Math.floor(Date.now() / 86_400_000)
    return day % films.length
  }, [films.length])
  const featured = films[featuredIndex]

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    const list = films
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => (kind === 'all' ? true : f.kind === kind))
      .filter(({ f }) => !freshOnly || f.tags.includes('Yeni'))
      .filter(({ f }) => (length === 'micro' ? f.duration < 300 : length === 'mid' ? f.duration >= 300 && f.duration < 600 : length === 'long' ? f.duration >= 600 : true))
      .filter(({ f }) => !q || [f.title, f.director, f.tagline, ...f.tags].join(' ').toLocaleLowerCase('tr').includes(q))
    if (sort === 'short') list.sort((a, b) => a.f.duration - b.f.duration)
    if (sort === 'scary') list.sort((a, b) => b.f.intensity - a.f.intensity || a.i - b.i)
    return list
  }, [films, kind, length, sort, query, freshOnly])

  const totalMinutes = Math.round(films.reduce((s, f) => s + f.duration, 0) / 60)

  useEffect(() => {
    try {
      setWarned(Boolean(sessionStorage.getItem(WARNED_KEY)))
    } catch {}
  }, [])

  const close = useCallback(() => setOpen(null), [])
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + films.length) % films.length)), [films.length])

  useEffect(() => {
    if (open === null && !upsell) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null)
        setUpsell(false)
      }
      if (open !== null && e.key === 'ArrowRight') step(1)
      if (open !== null && e.key === 'ArrowLeft') step(-1)
    }
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, upsell, step])

  function play(i: number) {
    if (!unlocked) {
      setUpsell(true)
      return
    }
    window.dispatchEvent(new Event('sy:pause-music'))
    setOpen(i)
    try {
      if (sessionStorage.getItem(SCREENED_KEY)) return
      sessionStorage.setItem(SCREENED_KEY, '1')
    } catch {}
    markMidnightScreening()
      .then((r) => {
        if (r.ok && 'awarded' in r && r.awarded) toast.success('Yeni rozet: Gece Yarısı Seansı', { description: 'Profilinde artık parlıyor.' })
      })
      .catch(() => {})
  }

  function roulette() {
    const pool = visible.length ? visible : films.map((f, i) => ({ f, i }))
    const pick = pool[Math.floor(Math.random() * pool.length)]
    toast(`Bu gecenin kurbanı: ${pick.f.title}`, { description: pick.f.tagline })
    play(pick.i)
  }

  function acceptWarning() {
    setWarned(true)
    try {
      sessionStorage.setItem(WARNED_KEY, '1')
    } catch {}
  }

  const chip = (active: boolean) =>
    cn('h-9 shrink-0 rounded-full border px-4 text-sm transition', active ? 'border-[var(--hx)] bg-[var(--hx)] text-foreground' : 'border-foreground/15 text-foreground/70 hover:border-foreground/40 hover:text-foreground')

  return (
    <div className="dark relative isolate bg-scrim pb-24 text-foreground" style={{ '--hx': 'oklch(0.6 0.22 25)' } as React.CSSProperties}>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/korku/hero.webp" alt="" className="hx-drift size-full object-cover object-[70%_50%] opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-scrim via-scrim/80 to-scrim/10" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-scrim to-transparent" />
          <div className="hx-grain absolute inset-0" />
          <div className="hx-scan absolute inset-0" />
        </div>
        <div className="mx-auto grid min-h-[min(86svh,800px)] max-w-[1440px] items-end gap-10 px-4 pb-14 pt-32 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:px-10">
          <div className="flex flex-col gap-7">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: OUT }} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-[var(--hx)]">
              <span className="h-px w-10 bg-[var(--hx)]" />
              Sytheris+ · Kısa film arşivi
            </motion.p>
            <h1 className="max-w-4xl text-balance text-6xl font-bold leading-[0.88] tracking-[-0.05em] sm:text-7xl lg:text-[8.5rem]">
              <motion.span className="block" initial={{ opacity: 0, filter: 'blur(14px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 1.4, ease: OUT }}>
                Gece Yarısı
              </motion.span>
              <motion.span className="hx-flicker block font-serif font-normal italic text-[var(--hx)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.9 }}>
                Sineması
              </motion.span>
            </h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease: OUT }} className="max-w-xl text-pretty text-lg leading-relaxed text-foreground/70">
              Yönetmenlerin kendi kanallarından derlediğimiz {films.length} kısa korku filmi, toplam {totalMinutes} dakikalık kâbus. Işıkları kapat, kulaklığını tak.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: OUT }} className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => play(featuredIndex)}
                className="group flex h-13 items-center gap-3 rounded-full bg-[var(--hx)] pl-6 pr-2 font-semibold text-foreground shadow-[0_14px_50px_-12px_var(--hx)] transition hover:brightness-110 active:scale-[0.98]"
              >
                {unlocked ? <Play className="size-4 fill-current" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                {unlocked ? 'Seansı başlat' : 'Sytheris+ ile kilidi aç'}
                <span className="grid size-9 place-items-center rounded-full bg-scrim/80 transition-transform duration-500 group-hover:rotate-[-45deg]">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </span>
              </button>
              <button type="button" onClick={roulette} className="flex h-13 items-center gap-2 rounded-full border border-foreground/20 px-5 text-sm font-medium backdrop-blur transition hover:border-[var(--hx)]">
                <Dices className="size-4" aria-hidden="true" /> Kader seansı
              </button>
              <span className="hidden items-center gap-2 text-sm text-foreground/55 sm:flex">
                <Volume2 className="size-4" aria-hidden="true" /> Kulaklık önerilir
              </span>
            </motion.div>
          </div>

          {featured && (
            <motion.button
              type="button"
              onClick={() => play(featuredIndex)}
              initial={{ opacity: 0, y: 30, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 1.5 }}
              transition={{ duration: 1, delay: 0.4, ease: OUT }}
              whileHover={{ rotate: 0, scale: 1.02 }}
              className="group relative hidden w-full max-w-lg justify-self-end overflow-hidden rounded-xl bg-foreground/90 py-4 text-left shadow-[0_40px_80px_-30px_var(--hx)] lg:block"
              aria-label={`Bu gecenin filmi: ${featured.title}`}
            >
              <span className="relative block">
                <span className="absolute -top-3 block w-full">
                  <Sprockets />
                </span>
              </span>
              <span className="relative mx-3 block aspect-video overflow-hidden rounded-sm">
                <Still film={featured} index={featuredIndex} quality="max" className="transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/10 to-transparent" />
                <span className="hx-grain absolute inset-0" />
                <span className="absolute left-4 top-4 rounded-full bg-[var(--hx)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground">Bu gecenin filmi</span>
                <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-foreground">
                  <span className="min-w-0">
                    <span className="block truncate text-2xl font-bold tracking-tight">{featured.title}</span>
                    <span className="block truncate text-sm text-foreground/70">
                      {featured.director} · {horrorRuntime(featured.duration)}
                    </span>
                  </span>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--hx)] shadow-[0_0_40px_var(--hx)] transition group-hover:scale-110">
                    {featured.youtubeId ? <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" /> : <Lock className="size-5" aria-hidden="true" />}
                  </span>
                </span>
              </span>
              <span className="relative block">
                <span className="absolute top-1 block w-full">
                  <Sprockets />
                </span>
              </span>
            </motion.button>
          )}
        </div>
      </section>

      {/* Programme */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:px-10" aria-labelledby="program">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-foreground/10 pt-10">
          <h2 id="program" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Arşivin <span className="font-serif font-normal italic text-[var(--hx)]">tamamı</span>
          </h2>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/45">{unlocked ? 'Perde açık' : 'Perde kapalı — üyelere özel'}</p>
        </div>

        <div className="sticky top-16 z-20 -mx-4 flex flex-col gap-3 border-y border-foreground/10 bg-scrim/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-52 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Film, yönetmen, etiket…"
                aria-label="Arşivde ara"
                className="h-10 w-full rounded-full border border-foreground/15 bg-transparent pl-10 pr-4 text-sm outline-none transition placeholder:text-foreground/35 focus:border-[var(--hx)]"
              />
            </div>
            <label className="sr-only" htmlFor="hx-sort">
              Sırala
            </label>
            <select
              id="hx-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 rounded-full border border-foreground/15 bg-scrim px-4 text-sm text-foreground outline-none transition focus:border-[var(--hx)]"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/45">
              {visible.length} / {films.length} film
            </span>
          </div>
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
            {freshCount > 0 && (
              <>
                <button type="button" aria-pressed={freshOnly} onClick={() => setFreshOnly((v) => !v)} className={cn(chip(freshOnly), 'flex items-center gap-2')}>
                  <span className="relative flex size-2" aria-hidden="true">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--hx)] opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-[var(--hx)]" />
                  </span>
                  Yeni seans
                  <span className="font-mono text-[11px] opacity-60">{freshCount}</span>
                </button>
                <span aria-hidden="true" className="mx-1 w-px shrink-0 bg-foreground/15" />
              </>
            )}
            <div role="group" aria-label="Tür" className="flex gap-2">
              <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')} className={chip(kind === 'all')}>
                Tümü
              </button>
              {HORROR_KINDS.map((k) => (
                <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={chip(kind === k)}>
                  {k}
                </button>
              ))}
            </div>
            <span aria-hidden="true" className="mx-1 w-px shrink-0 bg-foreground/15" />
            <div role="group" aria-label="Süre" className="flex gap-2">
              {LENGTHS.map((l) => (
                <button key={l.id} type="button" aria-pressed={length === l.id} onClick={() => setLength(l.id)} className={chip(length === l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Skull className="size-8 text-foreground/30" aria-hidden="true" />
            <p className="text-foreground/60">Bu filtrelerle eşleşen film yok. Karanlık bile bu kadar boş değil.</p>
            <button
              type="button"
              onClick={() => {
                setKind('all')
                setLength('all')
                setQuery('')
                setFreshOnly(false)
              }}
              className="text-sm text-[var(--hx)] underline-offset-4 hover:underline"
            >
              Filtreleri sıfırla
            </button>
          </div>
        ) : (
          <motion.ul layout className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {visible.map(({ f, i }) => (
                <FilmCard key={f.slug} film={f} index={i} number={i + 1} onPlay={() => play(i)} />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        <p className="max-w-2xl text-pretty text-xs leading-relaxed text-foreground/40">
          Filmler, yapımcılarının ya da resmî dağıtımcılarının YouTube kanallarından gömülü olarak oynatılır; tüm haklar sahiplerine aittir. Sytheris izlenme ya da gelir elde etmez.
        </p>
      </section>

      <AnimatePresence>
        {film && (
          <Theater
            film={film}
            index={open ?? 0}
            total={films.length}
            films={films}
            warned={warned}
            onAccept={acceptWarning}
            onStep={step}
            onJump={(i) => setOpen(i)}
            onClose={close}
          />
        )}
      </AnimatePresence>

      {/* Locked upsell */}
      <AnimatePresence>
        {upsell && (
          <motion.div key="upsell" className="fixed inset-0 z-[120] grid place-items-center bg-scrim/80 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUpsell(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="hx-upsell"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="relative grid w-full max-w-3xl overflow-hidden rounded-[2rem] border border-foreground/10 bg-scrim sm:grid-cols-[1fr_1.1fr]"
            >
              <div className="relative h-56 sm:h-auto">
                <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_70%,color-mix(in_oklch,var(--hx)_45%,transparent),transparent_70%)]" />
                <Mascot mood="secret" pose="full" className="absolute inset-0" />
              </div>
              <div className="flex flex-col gap-5 p-7 sm:p-9">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hx)]">Perde kapalı</p>
                <h3 id="hx-upsell" className="text-balance text-3xl font-semibold leading-tight tracking-tight">
                  Bu salona yalnızca <span className="font-serif font-normal italic text-[var(--hx)]">üyeler</span> girebilir.
                </h3>
                <p className="text-pretty leading-relaxed text-foreground/65">Sytheris+ ile {films.length} kısa korku filminin tamamını aç, ilk seansında “Gece Yarısı Seansı” rozetini kazan.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(loggedIn ? '/abonelik' : '/giris')}
                    className="flex h-12 items-center gap-2 rounded-full bg-[var(--hx)] px-6 font-semibold text-foreground transition hover:brightness-110"
                  >
                    {loggedIn ? 'Sytheris+’ya geç' : 'Giriş yap'}
                  </button>
                  <button type="button" onClick={() => setUpsell(false)} className="flex h-12 items-center rounded-full border border-foreground/15 px-5 text-sm text-foreground/75 transition hover:text-foreground">
                    Belki sonra
                  </button>
                </div>
                {loggedIn && (
                  <Link href="/abonelik" className="text-xs text-foreground/45 underline-offset-4 hover:underline">
                    Kodun mu var? Abonelik sayfasından etkinleştir.
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
