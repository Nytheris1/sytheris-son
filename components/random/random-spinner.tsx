'use client'

import Link from 'next/link'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { useRef, useState } from 'react'
import { ArrowRight, Loader2, Shuffle, Star } from 'lucide-react'
import type { MediaCard } from '@/lib/anilist-types'
import { GENRE_LIST, formatTr, genreTr, pickTitle, splitTitle, stripHtml } from '@/lib/format'
import { cn } from '@/lib/utils'
import { fetchRandomPool } from '@/app/actions/random'

const CARD = 168
const GAP = 16
const STEP = CARD + GAP
const REEL = 48

export function RandomSpinner({ initialPool }: { initialPool: MediaCard[] }) {
  const [pool, setPool] = useState(initialPool)
  const [genre, setGenre] = useState('')
  const [reel, setReel] = useState<MediaCard[]>(() => initialPool.slice(0, 12))
  const [spinning, setSpinning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MediaCard | null>(null)
  const x = useMotionValue(0)
  const viewport = useRef<HTMLDivElement>(null)

  async function changeGenre(g: string) {
    setGenre(g)
    setLoading(true)
    const next = await fetchRandomPool(g || undefined)
    setLoading(false)
    if (next.length) {
      setPool(next)
      setReel(next.slice(0, 12))
      x.set(0)
      setResult(null)
    }
  }

  async function spin() {
    if (spinning || !pool.length) return
    setResult(null)
    setSpinning(true)
    const winner = pool[Math.floor(Math.random() * pool.length)]
    const filler = Array.from({ length: REEL }, () => pool[Math.floor(Math.random() * pool.length)])
    const targetIndex = REEL - 6
    filler[targetIndex] = winner
    setReel(filler)
    x.set(0)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    const width = viewport.current?.clientWidth ?? 800
    const jitter = (Math.random() - 0.5) * CARD * 0.6
    const target = -(targetIndex * STEP) + width / 2 - CARD / 2 + jitter
    await animate(x, target, { duration: 4.6, ease: [0.12, 0.7, 0.08, 1] })
    await animate(x, -(targetIndex * STEP) + width / 2 - CARD / 2, { type: 'spring', stiffness: 260, damping: 22 })
    setSpinning(false)
    setResult(winner)
  }

  const title = result ? pickTitle(result.title) : ''
  const { head, tail } = splitTitle(title)

  return (
    <div className="flex flex-col gap-10">
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {['', ...GENRE_LIST].map((g) => (
          <button
            key={g || 'all'}
            type="button"
            disabled={spinning}
            aria-pressed={genre === g}
            onClick={() => changeGenre(g)}
            className={cn('shrink-0 rounded-full border px-4 py-2 text-sm transition disabled:opacity-50', genre === g ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-ink')}
          >
            {g ? genreTr(g) : 'Tümü'}
          </button>
        ))}
      </div>

      <div className="dark relative isolate overflow-hidden rounded-[2rem] border border-border bg-scrim py-10 text-foreground">
        <div className="grain absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-scrim to-transparent sm:w-48" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-scrim to-transparent sm:w-48" />
        <div className="pointer-events-none absolute left-1/2 top-8 z-20 h-[268px] w-[184px] -translate-x-1/2 rounded-3xl border-2 border-primary shadow-[0_0_60px_-10px_var(--primary),inset_0_0_40px_-20px_var(--primary)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 border-x-[10px] border-t-[14px] border-x-transparent border-t-primary" />
        <div ref={viewport} className="overflow-hidden">
          <motion.ul style={{ x }} className="flex w-max" aria-hidden={spinning}>
            {reel.map((m, i) => (
              <li key={`${m.id}-${i}`} style={{ width: CARD, marginRight: GAP }} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.coverImage.extraLarge || m.coverImage.large || '/placeholder.svg'} alt="" className="aspect-[2/3] w-full rounded-2xl object-cover" draggable={false} />
              </li>
            ))}
          </motion.ul>
        </div>
        <div className="relative z-20 mt-10 flex justify-center">
          <button
            type="button"
            onClick={spin}
            disabled={spinning || loading}
            className="group flex h-14 items-center gap-3 rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-[0_10px_50px_-10px_var(--primary)] transition hover:scale-[1.03] active:scale-[0.98] disabled:opacity-70"
          >
            {spinning || loading ? <Loader2 className="size-5 animate-spin" /> : <Shuffle className="size-5 transition-transform duration-500 group-hover:rotate-180" />}
            {spinning ? 'Çark dönüyor…' : result ? 'Tekrar çevir' : 'Çarkı çevir'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.section
            key={result.id}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="grid items-center gap-8 rounded-[2rem] border border-primary/40 bg-card p-6 sm:p-10 md:grid-cols-[220px_1fr]"
            aria-live="polite"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.coverImage.extraLarge || result.coverImage.large || '/placeholder.svg'} alt={title} className="mx-auto aspect-[2/3] w-44 rounded-3xl object-cover shadow-2xl md:w-full" />
            <div className="flex flex-col gap-4">
              <p className="label-mono text-ink">Kaderin seçimi</p>
              <h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">
                {head} <span className="accent-serif">{tail}</span>
              </h2>
              <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {result.averageScore ? (
                  <span className="flex items-center gap-1 font-semibold text-ink">
                    <Star className="size-4 fill-current" /> {result.averageScore}%
                  </span>
                ) : null}
                {[result.seasonYear, formatTr(result.format), result.episodes ? `${result.episodes} bölüm` : null].filter(Boolean).join(' · ')}
                {result.genres?.slice(0, 3).map((g) => (
                  <span key={g} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {genreTr(g)}
                  </span>
                ))}
              </p>
              <p className="line-clamp-3 max-w-2xl leading-relaxed text-muted-foreground">{stripHtml(result.description)}</p>
              <Link href={`/anime/${result.id}`} className="group mt-2 flex h-12 w-fit items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground">
                Detaylara git <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
