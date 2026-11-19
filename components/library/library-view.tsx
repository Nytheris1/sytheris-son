'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, useTransition } from 'react'
import { ArrowUpRight, LayoutGrid, Loader2, Pencil, Play, Plus, Rows3, Search, Star, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { deleteList, removeFromList } from '@/app/actions/library'
import type { MediaCard } from '@/lib/anilist-types'
import { formatTr, pickTitle } from '@/lib/format'
import type { LibraryList } from '@/lib/library-types'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui-kit/modal'
import { Mascot } from '@/components/mascot/mascot'
import { LibraryHero } from './library-hero'
import { ListForm } from './list-form'

type Stats = { total: number; watching: number; planning: number; completed: number; custom: number } | null
type Props = {
  guest: boolean
  banners: MediaCard[]
  lists: LibraryList[]
  media: Record<string, MediaCard>
  stats: Stats
  limit: number
  openCreate: boolean
  initialList: string | null
}

type Sort = 'recent' | 'score' | 'az'
type View = 'grid' | 'rows'
const EASE = [0.16, 1, 0.3, 1] as const
const hueColor = (h: number) => `oklch(0.72 0.16 ${h})`

function Spine({ list, media, active, onSelect }: { list: LibraryList; media: Record<string, MediaCard>; active: boolean; onSelect: () => void }) {
  const covers = list.items
    .slice(-3)
    .reverse()
    .map((i) => media[i.id]?.coverImage.large)
    .filter(Boolean) as string[]
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        'lib-spine group relative flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition duration-300 lg:w-full',
        active ? 'border-foreground/15 bg-card shadow-sm' : 'border-transparent hover:bg-muted/60',
      )}
      style={{ '--lh': hueColor(list.hue) } as React.CSSProperties}
    >
      <span aria-hidden="true" className={cn('h-9 w-1 shrink-0 rounded-full transition-all duration-300', active ? 'bg-[var(--lh)]' : 'bg-[var(--lh)]/40 group-hover:bg-[var(--lh)]/70')} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{list.name}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{list.items.length} anime</span>
      </span>
      {covers.length > 0 && (
        <span aria-hidden="true" className="relative hidden h-10 w-14 shrink-0 lg:block">
          {covers.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="absolute top-0 h-10 w-7 rounded-[3px] object-cover shadow ring-1 ring-background transition-transform duration-500 group-hover:-translate-y-0.5"
              style={{ right: i * 12, zIndex: 3 - i, transform: `rotate(${(i - 1) * 5}deg)` }}
            />
          ))}
        </span>
      )}
    </button>
  )
}

export function LibraryView({ guest, banners, lists, media, stats, limit, openCreate, initialList }: Props) {
  const [active, setActive] = useState(initialList && lists.some((l) => l.id === initialList) ? initialList : (lists.find((l) => l.items.length)?.id ?? lists[0]?.id ?? 'watching'))
  const [creating, setCreating] = useState(openCreate)
  const [editing, setEditing] = useState<LibraryList | null>(null)
  const [sort, setSort] = useState<Sort>('recent')
  const [view, setView] = useState<View>('grid')
  const [query, setQuery] = useState('')
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [pending, start] = useTransition()
  const router = useRouter()

  const list = lists.find((l) => l.id === active)
  const items = useMemo(() => {
    if (!list) return []
    const q = query.trim().toLocaleLowerCase('tr')
    const arr = list.items
      .filter((i) => !removed.has(`${list.id}:${i.id}`))
      .map((i) => ({ ...i, media: media[i.id] }))
      .filter((i) => i.media && (!q || pickTitle(i.media.title).toLocaleLowerCase('tr').includes(q)))
    if (sort === 'score') arr.sort((a, b) => (b.media.averageScore ?? 0) - (a.media.averageScore ?? 0))
    else if (sort === 'az') arr.sort((a, b) => pickTitle(a.media.title).localeCompare(pickTitle(b.media.title), 'tr'))
    else arr.sort((a, b) => b.addedAt - a.addedAt)
    return arr
  }, [list, media, sort, removed, query])

  const continueItem = useMemo(() => {
    const watching = lists.find((l) => l.system === 'watching')
    const last = watching?.items.slice().sort((a, b) => b.addedAt - a.addedAt)[0]
    return last ? media[last.id] : undefined
  }, [lists, media])

  const customCount = lists.filter((l) => !l.system).length
  const systemLists = lists.filter((l) => l.system)
  const customLists = lists.filter((l) => !l.system)

  const remove = (listId: string, mediaId: number) => {
    const key = `${listId}:${mediaId}`
    setRemoved((s) => new Set(s).add(key))
    start(async () => {
      const res = await removeFromList(listId, mediaId)
      if (!res.ok) {
        toast.error(res.error)
        setRemoved((s) => {
          const n = new Set(s)
          n.delete(key)
          return n
        })
      }
    })
  }

  if (guest) {
    return (
      <div className="flex flex-col gap-16 pb-10">
        <LibraryHero banners={banners} />
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[auto_1fr]">
          <Mascot pose="portrait" className="mx-auto aspect-square w-44 md:w-56" float />
          <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
            <p className="label-mono text-ink">Kişisel arşiv</p>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Koleksiyonun seni <span className="accent-serif">bekliyor</span>
            </h1>
            <p className="max-w-lg text-pretty leading-relaxed text-muted-foreground">
              İzlediklerini, izleyeceklerini ve bitirdiklerini tek rafta topla; “Kış maratonu” gibi kendi koleksiyonlarını oluştur, profilinde sergile.
            </p>
            <Link href="/giris" className="flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-semibold text-background transition hover:opacity-90">
              Giriş yap ve başla <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12 pb-10">
      <LibraryHero banners={banners}>
        {stats && (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
              {(
                [
                  ['anime', stats.total],
                  ['izleniyor', stats.watching],
                  ['tamamlandı', stats.completed],
                  ['koleksiyon', stats.custom],
                ] as const
              ).map(([k, v], i) => (
                <div key={k} className="flex items-baseline gap-2">
                  <dd className={cn('font-bold tabular-nums tracking-[-0.04em]', i === 0 ? 'text-5xl sm:text-6xl' : 'text-3xl')}>{v}</dd>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">{k}</dt>
                </div>
              ))}
            </dl>
            {continueItem && (
              <Link
                href={`/anime/${continueItem.id}`}
                className="group flex max-w-sm items-center gap-3 rounded-2xl border border-foreground/12 bg-scrim/50 p-2 pr-4 backdrop-blur-xl transition hover:border-foreground/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={continueItem.coverImage.large || '/placeholder.svg'} alt="" className="h-16 w-11 rounded-lg object-cover" />
                <span className="flex min-w-0 flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Kaldığın yerden</span>
                  <span className="truncate text-sm font-semibold">{pickTitle(continueItem.title)}</span>
                </span>
                <span className="ml-auto grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-110">
                  <Play className="size-3.5 fill-current" aria-hidden="true" />
                </span>
              </Link>
            )}
          </div>
        )}
      </LibraryHero>

      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div role="tablist" aria-label="Listeler" aria-orientation="vertical" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            <p className="hidden px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground lg:block">Durum</p>
            {systemLists.map((l) => (
              <Spine key={l.id} list={l} media={media} active={l.id === active} onSelect={() => setActive(l.id)} />
            ))}
            <p className="hidden px-3 pb-1 pt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground lg:block">
              Koleksiyonlar · {customCount}/{limit}
            </p>
            {customLists.map((l) => (
              <Spine key={l.id} list={l} media={media} active={l.id === active} onSelect={() => setActive(l.id)} />
            ))}
            <button
              type="button"
              onClick={() => (customCount >= limit ? toast(`Liste sınırına ulaştın (${limit}).`, { action: { label: 'Yükselt', onClick: () => router.push('/abonelik') } }) : setCreating(true))}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:border-primary hover:text-ink lg:mt-1"
            >
              <Plus className="size-4" aria-hidden="true" /> Yeni koleksiyon
            </button>
          </div>
        </aside>

        {list && (
          <section className="flex min-w-0 flex-col gap-6" aria-labelledby="lib-title">
            <div className="flex flex-col gap-5 border-b border-border pb-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: hueColor(list.hue) }} aria-hidden="true" />
                    {list.system ? 'Durum listesi' : list.isPublic ? 'Herkese açık koleksiyon' : 'Özel koleksiyon'}
                  </p>
                  <h1 id="lib-title" className="text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                    {list.name}
                  </h1>
                  {list.description && <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">{list.description}</p>}
                </div>
                {!list.system && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setEditing(list)} aria-label="Listeyi düzenle" className="grid size-10 place-items-center rounded-full border border-border transition hover:border-primary">
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Listeyi sil"
                      onClick={() => {
                        if (!confirm(`“${list.name}” silinsin mi?`)) return
                        start(async () => {
                          const res = await deleteList(list.id)
                          if (!res.ok) toast.error(res.error)
                          else {
                            toast.success('Liste silindi')
                            setActive('watching')
                            router.refresh()
                          }
                        })
                      }}
                      className="grid size-10 place-items-center rounded-full border border-border text-destructive transition hover:bg-destructive/10"
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 transition focus-within:border-primary sm:max-w-xs">
                  <Search className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Listede ara</span>
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Listede ara" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" />
                </label>
                <div className="flex gap-0.5 rounded-full bg-muted p-1" role="radiogroup" aria-label="Sırala">
                  {(
                    [
                      ['recent', 'Son eklenen'],
                      ['score', 'Puan'],
                      ['az', 'A–Z'],
                    ] as const
                  ).map(([v, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={sort === v} onClick={() => setSort(v)} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', sort === v ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex gap-0.5 rounded-full bg-muted p-1" role="radiogroup" aria-label="Görünüm">
                  {(
                    [
                      ['grid', LayoutGrid, 'Kapak ızgarası'],
                      ['rows', Rows3, 'Liste'],
                    ] as const
                  ).map(([v, Icon, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={view === v} aria-label={l} onClick={() => setView(v)} className={cn('grid size-8 place-items-center rounded-full transition', view === v ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                      <Icon className="size-4" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border py-16 text-center">
                <Mascot pose="bust" className="size-20" />
                <p className="text-lg font-semibold">{query ? 'Eşleşen anime yok' : 'Bu raf henüz boş'}</p>
                <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
                  {query ? 'Başka bir isim dene.' : 'Bir anime sayfasında “Listeye ekle” butonunu kullan ya da Rastgele Öneri ile şansını dene.'}
                </p>
                {!query && (
                  <div className="flex gap-2">
                    <Link href="/ara" className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background">
                      Keşfet
                    </Link>
                    <Link href="/rastgele" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium">
                      Rastgele öneri
                    </Link>
                  </div>
                )}
              </div>
            ) : view === 'grid' ? (
              <motion.ul layout className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                <AnimatePresence>
                  {items.map((it, i) => (
                    <motion.li
                      key={it.id}
                      layout
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.035, 0.35), duration: 0.6, ease: EASE } }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      className="group relative"
                    >
                      <Link href={`/anime/${it.id}`} className="flex flex-col gap-3 outline-none">
                        <span className="lib-cover relative block aspect-[2/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border transition duration-500 group-hover:-translate-y-1.5 group-focus-visible:ring-2 group-focus-visible:ring-primary" style={{ '--lh': hueColor(list.hue) } as React.CSSProperties}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={it.media.coverImage.extraLarge || it.media.coverImage.large || '/placeholder.svg'} alt={pickTitle(it.media.title)} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
                          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-scrim/80 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                          {it.media.averageScore ? (
                            <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-scrim/70 px-2 py-1 font-mono text-[11px] text-on-scrim backdrop-blur">
                              <Star className="size-3 fill-primary text-primary" aria-hidden="true" /> {it.media.averageScore}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex flex-col gap-1 px-0.5">
                          <span className="line-clamp-2 text-[15px] font-medium leading-snug transition group-hover:text-ink">{pickTitle(it.media.title)}</span>
                          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{[it.media.seasonYear, formatTr(it.media.format)].filter(Boolean).join(' · ')}</span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        aria-label={`${pickTitle(it.media.title)} listeden çıkar`}
                        onClick={() => remove(list.id, it.id)}
                        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-scrim/70 text-on-scrim opacity-0 backdrop-blur transition hover:bg-destructive group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            ) : (
              <motion.ol layout className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
                <AnimatePresence>
                  {items.map((it, i) => (
                    <motion.li
                      key={it.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i * 0.025, 0.3), duration: 0.5, ease: EASE } }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group relative isolate overflow-hidden"
                    >
                      {it.media.bannerImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.media.bannerImage} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover opacity-0 transition duration-700 group-hover:opacity-15" />
                      )}
                      <Link href={`/anime/${it.id}`} className="flex items-center gap-4 px-4 py-3 pr-14 outline-none focus-visible:bg-muted/60">
                        <span className="w-6 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.media.coverImage.large || '/placeholder.svg'} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded-md object-cover ring-1 ring-border" />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate font-medium transition group-hover:text-ink">{pickTitle(it.media.title)}</span>
                          <span className="truncate text-xs text-muted-foreground">{[it.media.seasonYear, formatTr(it.media.format), it.media.episodes && `${it.media.episodes} bölüm`, it.media.genres?.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}</span>
                        </span>
                        {it.media.averageScore ? (
                          <span className="hidden items-center gap-1 font-mono text-sm tabular-nums sm:flex">
                            <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" /> {it.media.averageScore}
                          </span>
                        ) : null}
                        <time className="hidden w-24 shrink-0 text-right font-mono text-[11px] text-muted-foreground md:block" dateTime={new Date(it.addedAt).toISOString()}>
                          {new Date(it.addedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                        </time>
                      </Link>
                      <button
                        type="button"
                        aria-label={`${pickTitle(it.media.title)} listeden çıkar`}
                        onClick={() => remove(list.id, it.id)}
                        className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground opacity-0 transition hover:bg-destructive hover:text-on-scrim group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ol>
            )}
          </section>
        )}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="Yeni liste" hideTitle className="sm:max-w-md">
        <ListForm onDone={() => setCreating(false)} />
      </Modal>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Listeyi düzenle" hideTitle className="sm:max-w-md">
        {editing && <ListForm initial={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
