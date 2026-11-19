@'
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$enc = New-Object System.Text.UTF8Encoding($false)

foreach ($rel in @('components/hentai/hanime-player.tsx','lib/hanime/catalog.ts')) {
  $p = Join-Path $root $rel
  if (Test-Path $p) { Copy-Item $p ($p + "." + $stamp + ".bak") -Force }
}

$catalog = @'
import 'server-only'

const ENDPOINT = 'https://guest.freeanimehentai.net/api/v11/search_hvs'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export type HanimeTag = { id?: number; text: string; slug?: string }

export type HanimeVideo = {
  id: number
  slug: string
  name: string
  titles: string[]
  searchTitles: string
  description: string
  cover: string | null
  poster: string | null
  brand: string | null
  censored: boolean
  durationMs: number
  views: number
  likes: number
  rating: number
  releasedAt: number
  tags: HanimeTag[]
}

type Raw = Record<string, unknown>

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

const toTags = (raw: unknown): HanimeTag[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((t) => {
      if (typeof t === 'string') return { text: t }
      const o = t as Raw
      const text = str(o.text) || str(o.name) || str(o.slug)
      return text ? { id: num(o.id) || undefined, text, slug: str(o.slug) || undefined } : null
    })
    .filter((t): t is HanimeTag => Boolean(t))
}

const fold = (s: string) =>
  s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/(.)\1+/g, '$1')
    .trim()

const haystack = (v: HanimeVideo) =>
  fold([v.name, v.searchTitles, v.slug, v.brand ?? '', v.tags.map((t) => t.text).join(' ')].join(' '))

function normalize(raw: Raw): HanimeVideo | null {
  const slug = str(raw.slug)
  if (!slug) return null
  const artwork = (raw.artwork ?? {}) as Raw
  return {
    id: num(raw.id),
    slug,
    name: str(raw.name) || slug,
    titles: Array.isArray(raw.titles) ? raw.titles.filter((t): t is string => typeof t === 'string') : [],
    searchTitles: str(raw.search_titles),
    description: str(raw.description),
    cover: str(raw.cover_url) || str(raw.cover) || str(artwork.cover) || null,
    poster: str(raw.poster_url) || str(raw.poster) || str(artwork.poster) || null,
    brand: str(raw.brand) || str(raw.brand_name) || null,
    censored: raw.is_censored === true,
    durationMs: num(raw.duration_in_ms),
    views: num(raw.views),
    likes: num(raw.likes),
    rating: num(raw.rating),
    releasedAt: num(raw.released_at),
    tags: toTags(raw.tags),
  }
}

let cache: { at: number; items: HanimeVideo[] } | null = null
let inflight: Promise<HanimeVideo[]> | null = null
const TTL = 10 * 60 * 1000

async function load(): Promise<HanimeVideo[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.items
  inflight ??= (async () => {
    const res = await fetch(ENDPOINT, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('hanime katalog ' + res.status)
    const json = (await res.json()) as { data?: Raw[] }
    const items = (json.data ?? []).map(normalize).filter((v): v is HanimeVideo => Boolean(v))
    if (items.length) cache = { at: Date.now(), items }
    return items
  })().finally(() => {
    inflight = null
  })
  return inflight
}

export type HanimeSort = 'trending' | 'new' | 'top' | 'az'

const SORTERS: Record<HanimeSort, (a: HanimeVideo, b: HanimeVideo) => number> = {
  trending: (a, b) => b.views - a.views,
  new: (a, b) => b.releasedAt - a.releasedAt,
  top: (a, b) => b.likes - a.likes,
  az: (a, b) => a.name.localeCompare(b.name),
}

export const PER_PAGE = 30

export type HanimeQuery = { q?: string; tag?: string; brand?: string; sort?: HanimeSort; page?: number }

export async function searchHanime(input: HanimeQuery) {
  const all = await load()
  const q = input.q?.trim()
  const tag = input.tag?.trim().toLowerCase()
  const brand = input.brand?.trim().toLowerCase()

  let items = all

  if (q) {
    const tokens = fold(q).split(' ').filter(Boolean)
    if (tokens.length) {
      const scored = items.map((v) => ({ v, hay: haystack(v) }))
      const strict = scored.filter((s) => tokens.every((t) => s.hay.includes(t)))
      const pool = strict.length ? strict : scored.filter((s) => tokens.some((t) => s.hay.includes(t)))
      const folded = fold(q)
      const score = (v: HanimeVideo) => {
        const name = fold(v.name)
        if (name === folded) return 1000
        if (name.startsWith(folded)) return 500
        return tokens.filter((t) => haystack(v).includes(t)).length * 50
      }
      items = pool.map((s) => s.v).sort((a, b) => score(b) - score(a))
    }
  }

  if (tag) items = items.filter((v) => v.tags.some((t) => t.text.toLowerCase() === tag || t.slug === tag))
  if (brand) items = items.filter((v) => v.brand?.toLowerCase() === brand)

  if (!q) {
    const sort = input.sort && input.sort in SORTERS ? input.sort : 'trending'
    items = [...items].sort(SORTERS[sort])
  }

  const page = Math.max(1, Math.floor(input.page ?? 1))
  const start = (page - 1) * PER_PAGE
  return {
    items: items.slice(start, start + PER_PAGE),
    total: items.length,
    page,
    hasNext: start + PER_PAGE < items.length,
  }
}

export async function getVideo(slug: string): Promise<HanimeVideo | null> {
  const all = await load()
  return all.find((v) => v.slug === slug) ?? null
}

export async function getRelated(video: HanimeVideo, limit = 12) {
  const all = await load()
  const byBrand = all.filter((v) => v.slug !== video.slug && video.brand && v.brand === video.brand)
  const byTag = all.filter(
    (v) => v.slug !== video.slug && v.tags.some((t) => video.tags.some((x) => x.text === t.text)),
  )
  const seen = new Set<number>()
  return [...byBrand, ...byTag].filter((v) => (seen.has(v.id) ? false : seen.add(v.id))).slice(0, limit)
}

export async function getTopTags(limit = 24) {
  const all = await load()
  const counts = new Map<string, number>()
  for (const v of all) for (const t of v.tags) counts.set(t.text, (counts.get(t.text) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text, count]) => ({ text, count }))
}

export async function getStats() {
  const all = await load()
  return { total: all.length }
}
'@

[IO.File]::WriteAllText((Join-Path $root 'lib/hanime/catalog.ts'), $catalog, $enc)
Write-Host 'YAZILDI lib/hanime/catalog.ts' -ForegroundColor Green

$player = @'
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Loader2, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type Source = { url: string; height: number; label: string }

export function HanimePlayer({ slug, title }: { slug: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [active, setActive] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const res = await fetch('/api/h/sources?slug=' + encodeURIComponent(slug), {
          headers: { Accept: 'application/json' },
        })
        const text = await res.text()
        if (!res.ok) throw new Error('Kaynak servisi ' + res.status + ' - ' + text.slice(0, 70))
        let json: { sources?: Source[]; error?: string }
        try {
          json = JSON.parse(text)
        } catch {
          throw new Error('Servis JSON yerine HTML dondurdu: /api yolu gate tarafindan kapatilmis olabilir.')
        }
        if (!json.sources || !json.sources.length) throw new Error(json.error || 'Kaynak yok')
        if (dead) return
        setSources(json.sources)
        setStatus('ready')
      } catch (err) {
        if (dead) return
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Bilinmeyen hata')
      }
    })()
    return () => {
      dead = true
    }
  }, [slug, nonce])

  useEffect(() => {
    const el = videoRef.current
    const current = sources[active]
    if (!el || !current) return

    let cleanup = () => {}
    ;(async () => {
      const mod = await import('hls.js')
      const Hls = mod.default
      if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 30, enableWorker: true })
        hls.loadSource(current.url)
        hls.attachMedia(el)
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            setStatus('error')
            setMessage('Yayin kesildi. Baska kaliteyi dene.')
          }
        })
        cleanup = () => hls.destroy()
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = current.url
      } else {
        setStatus('error')
        setMessage('Tarayici HLS desteklemiyor.')
      }
    })()

    return () => {
      cleanup()
    }
  }, [sources, active])

  const external = 'https://hanime.tv/videos/hentai/' + slug

  const retry = () => {
    setStatus('loading')
    setMessage('')
    setActive(0)
    setNonce((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-3xl border border-border bg-black">
        <video ref={videoRef} controls playsInline className="absolute inset-0 size-full" />
        {status === 'loading' && (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
            <TriangleAlert className="size-6 text-amber-400" />
            <p className="text-sm text-foreground/70">{message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={retry}
                className="rounded-full border border-foreground/25 px-4 py-2 text-sm"
              >
                Tekrar dene
              </button>
              <Link
                href={external}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white"
              >
                hanime.tv
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {sources.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((s, i) => (
              <button
                key={s.url}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                  i === active ? 'border-rose-500 bg-rose-600 text-white' : 'border-border hover:border-rose-500/60',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{sources[0]?.label || ''}</span>
        )}
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-rose-500"
        >
          {title} <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  )
}
'@

[IO.File]::WriteAllText((Join-Path $root 'components/hentai/hanime-player.tsx'), $player, $enc)
Write-Host 'YAZILDI components/hentai/hanime-player.tsx' -ForegroundColor Green

Write-Host ''
Write-Host 'Simdi calistir: pnpm build' -ForegroundColor Cyan
'@ | Set-Content -Encoding utf8 yeniden-yaz.ps1

powershell -NoProfile -ExecutionPolicy Bypass -File .\yeniden-yaz.ps1