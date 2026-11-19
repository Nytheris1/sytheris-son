import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, Search } from 'lucide-react'
import { searchPorn } from '@/lib/xnxx'

export const metadata: Metadata = { title: 'Pornolar', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | undefined>>

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
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rose-400">xnxx</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Pornolar <span className="accent-serif italic text-white/35">arsivi</span>
          </h1>
        </div>

        <form action="/porno" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pl-5">
          <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="ara" className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
          <button className="h-10 rounded-full bg-rose-600 px-6 text-sm font-semibold">Getir</button>
        </form>

        {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((v) => (
              <Link key={v.id} href={'/porno/' + v.id + '?t=' + encodeURIComponent(v.title) + '&s=' + encodeURIComponent(v.slug)} className="group flex flex-col gap-2.5">
                <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  {v.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl(v.thumb)}
                      alt={v.title}
                      loading="lazy"
                      className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-70 transition group-hover:opacity-90" />
                  {v.duration ? (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/90">
                      <Clock className="size-3" aria-hidden="true" />
                      {clock(v.duration)}
                    </span>
                  ) : null}
                </div>
                <h2 className="line-clamp-2 text-[13px] font-medium leading-snug text-white/85 group-hover:text-white">{v.title}</h2>
              </Link>
            ))}
          </div>
        ) : (
          !error && <p className="rounded-3xl border border-dashed border-white/15 p-16 text-center text-white/40">Sonuc yok.</p>
        )}

        <nav className="flex items-center justify-center gap-3" aria-label="Sayfalama">
          {page > 1 && (
            <Link href={href({ sayfa: String(page - 1) })} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm">
              <ArrowLeft className="size-4" /> Onceki
            </Link>
          )}
          {hasNext && (
            <Link href={href({ sayfa: String(page + 1) })} className="flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold">
              Sonraki <ArrowRight className="size-4" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}