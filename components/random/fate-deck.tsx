'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, useTransition } from 'react'
import { ArrowRight, BookmarkPlus, RotateCcw, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { drawFate } from '@/app/actions/random'
import { setAnimeStatus } from '@/app/actions/library'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, GENRE_LIST, genreTr, pickTitle, stripHtml } from '@/lib/format'
import { DEMOGRAPHICS, ERAS, LENGTHS, MOODS, TROPE_GROUPS, TROPE_LABEL } from '@/lib/tropes'
import { cn } from '@/lib/utils'
import { Mascot } from '@/components/mascot/mascot'

type Drawn = MediaCard & { description?: string | null }
type Phase = 'idle' | 'shuffling' | 'revealed' | 'empty'

function rarity(score?: number | null) {
  if ((score ?? 0) >= 85) return { id: 'SSR', label: 'Efsanevi', ring: 'var(--fx-gold)' }
  if ((score ?? 0) >= 75) return { id: 'SR', label: 'Nadir', ring: 'var(--primary)' }
  return { id: 'R', label: 'Sıradan', ring: 'color-mix(in oklch, var(--foreground) 35%, transparent)' }
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-ink')}
    >
      {children}
    </button>
  )
}

function CardBack() {
  return (
    <div className="sy-card-back absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.6rem] border border-primary/40 text-primary [backface-visibility:hidden]">
      <span className="text-4xl font-bold tracking-tight opacity-90">?</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.5em] opacity-70">Sytheris</span>
      <span className="absolute inset-3 rounded-[1.2rem] border border-primary/25" aria-hidden="true" />
    </div>
  )
}

export function FateDeck({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [card, setCard] = useState<Drawn | null>(null)
  const [history, setHistory] = useState<Drawn[]>([])
  const [mood, setMood] = useState<string | null>(null)
  const [genres, setGenres] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [era, setEra] = useState<string | null>(null)
  const [format, setFormat] = useState<string | null>(null)
  const [length, setLength] = useState<'short' | 'mid' | 'long' | null>(null)
  const [minScore, setMinScore] = useState(60)
  const [group, setGroup] = useState(TROPE_GROUPS[0].id)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [, start] = useTransition()
  const cardRef = useRef<HTMLDivElement>(null)

  const activeMood = MOODS.find((m) => m.id === mood)
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => {
    setMood(null)
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v].slice(-3))
  }
  const filterCount = genres.length + tags.length + (era ? 1 : 0) + (format ? 1 : 0) + (length ? 1 : 0)

  const draw = () => {
    if (phase === 'shuffling') return
    setPhase('shuffling')
    const started = Date.now()
    start(async () => {
      const pool = await drawFate({
        genres: activeMood?.genres ?? genres,
        tags: activeMood?.tags ?? tags,
        era,
        format,
        length,
        minScore,
      }).catch(() => [] as Drawn[])
      const seen = new Set(history.map((h) => h.id))
      const fresh = pool.filter((p) => !seen.has(p.id))
      const choice = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length || pool.length || 1))]
      const wait = Math.max(0, 1500 - (Date.now() - started))
      window.setTimeout(() => {
        if (!choice) {
          setPhase('empty')
          return
        }
        setCard(choice)
        setHistory((h) => [choice, ...h.filter((x) => x.id !== choice.id)].slice(0, 8))
        setPhase('revealed')
      }, wait)
    })
  }

  const addToPlan = () => {
    if (!card) return
    if (!loggedIn) {
      toast('Listene eklemek için giriş yap', { action: { label: 'Giriş yap', onClick: () => router.push('/giris') } })
      return
    }
    start(async () => {
      const res = await setAnimeStatus(card.id, 'planning')
      if (res.ok) toast.success('“İzleyeceğim” listene eklendi')
      else toast.error(res.error)
    })
  }

  const r = rarity(card?.averageScore)
  const syraLine =
    phase === 'shuffling'
      ? 'Kartlar karışıyor… kader fısıldıyor!'
      : phase === 'empty'
        ? 'Bu kombinasyonda kart kalmadı. Filtreleri biraz gevşet!'
        : phase === 'revealed' && card
          ? r.id === 'SSR'
            ? 'Vay! Efsanevi bir kart çektin!'
            : r.id === 'SR'
              ? 'Nadir bir kart! Şanslı günündesin.'
              : 'Gizli bir cevher olabilir, bir şans ver!'
          : (activeMood?.line ?? 'Ruh halini seç, kartını çek. Gerisini kadere bırak.')

  const filters = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="label-mono text-muted-foreground">Türler · en fazla 3</p>
        <div className="flex flex-wrap gap-2">
          {GENRE_LIST.map((g) => (
            <Chip key={g} active={genres.includes(g)} onClick={() => toggle(genres, setGenres, g)}>
              {genreTr(g)}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="label-mono text-muted-foreground">Anime klişeleri</p>
        <div className="flex gap-1 rounded-full bg-muted p-1" role="tablist" aria-label="Klişe grubu">
          {TROPE_GROUPS.map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={group === g.id} onClick={() => setGroup(g.id)} className={cn('flex-1 rounded-full py-1.5 text-xs font-medium transition', group === g.id ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TROPE_GROUPS.find((g) => g.id === group)?.items.map((t) => (
            <Chip key={t.tag} active={tags.includes(t.tag)} onClick={() => toggle(tags, setTags, t.tag)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="label-mono text-muted-foreground">Demografi</p>
        <div className="flex flex-wrap gap-2">
          {DEMOGRAPHICS.map((t) => (
            <Chip key={t.tag} active={tags.includes(t.tag)} onClick={() => toggle(tags, setTags, t.tag)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="label-mono text-muted-foreground">Dönem</p>
          <div className="flex flex-wrap gap-2">
            {ERAS.map((e) => (
              <Chip key={e.id} active={era === e.id} onClick={() => setEra(era === e.id ? null : e.id)}>
                {e.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="label-mono text-muted-foreground">Uzunluk</p>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((l) => (
              <Chip key={l.id} active={length === l.id} onClick={() => setLength(length === l.id ? null : l.id)}>
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="label-mono text-muted-foreground">Format</p>
        <div className="flex flex-wrap gap-2">
          {['TV', 'MOVIE', 'OVA', 'ONA'].map((f) => (
            <Chip key={f} active={format === f} onClick={() => setFormat(format === f ? null : f)}>
              {formatTr(f)}
            </Chip>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-3">
        <span className="flex items-center justify-between">
          <span className="label-mono text-muted-foreground">En düşük puan</span>
          <span className="font-mono text-sm tabular-nums">{minScore}+</span>
        </span>
        <input type="range" min={0} max={85} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="accent-[var(--primary)]" />
      </label>
    </div>
  )

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
      <div className="flex min-w-0 flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="label-mono text-muted-foreground">Ruh hâlin</p>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-4">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mood === m.id}
                onClick={() => setMood(mood === m.id ? null : m.id)}
                className={cn(
                  'w-48 shrink-0 rounded-2xl border p-4 text-left transition sm:w-auto',
                  mood === m.id ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_var(--primary)]' : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/60',
                )}
              >
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className={cn('mt-1 block text-xs leading-relaxed', mood === m.id ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  {[...(m.genres ?? []).map(genreTr), ...(m.tags ?? []).map((t) => TROPE_LABEL[t] ?? t)].join(' · ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden rounded-[1.75rem] border border-border bg-card p-6 lg:block">{filters}</div>

        <div className="lg:hidden">
          <button type="button" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" /> Gelişmiş filtreler
              {filterCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] text-primary-foreground">{filterCount}</span>}
            </span>
            <span className="text-muted-foreground">{filtersOpen ? 'Kapat' : 'Aç'}</span>
          </button>
          <AnimatePresence>
            {filtersOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-3 rounded-2xl border border-border bg-card p-5">{filters}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="order-first flex flex-col items-center gap-6 lg:order-none lg:sticky lg:top-24 lg:self-start">
        <div className="relative grid w-full place-items-center rounded-[2rem] border border-border bg-card px-4 pb-6 pt-5">
          <div className="mb-6 flex w-full items-center gap-3">
            <Mascot pose="bust" className="size-12 shrink-0 ring-2 ring-primary" />
            <AnimatePresence mode="wait">
              <motion.p
                key={syraLine}
                role="status"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl rounded-bl-sm border border-border bg-popover px-4 py-2.5 text-sm leading-relaxed"
              >
                {syraLine}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="relative h-[420px] w-[280px]" style={{ perspective: 1200 }}>
            {phase !== 'revealed' &&
              [0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  initial={false}
                  animate={
                    phase === 'shuffling'
                      ? { x: [0, (i % 2 ? 1 : -1) * (60 + i * 18), 0], rotate: [0, (i % 2 ? 1 : -1) * (8 + i * 3), 0], y: [i * -3, -20, i * -3] }
                      : { x: 0, rotate: (i - 2) * 1.5, y: i * -3 }
                  }
                  transition={phase === 'shuffling' ? { duration: 0.7, repeat: 1, delay: i * 0.06, ease: 'easeInOut' } : { duration: 0.4 }}
                  style={{ zIndex: i }}
                >
                  <CardBack />
                </motion.div>
              ))}

            <AnimatePresence mode="wait">
              {phase === 'revealed' && card && (
                <motion.div
                  key={card.id}
                  ref={cardRef}
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  initial={{ rotateY: 180, scale: 0.9, y: 20 }}
                  animate={{ rotateY: 0, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotate: -6, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  onPointerMove={(e) => {
                    const rect = cardRef.current?.getBoundingClientRect()
                    if (!rect) return
                    cardRef.current?.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`)
                    cardRef.current?.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`)
                  }}
                >
                  <Link
                    href={`/anime/${card.id}`}
                    className="sy-holo absolute inset-0 overflow-hidden rounded-[1.6rem] bg-scrim text-on-scrim shadow-2xl [backface-visibility:hidden]"
                    style={{ boxShadow: `0 0 0 3px ${r.ring}, 0 30px 60px -20px ${r.ring}` }}
                    aria-label={`${pickTitle(card.title)} detayları`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.coverImage.extraLarge || card.coverImage.large || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/10 to-transparent" />
                    <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-scrim" style={{ background: r.ring }}>
                      <Sparkles className="size-3" /> {r.id}
                    </span>
                    {card.averageScore ? (
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-scrim/70 px-2.5 py-1 font-mono text-[11px] backdrop-blur">
                        <Star className="size-3 fill-current" /> {card.averageScore}
                      </span>
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
                      <span className="label-mono text-[9px] opacity-70">{r.label} kart</span>
                      <span className="line-clamp-2 text-xl font-bold leading-tight">{pickTitle(card.title)}</span>
                      <span className="text-xs opacity-70">{[card.seasonYear, formatTr(card.format), card.episodes ? `${card.episodes} bölüm` : null].filter(Boolean).join(' · ')}</span>
                    </span>
                  </Link>
                  <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <CardBack />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === 'empty' && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-[1.6rem] bg-card/90 p-6 text-center backdrop-blur">
                <div className="flex flex-col items-center gap-3">
                  <X className="size-8 text-muted-foreground" />
                  <p className="font-semibold">Kart bulunamadı</p>
                  <p className="text-sm text-muted-foreground">Daha az filtreyle tekrar dene.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={draw}
              disabled={phase === 'shuffling'}
              whileTap={{ scale: 0.96 }}
              className="flex h-13 items-center gap-2.5 rounded-full bg-primary px-8 font-semibold text-primary-foreground shadow-[0_12px_40px_-12px_var(--primary)] transition hover:brightness-110 disabled:opacity-70"
            >
              {phase === 'revealed' ? <RotateCcw className="size-4" /> : <Sparkles className="size-4" />}
              {phase === 'shuffling' ? 'Karıştırılıyor…' : phase === 'revealed' ? 'Yeniden çek' : 'Kartını çek'}
            </motion.button>
            {phase === 'revealed' && card && (
              <button type="button" onClick={addToPlan} className="flex h-13 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary">
                <BookmarkPlus className="size-4" /> İzleyeceğim
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'revealed' && card && (
            <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-full flex-col gap-3 rounded-[1.75rem] border border-border bg-card p-6">
              <div className="flex flex-wrap gap-1.5">
                {card.genres?.slice(0, 4).map((g) => (
                  <span key={g} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {genreTr(g)}
                  </span>
                ))}
              </div>
              <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{stripHtml(card.description) || 'Açıklama bulunmuyor.'}</p>
              <Link href={`/anime/${card.id}`} className="group flex items-center gap-2 self-start text-sm font-medium text-ink">
                Detaylara git <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 1 && (
          <div className="flex w-full flex-col gap-3">
            <p className="label-mono text-muted-foreground">Son çektiklerin</p>
            <ul className="flex gap-2">
              {history.slice(1, 7).map((h) => (
                <li key={h.id} className="w-1/6">
                  <Link href={`/anime/${h.id}`} className="block overflow-hidden rounded-xl ring-1 ring-border transition hover:-translate-y-1 hover:ring-primary" title={pickTitle(h.title)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.coverImage.large || '/placeholder.svg'} alt={pickTitle(h.title)} className="aspect-[2/3] w-full object-cover" loading="lazy" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
