'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Columns2, Rows3, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  manga: { id: string; title: string }
  chapter: { id: string; number: string | null; title: string | null; lang: string }
  pages: string[]
  chapters: { id: string; number: string | null; title: string | null }[]
  prevId: string | null
  nextId: string | null
  hq: boolean
}

type Mode = 'strip' | 'page'
const MODE_KEY = 'sy-manga-mode'

export function MangaReader({ manga, chapter, pages, chapters, prevId, nextId, hq }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('strip')
  const [page, setPage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [chrome, setChrome] = useState(true)
  const lastY = useRef(0)

  const base = `/manga/${manga.id}/oku`
  const hqQuery = hq ? '?hq=1' : ''
  const label = chapter.number ? `${chapter.number}. bölüm` : 'Tek bölüm'

  useEffect(() => {
    const saved = window.localStorage.getItem(MODE_KEY)
    if (saved === 'page' || saved === 'strip') setMode(saved)
  }, [])

  const changeMode = (m: Mode) => {
    setMode(m)
    setPage(0)
    window.localStorage.setItem(MODE_KEY, m)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    if (mode !== 'strip') return
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
      const y = window.scrollY
      setChrome(y < 80 || y < lastY.current)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mode])

  const go = useCallback(
    (dir: 1 | -1) => {
      if (mode === 'page') {
        const nextPage = page + dir
        if (nextPage >= 0 && nextPage < pages.length) {
          setPage(nextPage)
          window.scrollTo({ top: 0 })
          return
        }
      }
      const target = dir === 1 ? nextId : prevId
      if (target) router.push(`${base}/${target}${hqQuery}`)
    },
    [mode, page, pages.length, nextId, prevId, router, base, hqQuery],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      if (e.key === 'ArrowRight' || (mode === 'page' && e.key === ' ')) {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, mode])

  const shownProgress = mode === 'page' ? (page + 1) / pages.length : progress

  return (
    <div className="dark min-h-dvh bg-scrim text-foreground">
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 border-b border-on-scrim/10 bg-scrim/85 backdrop-blur-xl transition-transform duration-500',
          !chrome && mode === 'strip' && '-translate-y-full',
        )}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-3 sm:px-5">
          <Link href={`/manga/${manga.id}`} className="grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-on-scrim/10" aria-label={`${manga.title} sayfasına dön`}>
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{manga.title}</span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
              {label}
              {chapter.title ? ` · ${chapter.title}` : ''} · {chapter.lang.toUpperCase()}
            </span>
          </div>

          <label className="hidden sm:block">
            <span className="sr-only">Bölüm seç</span>
            <select
              value={chapter.id}
              onChange={(e) => router.push(`${base}/${e.target.value}${hqQuery}`)}
              className="h-9 max-w-44 rounded-full border border-on-scrim/15 bg-scrim px-3 text-xs outline-none focus-visible:border-primary"
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number ? `Bölüm ${c.number}` : 'Tek bölüm'}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-full border border-on-scrim/15 p-0.5" role="group" aria-label="Okuma modu">
            <button type="button" onClick={() => changeMode('strip')} aria-pressed={mode === 'strip'} className={cn('grid size-8 place-items-center rounded-full transition', mode === 'strip' ? 'bg-on-scrim text-scrim' : 'text-foreground/60 hover:text-foreground')} aria-label="Dikey şerit">
              <Rows3 className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => changeMode('page')} aria-pressed={mode === 'page'} className={cn('grid size-8 place-items-center rounded-full transition', mode === 'page' ? 'bg-on-scrim text-scrim' : 'text-foreground/60 hover:text-foreground')} aria-label="Sayfa sayfa">
              <Columns2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          <Link
            href={`${base}/${chapter.id}${hq ? '' : '?hq=1'}`}
            aria-pressed={hq}
            className={cn('hidden h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition sm:flex', hq ? 'border-primary text-ink' : 'border-on-scrim/15 text-foreground/60 hover:text-foreground')}
          >
            <Sparkles className="size-3.5" aria-hidden="true" /> HD
          </Link>
        </div>
        <div className="h-0.5 bg-on-scrim/10" role="progressbar" aria-label="Okuma ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(shownProgress * 100)}>
          <div className="h-full origin-left bg-primary transition-transform duration-200" style={{ transform: `scaleX(${shownProgress})` }} />
        </div>
      </header>

      <main className="pt-14">
        {mode === 'strip' ? (
          <div className="mx-auto flex max-w-3xl flex-col">
            {pages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`${label}, sayfa ${i + 1} / ${pages.length}`} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" className="mg-page block w-full select-none bg-on-scrim/[0.03]" />
            ))}
          </div>
        ) : (
          <div className="relative mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-4xl items-center justify-center px-2 py-4">
            <button type="button" onClick={() => go(-1)} className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize" aria-label="Önceki sayfa" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={pages[page]} src={pages[page]} alt={`${label}, sayfa ${page + 1} / ${pages.length}`} className="mg-page-in max-h-[calc(100dvh-5.5rem)] w-auto max-w-full select-none object-contain" />
            <button type="button" onClick={() => go(1)} className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize" aria-label="Sonraki sayfa" />
            {/* Warm the next page so turning feels instant. */}
            {pages[page + 1] && <link rel="prefetch" as="image" href={pages[page + 1]} />}
            <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-scrim/80 px-3 py-1 font-mono text-xs tabular-nums text-foreground/70 backdrop-blur">
              {page + 1} / {pages.length}
            </span>
          </div>
        )}

        <nav className={cn('mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center', mode === 'page' && page < pages.length - 1 && 'hidden')} aria-label="Bölüm gezintisi">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-foreground/45">{label} bitti</p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {prevId ? (
              <Link href={`${base}/${prevId}${hqQuery}`} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-on-scrim/15 px-5 py-3.5 text-sm font-medium transition hover:bg-on-scrim/5">
                <ChevronLeft className="size-4" aria-hidden="true" /> Önceki bölüm
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            {nextId ? (
              <Link href={`${base}/${nextId}${hqQuery}`} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                Sonraki bölüm <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link href={`/manga/${manga.id}`} className="flex flex-1 items-center justify-center rounded-full bg-on-scrim px-5 py-3.5 text-sm font-semibold text-scrim transition hover:opacity-90">
                Son bölüme ulaştın — seriye dön
              </Link>
            )}
          </div>
          <p className="text-xs text-foreground/40">Klavye: ← → ile bölümler arasında geç</p>
        </nav>
      </main>
    </div>
  )
}
