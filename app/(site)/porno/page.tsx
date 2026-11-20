import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, Flame, Search } from 'lucide-react'
import { searchPorn } from '@/lib/porn'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Pornolar', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | undefined>>

const KATEGORILER = [
  'furry',
  'milf',
  'anal',
  'buyuk dildo',
  'teen',
  'olgun',
  'turk',
  'amatör',
  'hd',
  'lezbiyen',
  'asyali',
  'grup',
  'cuckold',
  'cosplay',
]

const clock = (s: number) => {
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? h + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec)
}

const thumbUrl = (u: string) => (u ? '/api/porn/thumb?u=' + Buffer.from(u).toString('base64url') : '')

export default async function PornoPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const page = Math.max(1, Number(sp.sayfa) || 1)

  let items: Awaited<ReturnType<typeof searchPorn>>['items'] = []
  let hasNext = false
  let error = ''
  try {
    const r = await searchPorn(q, page)
    items = r.items
    hasNext = r.hasNext
  } catch (err) {
    error = err instanceof Error ? err.message : 'hata'
  }

  const href = (next: Record<string, string | null>) => {
    const p = new URLSearchParams()
    const merged = { q: q || null, sayfa: null, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const s = p.toString()
    return s ? '/porno?' + s : '/porno'
  }

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-28 text-white">
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-rose-600/20 blur-[120px]" />
        <div className="relative mx-auto flex max-w-[1600px] flex-col gap-6 px-4 pb-8 pt-16 sm:px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-rose-400">xnxx</p>
              <h1 className="text-4xl font-bold tracking-[-0.045em] sm:text-6xl">
                Pornolar <span className="accent-serif italic text-white/30">arsivi</span>
              </h1>
            </div>
            <p className="hidden max-w-[16rem] text-right text-xs leading-relaxed text-white/35 sm:block">
              Kategori seç ya da ara. Her video kendi oynatıcımızda açılır.
            </p>
          </div>

          <form action="/porno" className="group flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 pl-5 transition focus-within:border-rose-500/50">
            <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
            <input
              name="q"
              defaultValue={q}
              placeholder="kategori ya da video ara"
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-white/25"
            />
            <button className="h-11 rounded-xl bg-rose-600 px-6 text-sm font-semibold transition hover:bg-rose-500">Ara</button>
          </form>

          <nav aria-label="Kategoriler" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link
              href="/porno"
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition',
                !q ? 'border-rose-500 bg-rose-600 text-white' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white',
              )}
            >
              Hepsi
            </Link>
            {KATEGORILER.map((k) => (
              <Link
                key={k}
                href={'/porno?q=' + encodeURIComponent(k)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition',
                  q.toLowerCase() === k ? 'border-rose-500 bg-rose-600 text-white' : 'border-white/12 text-white/55 hover:border-white/30 hover:text-white',
                )}
              >
                {k}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 pt-8 sm:px-6 lg:px-10">
        {error && (
          <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>
        )}

        {q ? (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Flame className="size-3.5 text-rose-400" aria-hidden="true" />
            <span className="font-mono uppercase tracking-[0.2em]">kategori</span>
            <span className="text-white/70">{q}</span>
            <Link href="/porno" className="ml-1 rounded-full border border-white/15 px-2.5 py-0.5 hover:border-white/40 hover:text-white">
              temizle
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((v) => (
              <Link key={v.id} href={'/porno/' + v.id + '?t=' + encodeURIComponent(v.title) + '&p=' + encodeURIComponent(v.path) + '&src=' + v.src} className="group flex flex-col gap-2.5">
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition duration-300 group-hover:ring-rose-500/60">
                  {v.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl(v.thumb)}
                      alt={v.title}
                      loading="lazy"
                      className="size-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.05] group-hover:opacity-100"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 transition group-hover:opacity-95" />
                  {v.duration ? (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/90 backdrop-blur">
                      <Clock className="size-3" aria-hidden="true" />
                      {clock(v.duration)}
                    </span>
                  ) : null}
                </div>
                <h2 className="line-clamp-2 text-[13px] font-medium leading-snug text-white/80 transition group-hover:text-white">{v.title}</h2>
              </Link>
            ))}
          </div>
        ) : (
          !error && (
            <p className="rounded-3xl border border-dashed border-white/15 p-16 text-center text-sm text-white/40">Sonuç yok.</p>
          )
        )}

        <nav className="flex items-center justify-center gap-3" aria-label="Sayfalama">
          {page > 1 && (
            <Link href={href({ sayfa: String(page - 1) })} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm transition hover:border-white/40">
              <ArrowLeft className="size-4" /> Önceki
            </Link>
          )}
          {hasNext && (
            <Link href={href({ sayfa: String(page + 1) })} className="flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold transition hover:bg-rose-500">
              Sonraki <ArrowRight className="size-4" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}