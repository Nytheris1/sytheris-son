'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ListEnd,
  ListMusic,
  ListPlus,
  Loader2,
  Music2,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui-kit/modal'
import { useDebounced } from '@/components/shell/command-palette'
import { cn } from '@/lib/utils'
import { useMusic, type Track } from './music-provider'
import { Equalizer } from './music-button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const SUGGESTIONS = ['Unravel', 'Gurenge', 'Blue Bird', 'Idol', 'Kick Back', 'Again', 'Silhouette', 'Shinzou wo Sasageyo', 'Yuusha', 'Specialz']

type Source = 'anime' | 'song'
const SOURCES: { id: Source; label: string; note: string }[] = [
  { id: 'anime', label: 'Anime OP / ED', note: 'AnimeThemes · tam sürüm' },
  { id: 'song', label: 'Tüm şarkılar', note: 'YouTube · tam sürüm' },
]

export function fmtTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function useMusicSearch(q: string, source: Source, strict = false) {
  const dq = useDebounced(q.trim(), 300)
  const { data, isLoading } = useSWR<{ results: Track[] }>(dq.length > 1 ? `/api/music/search?q=${encodeURIComponent(dq)}&source=${source}${strict ? '&strict=1' : ''}` : null, fetcher, {
    keepPreviousData: true,
  })
  return { results: dq.length > 1 ? (data?.results ?? []) : [], isLoading: isLoading && dq.length > 1 }
}

export function MusicSearch({
  onPick,
  onQueueNext,
  pickLabel = 'Ekle',
  pickedIds = [],
  sources = ['anime', 'song'],
}: {
  onPick: (t: Track) => void
  onQueueNext?: (t: Track) => void
  pickLabel?: string
  pickedIds?: string[]
  sources?: Source[]
}) {
  const [q, setQ] = useState('')
  const [source, setSource] = useState<Source>(sources[0])
  const { results, isLoading } = useMusicSearch(q, source, sources.length === 1 && sources[0] === 'anime')
  const player = useMusic()
  const available = SOURCES.filter((s) => sources.includes(s.id))

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Şarkı, sanatçı veya anime adı…"
          aria-label="Müzik ara"
          className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-sm outline-none transition focus:border-primary"
        />
        {isLoading && <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />}
      </div>
      {available.length > 1 && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist" aria-label="Kaynak">
          {available.map((s) => (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={source === s.id}
              onClick={() => setSource(s.id)}
              className={cn('flex flex-col items-center rounded-xl py-2 transition', source === s.id ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <span className="text-xs font-semibold">{s.label}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">{s.note}</span>
            </button>
          ))}
        </div>
      )}
      {q.trim().length < 2 ? (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-primary hover:text-ink">
              {s}
            </button>
          ))}
        </div>
      ) : results.length === 0 && !isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı. {available.length > 1 ? 'Diğer kaynağı dene.' : 'Farklı bir ad dene.'}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {results.map((t) => {
            const picked = pickedIds.includes(t.id)
            const isCurrent = player.current?.id === t.id && player.playing
            return (
              <li key={t.id} className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted">
                <button
                  type="button"
                  onClick={() => (isCurrent ? player.pause() : player.play(t))}
                  className={cn('relative shrink-0 overflow-hidden rounded-xl bg-muted', t.source === 'youtube' ? 'aspect-video h-12' : 'size-12')}
                  aria-label={isCurrent ? `${t.title} duraklat` : `${t.title} şimdi çal`}
                >
                  {t.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.cover || '/placeholder.svg'} alt="" className="size-full object-cover" />
                  ) : (
                    <Music2 className="m-auto size-5 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className={cn('absolute inset-0 grid place-items-center bg-scrim/55 text-on-scrim transition', isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                    {isCurrent ? <Equalizer playing className="h-3.5" /> : <Play className="size-4 fill-current" aria-hidden="true" />}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.artist}
                    {t.anime ? ` · ${t.anime}` : ''}
                  </p>
                </div>
                {t.kind && <span className="hidden rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] uppercase text-ink sm:inline">{t.kind}</span>}
                {onQueueNext && (
                  <button
                    type="button"
                    onClick={() => onQueueNext(t)}
                    aria-label={`${t.title} sıradaki olarak çal`}
                    title="Sıradaki olarak çal"
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-ink"
                  >
                    <ListPlus className="size-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onPick(t)}
                  disabled={picked}
                  aria-label={picked ? `${t.title} listede` : `${t.title} ${pickLabel}`}
                  title={picked ? 'Listede' : 'Sona ekle'}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full border transition',
                    picked ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-ink',
                  )}
                >
                  {picked ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ArtStack({ cover, playing }: { cover?: string | null; playing: boolean }) {
  return (
    <div className="relative mx-auto h-56 w-full max-w-[19rem]">
      <motion.div
        aria-hidden="true"
        className="absolute left-[18%] top-1/2 aspect-square h-[88%] -translate-y-1/2 rounded-full bg-scrim shadow-[0_24px_60px_-18px_rgb(0_0_0/0.7)]"
        style={{ backgroundImage: 'repeating-radial-gradient(circle at center, oklch(1 0 0 / 0.07) 0 1px, transparent 1px 4px)' }}
        animate={{ x: playing ? '42%' : '8%', rotate: playing ? 360 : 0 }}
        transition={{
          x: { type: 'spring', stiffness: 90, damping: 16 },
          rotate: playing ? { duration: 5, repeat: Infinity, ease: 'linear' } : { duration: 0.6 },
        }}
      >
        <span className="absolute inset-[32%] overflow-hidden rounded-full ring-4 ring-scrim">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover || '/placeholder.svg'} alt="" className="size-full object-cover" />
          ) : (
            <span className="block size-full bg-primary" />
          )}
        </span>
        <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-scrim/80" />
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,transparent_0deg,oklch(1_0_0/0.14)_30deg,transparent_70deg,transparent_180deg,oklch(1_0_0/0.08)_210deg,transparent_250deg)]" />
      </motion.div>
      <motion.div
        className="absolute left-0 top-1/2 aspect-square h-full -translate-y-1/2 overflow-hidden rounded-2xl bg-muted shadow-[0_30px_60px_-20px_rgb(0_0_0/0.65)] ring-1 ring-foreground/10"
        animate={{ scale: playing ? 1 : 0.96 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover || '/placeholder.svg'} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-primary text-primary-foreground">
            <Music2 className="size-10" aria-hidden="true" />
          </span>
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-on-scrim/15" />
      </motion.div>
    </div>
  )
}

function Scrubber({ value, max, onChange, disabled, label, showTip }: { value: number; max: number; onChange: (v: number) => void; disabled?: boolean; label: string; showTip?: boolean }) {
  const [hover, setHover] = useState<number | null>(null)
  const pct = max ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className="group relative flex h-5 items-center"
      onPointerMove={(e) => {
        if (!showTip || !max) return
        const r = e.currentTarget.getBoundingClientRect()
        setHover(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)))
      }}
      onPointerLeave={() => setHover(null)}
    >
      <div className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-foreground/10 transition-[height] group-hover:h-1.5">
        {hover !== null && <div className="absolute inset-y-0 left-0 bg-foreground/15" style={{ width: `${hover * 100}%` }} />}
        <div className="relative h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="pointer-events-none absolute size-3.5 -translate-x-1/2 rounded-full bg-primary opacity-0 shadow ring-4 ring-primary/25 transition group-hover:opacity-100" style={{ left: `${pct}%` }} />
      {hover !== null && showTip && (
        <span className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-background" style={{ left: `${hover * 100}%` }}>
          {fmtTime(hover * max)}
        </span>
      )}
      <input
        type="range"
        min={0}
        max={max || 0}
        step={0.1}
        value={Math.min(value, max || 0)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={showTip ? `${fmtTime(value)} / ${fmtTime(max)}` : `${Math.round(pct)}%`}
        disabled={disabled}
        className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-default"
      />
    </div>
  )
}

function Visualizer({ playing }: { playing: boolean }) {
  const bars = [0.5, 0.8, 0.35, 0.9, 0.6, 0.4, 0.75, 0.3, 0.85, 0.55, 0.45, 0.7, 0.25, 0.65, 0.5, 0.8, 0.4, 0.6]
  return (
    <div aria-hidden="true" className="flex h-6 items-end justify-center gap-[3px]">
      {bars.map((h, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full bg-primary/70', playing && 'eq-bar')}
          style={{ height: playing ? `${h * 100}%` : '12%', animationDelay: `${(i % 6) * 0.11}s`, animationDuration: `${0.7 + (i % 4) * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function QueueRow({ t, index, total, active }: { t: Track; index: number; total: number; active: boolean }) {
  const m = useMusic()
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className={cn('group flex items-center gap-3 rounded-2xl p-2 transition-colors', active ? 'bg-accent' : 'hover:bg-muted')}
    >
      <button type="button" onClick={() => (active ? m.toggle() : m.play(t))} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={active ? `${t.title} ${m.playing ? 'duraklat' : 'oynat'}` : `${t.title} çal`}>
        <span className="w-5 text-center font-mono text-xs tabular-nums text-muted-foreground">{active && m.playing ? <Equalizer playing className="mx-auto h-3 text-ink" /> : index + 1}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.cover || '/placeholder.svg'} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
        <span className="min-w-0">
          <span className={cn('block truncate text-sm font-medium', active && 'text-ink')}>{t.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {t.artist} · {t.source === 'youtube' ? 'YouTube' : 'AnimeThemes'}
          </span>
        </span>
      </button>
      <div className="flex items-center opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        {!active && (
          <button type="button" onClick={() => m.playNext(t)} aria-label={`${t.title} sıradaki yap`} title="Sıradaki yap" className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground">
            <ListEnd className="size-4" aria-hidden="true" />
          </button>
        )}
        <button type="button" disabled={index === 0} onClick={() => m.move(t.id, -1)} aria-label={`${t.title} yukarı taşı`} className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground disabled:opacity-30">
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
        <button type="button" disabled={index === total - 1} onClick={() => m.move(t.id, 1)} aria-label={`${t.title} aşağı taşı`} className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground disabled:opacity-30">
          <ArrowDown className="size-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => m.remove(t.id)} aria-label={`${t.title} kaldır`} className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </motion.li>
  )
}

export function MusicPanel() {
  const m = useMusic()
  const [tab, setTab] = useState<'queue' | 'search'>('queue')
  const VolIcon = m.volume === 0 ? VolumeX : m.volume < 0.5 ? Volume1 : Volume2
  const currentIndex = m.playlist.findIndex((t) => t.id === m.current?.id)
  const upNext = currentIndex >= 0 ? m.playlist[currentIndex + 1] : m.playlist[0]

  const onKeyDown = (e: React.KeyboardEvent) => {
    const typing = (e.target as HTMLElement).closest('input, textarea')
    if (typing && (e.target as HTMLInputElement).type !== 'range') return
    if (e.key === ' ' && !(e.target as HTMLElement).closest('button')) {
      e.preventDefault()
      m.toggle()
    }
  }

  const add = (t: Track) => {
    m.add(t)
    toast.success('Listeye eklendi', { description: t.title, id: `add-${t.id}` })
  }
  const queueNext = (t: Track) => {
    m.playNext(t)
    toast.success('Sıradaki parça ayarlandı', { description: t.title, id: `next-${t.id}` })
  }

  return (
    <Modal open={m.panelOpen} onClose={() => m.setPanelOpen(false)} title="Müzik" side="right" className="sm:max-w-md">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 pt-4 sm:px-6 [&>*]:shrink-0" onKeyDown={onKeyDown}>
        <section aria-label="Şimdi çalan" className="dark relative isolate overflow-hidden rounded-[1.75rem] bg-scrim px-5 pb-5 pt-6 text-on-scrim ring-1 ring-on-scrim/10">
          <AnimatePresence>
            {m.current?.cover && (
              <motion.img
                key={m.current.cover}
                src={m.current.cover}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 -z-10 size-full scale-150 object-cover blur-3xl saturate-150"
              />
            )}
          </AnimatePresence>
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-scrim/40 to-scrim" />
          <div aria-hidden="true" className="grain absolute inset-0 -z-10" />

          <div className="mb-4 flex items-center justify-between">
            <p className="label-mono flex items-center gap-2 text-[9px] text-primary">
              {m.buffering ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <span className={cn('size-1.5 rounded-full bg-primary', m.playing && 'animate-pulse')} />}
              {m.buffering ? 'Yükleniyor' : m.playing ? 'Şimdi çalıyor' : m.current ? 'Duraklatıldı' : 'Sessizlik'}
            </p>
            {m.current && (
              <span className="rounded-full border border-on-scrim/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-on-scrim/70">
                {m.current.kind ?? (m.current.source === 'youtube' ? 'YouTube' : 'AnimeThemes')}
              </span>
            )}
          </div>

          <ArtStack cover={m.current?.cover} playing={m.playing} />

          <div className="mt-5 flex flex-col gap-1">
            <p className="line-clamp-2 text-balance text-xl font-bold leading-tight tracking-tight">{m.current?.title ?? 'Bir parça seç'}</p>
            <p className="line-clamp-1 text-sm text-on-scrim/65">{m.current ? `${m.current.artist}${m.current.anime ? ` · ${m.current.anime}` : ''}` : 'Keşfet sekmesinden ara, sıraya ekle, tam sürümünü dinle.'}</p>
          </div>

          <div className="mt-4">
            <Visualizer playing={m.playing && !m.buffering} />
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <Scrubber value={m.progress} max={m.duration} onChange={m.seek} disabled={!m.current} label="İlerleme" showTip />
            <div className="flex justify-between font-mono text-[10px] tabular-nums text-on-scrim/55">
              <span>{fmtTime(m.progress)}</span>
              <span>-{fmtTime(Math.max(0, m.duration - m.progress))}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <button type="button" onClick={() => m.setShuffle(!m.shuffle)} aria-pressed={m.shuffle} aria-label="Karışık çal" className={cn('grid size-10 place-items-center rounded-full transition', m.shuffle ? 'bg-primary/20 text-primary' : 'text-on-scrim/60 hover:text-on-scrim')}>
              <Shuffle className="size-4" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={m.prev} aria-label="Önceki" className="grid size-11 place-items-center rounded-full transition hover:bg-on-scrim/10">
                <SkipBack className="size-5 fill-current" aria-hidden="true" />
              </button>
              <motion.button
                type="button"
                onClick={m.toggle}
                aria-label={m.playing ? 'Duraklat' : 'Oynat'}
                whileTap={{ scale: 0.92 }}
                className="grid size-16 place-items-center rounded-full bg-on-scrim text-scrim shadow-[0_12px_40px_-10px_var(--primary)] transition hover:scale-105"
              >
                {m.playing ? <Pause className="size-6 fill-current" aria-hidden="true" /> : <Play className="ml-1 size-6 fill-current" aria-hidden="true" />}
              </motion.button>
              <button type="button" onClick={m.next} aria-label="Sonraki" className="grid size-11 place-items-center rounded-full transition hover:bg-on-scrim/10">
                <SkipForward className="size-5 fill-current" aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={() => m.setRepeat(!m.repeat)} aria-pressed={m.repeat} aria-label="Bu parçayı tekrarla" className={cn('grid size-10 place-items-center rounded-full transition', m.repeat ? 'bg-primary/20 text-primary' : 'text-on-scrim/60 hover:text-on-scrim')}>
              {m.repeat ? <Repeat1 className="size-4" aria-hidden="true" /> : <Repeat className="size-4" aria-hidden="true" />}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={() => m.setVolume(m.volume === 0 ? 0.6 : 0)} aria-label={m.volume === 0 ? 'Sesi aç' : 'Sesi kapat'} className="text-on-scrim/60 hover:text-on-scrim">
              <VolIcon className="size-4" aria-hidden="true" />
            </button>
            <div className="flex-1">
              <Scrubber value={m.volume} max={1} onChange={m.setVolume} label="Ses düzeyi" />
            </div>
            <span className="w-8 text-right font-mono text-[10px] tabular-nums text-on-scrim/55">{Math.round(m.volume * 100)}</span>
          </div>

          {upNext && upNext.id !== m.current?.id && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-on-scrim/[0.06] p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={upNext.cover || '/placeholder.svg'} alt="" className="size-9 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="label-mono block text-[8px] text-on-scrim/50">Sıradaki</span>
                <span className="block truncate text-[13px] font-medium">{upNext.title}</span>
              </span>
              <button type="button" onClick={m.next} aria-label="Sıradakine geç" className="grid size-8 place-items-center rounded-full text-on-scrim/70 transition hover:bg-on-scrim/10 hover:text-on-scrim">
                <SkipForward className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist" aria-label="Müzik bölümleri">
          <button role="tab" type="button" aria-selected={tab === 'queue'} onClick={() => setTab('queue')} className={cn('flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition', tab === 'queue' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
            <ListMusic className="size-4" aria-hidden="true" /> Sıra ({m.playlist.length})
          </button>
          <button role="tab" type="button" aria-selected={tab === 'search'} onClick={() => setTab('search')} className={cn('flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition', tab === 'search' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
            <Search className="size-4" aria-hidden="true" /> Keşfet
          </button>
        </div>

        {tab === 'search' ? (
          <MusicSearch onPick={add} onQueueNext={queueNext} pickedIds={m.playlist.map((t) => t.id)} />
        ) : m.playlist.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-8 text-center">
            <Music2 className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Sıran boş. Bir anime açılışı ya da sevdiğin bir şarkıyı bul; tam sürümü burada çalar.</p>
            <button type="button" onClick={() => setTab('search')} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Şarkı ara
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <p className="label-mono text-[9px] text-muted-foreground">Çalma sırası</p>
              {m.playlist.length > 1 && (
                <button type="button" onClick={m.clear} className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-destructive">
                  Sırayı temizle
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1">
              <AnimatePresence initial={false}>
                {m.playlist.map((t, i) => (
                  <QueueRow key={t.id} t={t} index={i} total={m.playlist.length} active={m.current?.id === t.id} />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AnimeThemes · YouTube — tam sürüm, site içinde · Boşluk: oynat/duraklat</p>
      </div>
    </Modal>
  )
}
