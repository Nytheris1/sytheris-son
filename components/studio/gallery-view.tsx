'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, ChevronLeft, ChevronRight, Download, Heart, Layers, Link2, Lock, Palette, Timer, Trash2, X } from 'lucide-react'
import { likeArtwork, removeArtwork } from '@/app/actions/studio'
import { nameStyleClass, type FrameId, type NameStyle } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { AvatarFrame } from '@/components/membership/avatar-frame'
import { Mascot } from '@/components/mascot/mascot'

export type GalleryArtist = { username: string; displayName: string; avatar: string | null; frame: FrameId; nameStyle: NameStyle }
export type GalleryItem = { id: string; title: string; width: number; height: number; at: number; likes: number; liked: boolean; mine: boolean; uid: string; effort: number; layers: number }
type Viewer = { loggedIn: boolean; premium: boolean; staff: boolean }
type Sort = 'new' | 'top' | 'mine'

const OUT = [0.16, 1, 0.3, 1] as const

function effortLabel(sec: number) {
  if (sec < 60) return 'bir çırpıda'
  const m = Math.round(sec / 60)
  return m < 60 ? `${m} dk emek` : `${Math.floor(m / 60)} sa ${m % 60} dk emek`
}

function dateLabel(ts: number) {
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StudioCta({ viewer, className }: { viewer: Viewer; className?: string }) {
  const href = viewer.premium ? '/atolye/studyo' : viewer.loggedIn ? '/abonelik' : '/giris'
  const label = viewer.premium ? 'Stüdyoyu aç' : viewer.loggedIn ? 'Sytheris+ ile çiz' : 'Giriş yap ve çiz'
  return (
    <Link
      href={href}
      className={cn(
        'group flex h-13 w-fit items-center gap-3 rounded-full bg-primary py-3 pl-6 pr-2 font-semibold text-primary-foreground shadow-[0_18px_50px_-14px_var(--primary)] transition hover:brightness-110',
        className,
      )}
    >
      {!viewer.premium && <Lock className="size-4" aria-hidden="true" />}
      {label}
      <span className="grid size-9 place-items-center rounded-full bg-primary-foreground text-primary transition-transform duration-500 group-hover:-rotate-45">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  )
}

function Placard({ item, artist, label }: { item: GalleryItem; artist: GalleryArtist; label: string }) {
  return (
    <div className="at-placard flex w-full max-w-sm flex-col gap-1 px-5 py-3.5 text-left">
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--at-gold)]">{label}</span>
      <span className="truncate text-lg font-semibold tracking-tight text-on-scrim">{item.title}</span>
      <span className="truncate text-sm text-on-scrim/60">
        <span className={nameStyleClass(artist.nameStyle)}>{artist.displayName}</span>, {new Date(item.at).getFullYear()} · dijital, {item.layers} katman
      </span>
      <span className="flex items-center gap-3 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-on-scrim/45">
        <span className="flex items-center gap-1">
          <Heart className="size-3" aria-hidden="true" /> {item.likes}
        </span>
        <span className="flex items-center gap-1">
          <Timer className="size-3" aria-hidden="true" /> {effortLabel(item.effort)}
        </span>
      </span>
    </div>
  )
}

function LockedSalon({ items, total, viewer }: { items: GalleryItem[]; total: number; viewer: Viewer }) {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-border">
      <ul aria-hidden="true" className="grid grid-cols-2 gap-4 p-4 opacity-80 blur-md saturate-50 sm:grid-cols-4">
        {(items.length ? items : Array.from({ length: 8 }, () => null)).slice(0, 8).map((item, i) => (
          <li key={item?.id ?? i} className="at-frame at-frame-sm">
            <span className="at-mat block">
              <span className="relative block aspect-[4/5] overflow-hidden bg-muted">
                {item && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/art/${item.id}?s=thumb`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                )}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-background/40 via-background/80 to-background px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-[var(--at-gold)]/40 text-[var(--at-gold)]">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <div className="flex max-w-md flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--at-gold)]">Sytheris+ salonu</p>
          <p className="text-balance text-3xl font-semibold tracking-[-0.03em]">
            {total > 1 ? `${total} eser` : 'Sergi'} <span className="accent-serif">perdenin ardında</span>
          </p>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">Galerinin tamamı, beğeniler ve eser ayrıntıları Sytheris+ üyelerine açık. Üye ol, salonu gez ve kendi eserini as.</p>
        </div>
        <StudioCta viewer={viewer} />
      </div>
    </div>
  )
}

export function GalleryView({
  items: initial,
  total,
  artistTotal,
  locked,
  artists,
  featuredId,
  initialOpen,
  viewer,
}: {
  items: GalleryItem[]
  total: number
  artistTotal: number
  locked: boolean
  artists: Record<string, GalleryArtist>
  featuredId: string | null
  initialOpen: string | null
  viewer: Viewer
}) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [sort, setSort] = useState<Sort>('new')
  const [open, setOpen] = useState<string | null>(initialOpen)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => setItems(initial), [initial])

  const visible = useMemo(() => {
    const list = sort === 'mine' ? items.filter((i) => i.mine) : locked ? items.filter((i) => i.id === featuredId || i.mine) : [...items]
    if (sort === 'top') list.sort((a, b) => b.likes - a.likes || b.at - a.at)
    else list.sort((a, b) => b.at - a.at)
    return list
  }, [items, sort, locked, featuredId])

  const featured = items.find((i) => i.id === featuredId) ?? null
  const artistCount = artistTotal
  const mineCount = items.filter((i) => i.mine).length
  const current = open ? items.find((i) => i.id === open) ?? null : null
  const currentIndex = current ? visible.findIndex((i) => i.id === current.id) : -1

  const setOpenUrl = useCallback((id: string | null) => {
    setOpen(id)
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('eser', id)
    else url.searchParams.delete('eser')
    window.history.replaceState(null, '', url.toString())
  }, [])

  const step = useCallback(
    (d: number) => {
      if (currentIndex < 0 || !visible.length) return
      setOpenUrl(visible[(currentIndex + d + visible.length) % visible.length].id)
    },
    [currentIndex, setOpenUrl, visible],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenUrl(null)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpenUrl, step])

  async function toggleLike(item: GalleryItem) {
    if (!viewer.loggedIn) {
      toast('Beğenmek için giriş yap', { action: { label: 'Giriş', onClick: () => router.push('/giris') } })
      return
    }
    const optimistic = { liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) }
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, ...optimistic } : i)))
    const res = await likeArtwork(item.id).catch(() => null)
    if (!res?.ok) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, liked: item.liked, likes: item.likes } : i)))
      toast.error(res && !res.ok ? res.error : 'Beğeni kaydedilemedi.')
      return
    }
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, liked: res.liked, likes: res.count } : i)))
  }

  async function remove(item: GalleryItem) {
    if (!window.confirm(`“${item.title}” galeriden kaldırılsın mı? Bu işlem geri alınamaz.`)) return
    setPending(item.id)
    const res = await removeArtwork(item.id).catch(() => null)
    setPending(null)
    if (!res?.ok) {
      toast.error(res && !res.ok ? res.error : 'Kaldırılamadı.')
      return
    }
    setItems((list) => list.filter((i) => i.id !== item.id))
    setOpenUrl(null)
    toast.success('Eser galeriden kaldırıldı')
    router.refresh()
  }

  async function share(item: GalleryItem) {
    const url = `${window.location.origin}/atolye?eser=${item.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Bağlantı kopyalandı')
    } catch {
      toast(url)
    }
  }

  const tabs: { id: Sort; label: string; count?: number }[] = [
    { id: 'new', label: 'En yeni' },
    { id: 'top', label: 'En beğenilen' },
    ...(viewer.loggedIn ? [{ id: 'mine' as const, label: 'Eserlerim', count: mineCount }] : []),
  ]

  return (
    <div className="pb-10">
      {/* Hero — the exhibition hall */}
      <section className="at-hall dark relative isolate overflow-hidden bg-scrim text-on-scrim">
        <div className="grain pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
        <div aria-hidden="true" className="at-wainscot pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24" />
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-10 lg:pb-28 lg:pt-20">
          <div className="flex flex-col gap-7">
            <motion.p initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: OUT }} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--at-gold)]">
              <span className="h-px w-10 bg-[var(--at-gold)]" />
              Sytheris<span className="-ml-2 text-base leading-none">+</span> Galeri · Salon I
            </motion.p>
            <h1 className="text-balance text-6xl font-bold leading-[0.88] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              {['Duvarlar', 'sizin.'].map((w, i) => (
                <span key={w} className="block overflow-hidden pb-[0.06em]">
                  <motion.span className={cn('block', i === 1 && 'accent-serif')} initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: OUT }}>
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: OUT }} className="max-w-lg text-pretty text-lg leading-relaxed text-on-scrim/65">
              Katmanlı, basınca duyarlı tarayıcı stüdyomuzda çizilen her eser bu salonda asılı. Galeri ve fırça Sytheris+ üyelerine ayrıldı — haftanın eseri ise herkese açık.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5, ease: OUT }} className="flex flex-wrap items-center gap-5">
              <StudioCta viewer={viewer} />
              <dl className={cn('flex gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-on-scrim/50', total === 0 && 'hidden')}>
                <div className="flex flex-col gap-1">
                  <dt>Eser</dt>
                  <dd className="text-2xl font-semibold tabular-nums tracking-tight text-on-scrim">{total}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt>Sanatçı</dt>
                  <dd className="text-2xl font-semibold tabular-nums tracking-tight text-on-scrim">{artistCount}</dd>
                </div>
              </dl>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.25, ease: OUT }} className="relative flex flex-col items-center gap-7">
            <div aria-hidden="true" className="at-spot pointer-events-none absolute -top-24 left-1/2 -z-10 h-[130%] w-[120%] -translate-x-1/2" />
            {featured && artists[featured.uid] ? (
              <>
                <button type="button" onClick={() => setOpenUrl(featured.id)} className="at-frame group relative w-full max-w-md transition duration-700 hover:-translate-y-1" aria-label={`Haftanın eseri: ${featured.title}`}>
                  <span className="at-mat block">
                    <span className="relative block overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ aspectRatio: `${featured.width} / ${featured.height}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/art/${featured.id}`} alt={featured.title} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.02]" />
                    </span>
                  </span>
                </button>
                <Placard item={featured} artist={artists[featured.uid]} label="Haftanın eseri" />
              </>
            ) : (
              <div className="at-frame relative w-full max-w-md">
                <div className="at-mat relative grid aspect-[4/5] place-items-end overflow-hidden !p-0">
                  <Mascot mood="think" pose="full" className="absolute inset-x-0 bottom-0 top-[8%]" />
                  <p className="relative m-4 rounded-full bg-scrim/85 px-4 py-2 text-center text-sm text-on-scrim backdrop-blur">Duvar boş. İlk eseri sen as.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Exhibition */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pt-14 sm:px-6 lg:px-10" aria-labelledby="sergi">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="sergi" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sergi <span className="accent-serif">salonu</span>
          </h2>
          <div role="tablist" aria-label="Sıralama" className="flex gap-1 rounded-full border border-border bg-card p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={sort === t.id}
                onClick={() => setSort(t.id)}
                className={cn('relative h-9 rounded-full px-4 text-sm font-medium transition', sort === t.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {sort === t.id && <motion.span layoutId="atelier-tab" className="absolute inset-0 -z-0 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className="relative">
                  {t.label}
                  {t.count !== undefined && <span className="ml-1.5 font-mono text-[11px] opacity-70">{t.count}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>

        {locked && sort !== 'mine' ? (
          <LockedSalon items={items.filter((i) => i.id !== featuredId && !i.mine)} total={total} viewer={viewer} />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-dashed border-border px-6 py-20 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent text-ink">
              <Palette className="size-6" aria-hidden="true" />
            </span>
            <div className="flex max-w-sm flex-col gap-2">
              <p className="text-xl font-semibold tracking-tight">{sort === 'mine' ? 'Henüz bir eser sergilemedin' : 'Salon şimdilik sessiz'}</p>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {sort === 'mine' ? 'Stüdyoda bir şey çiz ve “Sergile” düğmesiyle buraya as.' : 'İlk eseri sergileyen sen ol; “Atölye Sanatçısı” rozeti de seninle gelir.'}
              </p>
            </div>
            <StudioCta viewer={viewer} />
          </div>
        ) : (
          <ul className="columns-2 gap-6 sm:columns-3 xl:columns-4">
            {visible.map((item, i) => {
              const artist = artists[item.uid]
              if (!artist) return null
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.7, delay: (i % 4) * 0.06, ease: OUT }}
                  className="group relative mb-8 break-inside-avoid"
                >
                  <button type="button" onClick={() => setOpenUrl(item.id)} className="at-frame at-frame-sm block w-full text-left transition duration-500 hover:-translate-y-1">
                    <span className="at-mat block">
                      <span className="relative block overflow-hidden" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/art/${item.id}?s=thumb`} alt={item.title} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.03]" />
                      </span>
                    </span>
                  </button>
                  <span className="mt-3 flex items-baseline justify-between gap-3 px-0.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold tracking-tight">{item.title}</span>
                      <span className="block truncate font-serif text-sm italic text-muted-foreground">
                        <span className={nameStyleClass(artist.nameStyle)}>{artist.displayName}</span>, {new Date(item.at).getFullYear()}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">No. {String(i + 1).padStart(3, '0')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleLike(item)}
                    aria-pressed={item.liked}
                    aria-label={`${item.title} eserini ${item.liked ? 'beğenmekten vazgeç' : 'beğen'}, ${item.likes} beğeni`}
                    className={cn(
                      'absolute right-2.5 top-2.5 flex h-8 items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] backdrop-blur transition',
                      item.liked ? 'bg-primary text-primary-foreground' : 'bg-scrim/55 text-on-scrim hover:bg-scrim/75',
                    )}
                  >
                    <Heart className={cn('size-3.5', item.liked && 'fill-current')} aria-hidden="true" />
                    {item.likes}
                  </button>
                </motion.li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {current && artists[current.uid] && (
          <motion.div key="lightbox" className="fixed inset-0 z-[120] flex bg-scrim/95 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="art-title">
            <div className="relative flex min-w-0 flex-1 items-center justify-center p-4 sm:p-10" onClick={() => setOpenUrl(null)}>
              <motion.img
                key={current.id}
                src={`/api/art/${current.id}`}
                alt={current.title}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: OUT }}
                className="max-h-full max-w-full rounded-md object-contain shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
              />
              {visible.length > 1 && (
                <>
                  <button type="button" onClick={(e) => (e.stopPropagation(), step(-1))} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-on-scrim/10 text-on-scrim backdrop-blur transition hover:bg-on-scrim/20" aria-label="Önceki eser">
                    <ChevronLeft className="size-5" />
                  </button>
                  <button type="button" onClick={(e) => (e.stopPropagation(), step(1))} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-on-scrim/10 text-on-scrim backdrop-blur transition hover:bg-on-scrim/20 lg:right-6" aria-label="Sonraki eser">
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
              <button type="button" onClick={() => setOpenUrl(null)} className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-on-scrim/10 text-on-scrim backdrop-blur transition hover:bg-on-scrim/20 lg:hidden" aria-label="Kapat">
                <X className="size-5" />
              </button>
            </div>

            <aside className="dark hidden w-96 shrink-0 flex-col gap-6 overflow-y-auto border-l border-on-scrim/10 bg-scrim p-7 text-on-scrim lg:flex">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-on-scrim/45">
                  {currentIndex + 1} / {visible.length}
                </span>
                <button type="button" onClick={() => setOpenUrl(null)} className="grid size-9 place-items-center rounded-full text-on-scrim/70 transition hover:bg-on-scrim/10 hover:text-on-scrim" aria-label="Kapat">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <h2 id="art-title" className="text-balance text-3xl font-semibold leading-tight tracking-tight">
                  {current.title}
                </h2>
                <p className="text-sm text-on-scrim/55">{dateLabel(current.at)}</p>
              </div>
              <Link href={`/u/${artists[current.uid].username}`} className="flex items-center gap-3 rounded-2xl border border-on-scrim/10 p-3 transition hover:border-primary/60">
                <AvatarFrame src={artists[current.uid].avatar} name={artists[current.uid].displayName} frame={artists[current.uid].frame} className="size-12" />
                <span className="min-w-0">
                  <span className={cn('block truncate font-semibold', nameStyleClass(artists[current.uid].nameStyle))}>{artists[current.uid].displayName}</span>
                  <span className="block truncate font-mono text-xs text-on-scrim/50">@{artists[current.uid].username}</span>
                </span>
              </Link>
              <dl className="grid grid-cols-3 gap-2">
                {[
                  { k: 'Beğeni', v: String(current.likes), icon: Heart },
                  { k: 'Katman', v: String(current.layers), icon: Layers },
                  { k: 'Emek', v: current.effort < 60 ? '<1 dk' : `${Math.round(current.effort / 60)} dk`, icon: Timer },
                ].map((s) => (
                  <div key={s.k} className="flex flex-col gap-1 rounded-xl bg-on-scrim/[0.05] p-3">
                    <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-on-scrim/45">
                      <s.icon className="size-3" aria-hidden="true" /> {s.k}
                    </dt>
                    <dd className="text-lg font-semibold tabular-nums">{s.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => toggleLike(current)}
                  aria-pressed={current.liked}
                  className={cn('flex h-12 items-center justify-center gap-2 rounded-xl font-semibold transition', current.liked ? 'bg-primary text-primary-foreground' : 'bg-on-scrim text-scrim hover:bg-primary hover:text-primary-foreground')}
                >
                  <Heart className={cn('size-4', current.liked && 'fill-current')} aria-hidden="true" />
                  {current.liked ? 'Beğendin' : 'Beğen'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => share(current)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-on-scrim/15 text-sm transition hover:border-on-scrim/40">
                    <Link2 className="size-4" aria-hidden="true" /> Bağlantı
                  </button>
                  <a href={`/api/art/${current.id}`} download={`${current.title}.webp`} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-on-scrim/15 text-sm transition hover:border-on-scrim/40">
                    <Download className="size-4" aria-hidden="true" /> İndir
                  </a>
                </div>
                {(current.mine || viewer.staff) && (
                  <button
                    type="button"
                    onClick={() => remove(current)}
                    disabled={pending === current.id}
                    className="mt-2 flex h-10 items-center justify-center gap-2 rounded-xl text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> {current.mine ? 'Galeriden kaldır' : 'Moderasyon: kaldır'}
                  </button>
                )}
              </div>
            </aside>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-scrim to-transparent p-4 pt-12 text-on-scrim lg:hidden">
              <div className="min-w-0">
                <p className="truncate font-semibold">{current.title}</p>
                <p className={cn('truncate text-sm text-on-scrim/60', nameStyleClass(artists[current.uid].nameStyle))}>{artists[current.uid].displayName}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => toggleLike(current)} aria-pressed={current.liked} className={cn('flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold', current.liked ? 'bg-primary text-primary-foreground' : 'bg-on-scrim text-scrim')}>
                  <Heart className={cn('size-4', current.liked && 'fill-current')} aria-hidden="true" /> {current.likes}
                </button>
                {(current.mine || viewer.staff) && (
                  <button type="button" onClick={() => remove(current)} className="grid size-10 place-items-center rounded-full bg-on-scrim/10 text-destructive" aria-label="Galeriden kaldır">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
