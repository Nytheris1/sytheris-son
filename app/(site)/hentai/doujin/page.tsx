import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { listDoujin } from '@/lib/mangadex'

export const metadata: Metadata = { title: 'Doujinshi', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const img = (u: string) => (u ? '/api/manga/img?u=' + Buffer.from(u).toString('base64url') : '')

export default async function DoujinPage({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.sayfa) || 1)

  let items: Awaited<ReturnType<typeof listDoujin>>['items'] = []
  let hasNext = false
  let error = ''
  try {
    const r = await listDoujin(page)
    items = r.items
    hasNext = r.hasNext
  } catch (err) {
    error = err instanceof Error ? err.message : 'hata'
  }

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rose-400">doujinshi</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Doujin <span className="accent-serif italic text-white/35">rafı</span>
          </h1>
          <p className="max-w-lg text-sm text-white/40">Bağımsız çizimler, kendi okuyucumuzda. Dil etiketi bölüm listesinde görünür.</p>
        </div>

        {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p>}

        {items.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {items.map((m) => (
              <Link key={m.id} href={'/hentai/doujin/' + m.id} className="group flex flex-col gap-2">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  {m.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img(m.cover)} alt={m.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  ) : null}
                </div>
                <h2 className="line-clamp-2 text-[13px] font-medium leading-snug text-white/85 group-hover:text-white">{m.title}</h2>
              </Link>
            ))}
          </div>
        ) : (
          !error && <p className="rounded-3xl border border-dashed border-white/15 p-16 text-center text-white/40">Sonuç yok.</p>
        )}

        <nav className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Link href={'/hentai/doujin?sayfa=' + (page - 1)} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm">
              <ArrowLeft className="size-4" /> Önceki
            </Link>
          )}
          {hasNext && (
            <Link href={'/hentai/doujin?sayfa=' + (page + 1)} className="flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold">
              Sonraki <ArrowRight className="size-4" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}