import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, Search } from 'lucide-react'
import { listManga } from '@/lib/mangadex'

export const metadata: Metadata = { title: 'Manga', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | undefined>>
const img = (u: string) => (u ? '/api/manga/img?u=' + Buffer.from(u).toString('base64url') : '')

export default async function MangaTrPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const q = (sp.q || '').trim()
  const page = Math.max(1, Number(sp.sayfa) || 1)

  let items: Awaited<ReturnType<typeof listManga>>['items'] = []
  let hasNext = false
  let error = ''
  try {
    const r = await listManga(q, page)
    items = r.items
    hasNext = r.hasNext
  } catch (err) {
    error = err instanceof Error ? err.message : 'hata'
  }

  const href = (n: number) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (n > 1) p.set('sayfa', String(n))
    const s = p.toString()
    return s ? '/manga?' + s : '/manga'
  }

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rose-400">mangadex</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Manga <span className="accent-serif italic text-white/35">türkçe</span>
          </h1>
          <p className="max-w-lg text-sm text-white/40">Sadece Türkçe çevirisi olan seriler. Bölümler kendi okuyucumuzda açılır.</p>
        </div>

        <form action="/manga" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pl-5">
          <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="seri ara" className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
          <button className="h-10 rounded-full bg-rose-600 px-6 text-sm font-semibold">Ara</button>
        </form>

        {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

        {items.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {items.map((m) => (
              <Link key={m.id} href={'/manga/' + m.id} className="group flex flex-col gap-2">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  {m.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img(m.cover)} alt={m.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  ) : null}
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white/80">tr</span>
                </div>
                <h2 className="line-clamp-2 text-[13px] font-medium leading-snug text-white/85 group-hover:text-white">{m.title}</h2>
                {m.year ? <p className="font-mono text-[10px] text-white/30">{m.year}</p> : null}
              </Link>
            ))}
          </div>
        ) : (
          !error && <p className="rounded-3xl border border-dashed border-white/15 p-16 text-center text-white/40">Sonuç yok.</p>
        )}

        <nav className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={href(page - 1)} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm">
              <ArrowLeft className="size-4" /> Önceki
            </Link>
          )}
          {hasNext && (
            <Link href={href(page + 1)} className="flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold">
              Sonraki <ArrowRight className="size-4" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}