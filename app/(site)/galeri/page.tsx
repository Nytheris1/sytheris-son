import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { searchR34 } from '@/lib/rule34'
import { GaleriGrid } from '@/components/hentai/galeri-grid'

export const metadata: Metadata = { title: 'Galeri', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type SP = Promise<Record<string, string | undefined>>

const wrap = (u: string) => '/api/r34/file?u=' + Buffer.from(u).toString('base64url')

export default async function GaleriPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const tags = (sp.etiket || '').trim()
  const page = Math.max(1, Number(sp.sayfa) || 1)

  let items: Awaited<ReturnType<typeof searchR34>>['items'] = []
  let hasNext = false
  let error = ''
  try {
    const r = await searchR34(tags, page)
    items = r.items
    hasNext = r.hasNext
  } catch (err) {
    error = err instanceof Error ? err.message : 'hata'
  }

  const href = (next: Record<string, string | null>) => {
    const p = new URLSearchParams()
    const merged = { etiket: tags || null, sayfa: null, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const q = p.toString()
    return q ? '/galeri?' + q : '/galeri'
  }

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rose-400">rule34</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Galeri <span className="accent-serif italic text-white/35">duvari</span>
          </h1>
        </div>

        <form action="/galeri" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pl-5">
          <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
          <input name="etiket" defaultValue={tags} placeholder="etiketler (bosluk = VE)" className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
          <button className="h-10 rounded-full bg-rose-600 px-6 text-sm font-semibold">Getir</button>
        </form>

        {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

        {items.length > 0 ? (
          <GaleriGrid
            items={items.map((i) => ({
              id: i.id,
              src: wrap(i.file),
              preview: wrap(i.preview),
              kind: i.kind,
              tags: i.tags,
              score: i.score,
            }))}
          />
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