'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { ArrowRight, Dices, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RouletteItem = {
  id: string
  kind: 'film' | 'dizi'
  title: string
  poster: string
  posterLg: string
  genre: string
  year: number | null
  summary: string
  rating: number | null
  meta: string | null
}

type KindFilter = 'hepsi' | 'film' | 'dizi'
const OUT = [0.16, 1, 0.3, 1] as const

/** Cinema-mode randomiser: a ticket-reel of posters spins and lands on tonight's pick. */
export function CineRoulette({ pool, genres }: { pool: RouletteItem[]; genres: string[] }) {
  const [kind, setKind] = useState<KindFilter>('hepsi')
  const [genre, setGenre] = useState<string | null>(null)
  const [reel, setReel] = useState<RouletteItem[]>([])
  const [pick, setPick] = useState<RouletteItem | null>(null)
  const [spinning, setSpinning] = useState(false)
  const timer = useRef<number | null>(null)

  const candidates = pool.filter((p) => (kind === 'hepsi' || p.kind === kind) && (!genre || p.genre === genre))

  function spin() {
    if (!candidates.length || spinning) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const chosen = candidates[Math.floor(Math.random() * candidates.length)]
    if (reduce) {
      setPick(chosen)
      return
    }
    const filler = Array.from({ length: 14 }, () => candidates[Math.floor(Math.random() * candidates.length)])
    setReel([...filler, chosen])
    setPick(null)
    setSpinning(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setSpinning(false)
      setPick(chosen)
    }, 2400)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex w-fit rounded-full bg-muted p-1" role="radiogroup" aria-label="Ne izlemek istiyorsun?">
          {(
            [
              { id: 'hepsi', label: 'Hepsi' },
              { id: 'film', label: 'Film' },
              { id: 'dizi', label: 'Dizi' },
            ] as const
          ).map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} className={cn('rounded-full px-5 py-2 text-sm font-medium transition', kind === k.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Tür">
          <button type="button" aria-pressed={!genre} onClick={() => setGenre(null)} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition', !genre ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
            Her tür
          </button>
          {genres.map((g) => (
            <button key={g} type="button" aria-pressed={genre === g} onClick={() => setGenre(g)} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition', genre === g ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="dark relative isolate overflow-hidden rounded-3xl bg-scrim text-foreground ring-1 ring-border">
        <span className="cine-bulbs absolute inset-x-0 top-2 h-3" aria-hidden="true" />
        <span className="cine-bulbs absolute inset-x-0 bottom-2 h-3" aria-hidden="true" />
        {pick && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pick.posterLg || '/placeholder.svg'} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-30 blur-3xl" />
        )}
        <div className="grain absolute inset-0 -z-10" aria-hidden="true" />

        <div className="flex min-h-[26rem] flex-col items-center justify-center gap-8 px-5 py-14 sm:px-10">
          <AnimatePresence mode="wait">
            {spinning ? (
              <motion.div key="reel" className="relative h-56 w-36 overflow-hidden rounded-xl ring-2 ring-primary sm:h-72 sm:w-48" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="flex flex-col" initial={{ y: 0 }} animate={{ y: `-${((reel.length - 1) / reel.length) * 100}%` }} transition={{ duration: 2.3, ease: [0.15, 0.6, 0.1, 1] }}>
                  {reel.map((r, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={`${r.id}-${i}`} src={r.poster || '/placeholder.svg'} alt="" className="h-56 w-36 shrink-0 object-cover sm:h-72 sm:w-48" />
                  ))}
                </motion.div>
              </motion.div>
            ) : pick ? (
              <motion.div key={pick.id} className="grid w-full max-w-3xl items-center gap-8 sm:grid-cols-[auto_minmax(0,1fr)]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: OUT }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pick.posterLg || '/placeholder.svg'} alt={`${pick.title} afişi`} className="mx-auto aspect-[2/3] w-40 rounded-xl object-cover shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)] ring-1 ring-foreground/10 sm:w-52" />
                <div className="flex flex-col gap-4 text-center sm:text-left">
                  <p className="label-mono text-primary">Bu gecenin seansı · {pick.kind === 'film' ? 'Film' : 'Dizi'}</p>
                  <h2 className="text-balance text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">{pick.title}</h2>
                  <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70 sm:justify-start">
                    <span>{pick.genre}</span>
                    {pick.year && <span>{pick.year}</span>}
                    {pick.meta && <span>{pick.meta}</span>}
                    {pick.rating ? (
                      <span className="flex items-center gap-1 text-ink">
                        <Star className="size-3.5 fill-current" aria-hidden="true" /> {pick.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </p>
                  {pick.summary && <p className="line-clamp-4 text-pretty leading-relaxed text-foreground/80">{pick.summary}</p>}
                  <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                    <Link href={pick.kind === 'film' ? `/film/${pick.id}` : `/dizi/${pick.id}`} className="group flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                      {pick.kind === 'film' ? 'Filme git' : 'Diziye git'} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                    <button type="button" onClick={spin} className="flex h-12 items-center gap-2 rounded-full border border-foreground/20 px-5 text-sm font-medium transition hover:border-foreground/60">
                      <Dices className="size-4" aria-hidden="true" /> Tekrar çevir
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" className="flex flex-col items-center gap-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex -space-x-6" aria-hidden="true">
                  {candidates.slice(0, 5).map((c, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={c.id} src={c.poster || '/placeholder.svg'} alt="" className={cn('h-36 w-24 rounded-lg object-cover shadow-xl ring-2 ring-scrim sm:h-44 sm:w-28', (i === 0 || i === 4) && 'hidden sm:block')} style={{ rotate: `${(i - 2) * 6}deg`, translate: `0 ${Math.abs(i - 2) * 8}px` }} />
                  ))}
                </div>
                <p className="max-w-sm text-pretty leading-relaxed text-foreground/70">
                  {candidates.length ? `${candidates.length} adayın arasından bu gecenin seansını makara seçsin.` : 'Bu filtreyle aday bulunamadı. Başka bir tür seç.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!pick && (
            <button type="button" onClick={spin} disabled={spinning || !candidates.length} className="flex h-14 items-center gap-2.5 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_12px_40px_-10px_var(--primary)] transition hover:brightness-110 disabled:opacity-60">
              <Dices className={cn('size-5', spinning && 'animate-spin')} aria-hidden="true" />
              {spinning ? 'Makara dönüyor…' : 'Seansı çevir'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
