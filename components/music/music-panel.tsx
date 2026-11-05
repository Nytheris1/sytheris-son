'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Loader2, Music2, Pause, Play, Plus, Repeat, Search, Shuffle, SkipBack, SkipForward, Trash2, Volume1, Volume2, VolumeX, Check } from 'lucide-react'
import { Modal } from '@/components/ui-kit/modal'
import { useDebounced } from '@/components/shell/command-palette'
import { cn } from '@/lib/utils'
import { useMusic, type Track } from './music-provider'
import { Equalizer } from './music-button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const SUGGESTIONS = ['Unravel', 'Gurenge', 'Blue Bird', 'Idol', 'Kick Back', 'Again', 'Silhouette', 'Shinzou wo Sasageyo']

export function fmtTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function useMusicSearch(q: string, source: 'anime' | 'song') {
  const dq = useDebounced(q.trim(), 300)
  const { data, isLoading } = useSWR<{ results: Track[] }>(dq.length > 1 ? `/api/music/search?q=${encodeURIComponent(dq)}&source=${source}` : null, fetcher, {
    keepPreviousData: true,
  })
  return { results: dq.length > 1 ? (data?.results ?? []) : [], isLoading: isLoading && dq.length > 1 }
}

export function MusicSearch({ onPick, pickLabel = 'Ekle', pickedIds = [] }: { onPick: (t: Track) => void; pickLabel?: string; pickedIds?: string[] }) {
  const [q, setQ] = useState('')
  const [source, setSource] = useState<'anime' | 'song'>('anime')
  const { results, isLoading } = useMusicSearch(q, source)
  const preview = useMusic()
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Şarkı veya anime adı yaz…"
          aria-label="Müzik ara"
          className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-sm outline-none transition focus:border-primary"
        />
        {isLoading && <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist" aria-label="Kaynak">
        {(
          [
            ['anime', 'Anime OP / ED'],
            ['song', 'Tüm şarkılar'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={source === id}
            onClick={() => setSource(id)}
            className={cn('rounded-xl py-2 text-xs font-medium transition', source === id ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            {label}
          </button>
        ))}
      </div>
      {q.trim().length < 2 ? (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-primary hover:text-ink">
              {s}
            </button>
          ))}
        </div>
      ) : results.length === 0 && !isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı. Diğer kaynağı dene.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {results.map((t) => {
            const picked = pickedIds.includes(t.id)
            const isCurrent = preview.current?.id === t.id && preview.playing
            return (
              <li key={t.id} className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted">
                <button
                  type="button"
                  onClick={() => (isCurrent ? preview.pause() : preview.play(t))}
                  className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted"
                  aria-label={isCurrent ? `${t.title} duraklat` : `${t.title} dinle`}
                >
                  {t.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.cover || '/placeholder.svg'} alt="" className="size-full object-cover" />
                  ) : (
                    <Music2 className="m-auto size-5 text-muted-foreground" />
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-scrim/50 text-on-scrim opacity-0 transition group-hover:opacity-100">
                    {isCurrent ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.artist}
                    {t.anime ? ` · ${t.anime}` : ''}
                  </p>
                </div>
                {t.kind && <span className="hidden rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] uppercase text-ink sm:inline">{t.kind}</span>}
                <button
                  type="button"
                  onClick={() => onPick(t)}
                  disabled={picked}
                  aria-label={`${t.title} ${pickLabel}`}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full border transition',
                    picked ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-ink',
                  )}
                >
                  {picked ? <Check className="size-4" /> : <Plus className="size-4" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function MusicPanel() {
  const m = useMusic()
  const [tab, setTab] = useState<'playlist' | 'search'>('playlist')
  const VolIcon = m.volume === 0 ? VolumeX : m.volume < 0.5 ? Volume1 : Volume2

  return (
    <Modal open={m.panelOpen} onClose={() => m.setPanelOpen(false)} title="Müzik" side="right" className="sm:max-w-md">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-8 pt-4">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-4">
          {m.current?.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.current.cover || '/placeholder.svg'} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-25 blur-2xl" />
          )}
          <div className="relative flex items-center gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-lg">
              {m.current?.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.current.cover || '/placeholder.svg'} alt="" className={cn('size-full object-cover transition-transform duration-[2s]', m.playing && 'scale-110')} />
              ) : (
                <Music2 className="absolute inset-0 m-auto size-7 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="label-mono flex items-center gap-2 text-[9px] text-ink">
                <Equalizer playing={m.playing} className="h-2.5" /> {m.playing ? 'Şimdi çalıyor' : 'Duraklatıldı'}
              </p>
              <p className="mt-1 truncate font-semibold">{m.current?.title ?? 'Parça seçilmedi'}</p>
              <p className="truncate text-sm text-muted-foreground">{m.current ? `${m.current.artist}${m.current.anime ? ` · ${m.current.anime}` : ''}` : 'Aşağıdan arayıp ekle'}</p>
            </div>
          </div>
          <div className="relative mt-4">
            <input
              type="range"
              min={0}
              max={m.duration || 0}
              step={0.1}
              value={m.progress}
              onChange={(e) => m.seek(Number(e.target.value))}
              aria-label="İlerleme"
              className="w-full accent-[var(--primary)]"
              disabled={!m.current}
            />
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>{fmtTime(m.progress)}</span>
              <span>{fmtTime(m.duration)}</span>
            </div>
          </div>
          <div className="relative mt-2 flex items-center justify-between">
            <button type="button" onClick={() => m.setShuffle(!m.shuffle)} aria-pressed={m.shuffle} aria-label="Karışık" className={cn('grid size-10 place-items-center rounded-full transition', m.shuffle ? 'text-ink' : 'text-muted-foreground hover:text-foreground')}>
              <Shuffle className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={m.prev} aria-label="Önceki" className="grid size-10 place-items-center rounded-full transition hover:bg-muted">
                <SkipBack className="size-5" />
              </button>
              <button type="button" onClick={m.toggle} aria-label={m.playing ? 'Duraklat' : 'Oynat'} className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 active:scale-95">
                {m.playing ? <Pause className="size-6" /> : <Play className="ml-0.5 size-6" />}
              </button>
              <button type="button" onClick={m.next} aria-label="Sonraki" className="grid size-10 place-items-center rounded-full transition hover:bg-muted">
                <SkipForward className="size-5" />
              </button>
            </div>
            <button type="button" onClick={() => m.setRepeat(!m.repeat)} aria-pressed={m.repeat} aria-label="Tekrarla" className={cn('grid size-10 place-items-center rounded-full transition', m.repeat ? 'text-ink' : 'text-muted-foreground hover:text-foreground')}>
              <Repeat className="size-4" />
            </button>
          </div>
          <div className="relative mt-3 flex items-center gap-3">
            <button type="button" onClick={() => m.setVolume(m.volume === 0 ? 0.6 : 0)} aria-label="Sesi aç/kapat" className="text-muted-foreground hover:text-foreground">
              <VolIcon className="size-4" />
            </button>
            <input type="range" min={0} max={1} step={0.01} value={m.volume} onChange={(e) => m.setVolume(Number(e.target.value))} aria-label="Ses" className="w-full accent-[var(--primary)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist">
          <button role="tab" type="button" aria-selected={tab === 'playlist'} onClick={() => setTab('playlist')} className={cn('rounded-xl py-2.5 text-sm font-medium transition', tab === 'playlist' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
            Çalma listesi ({m.playlist.length})
          </button>
          <button role="tab" type="button" aria-selected={tab === 'search'} onClick={() => setTab('search')} className={cn('rounded-xl py-2.5 text-sm font-medium transition', tab === 'search' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
            Şarkı ekle
          </button>
        </div>

        {tab === 'search' ? (
          <MusicSearch onPick={(t) => m.add(t)} pickedIds={m.playlist.map((t) => t.id)} />
        ) : m.playlist.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-8 text-center">
            <Music2 className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Listen boş. Şarkı adını yazarak bul, seç ve ekle.</p>
            <button type="button" onClick={() => setTab('search')} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Şarkı ara
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {m.playlist.map((t, i) => {
              const active = m.current?.id === t.id
              return (
                <li key={t.id} className={cn('group flex items-center gap-3 rounded-2xl p-2 transition', active ? 'bg-accent' : 'hover:bg-muted')}>
                  <button type="button" onClick={() => (active ? m.toggle() : m.play(t))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="w-5 text-center font-mono text-xs text-muted-foreground">{active && m.playing ? <Equalizer playing className="mx-auto h-3 text-ink" /> : i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.cover || '/placeholder.svg'} alt="" className="size-10 rounded-lg object-cover" />
                    <span className="min-w-0">
                      <span className={cn('block truncate text-sm font-medium', active && 'text-ink')}>{t.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t.artist}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => m.remove(t.id)} aria-label={`${t.title} kaldır`} className="grid size-8 place-items-center rounded-full text-muted-foreground opacity-100 transition hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Kaynaklar: AnimeThemes · Apple Music önizleme</p>
      </div>
    </Modal>
  )
}
