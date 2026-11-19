import Link from 'next/link'
import { searchHanime } from '@/lib/hanime/catalog'
import { HanimeCard } from './hanime-card'

export async function HentaiHome() {
  const [trending, fresh, top] = await Promise.all([
    searchHanime({ sort: 'trending' }),
    searchHanime({ sort: 'new' }),
    searchHanime({ sort: 'top' }),
  ])

  return (
    <div className="dark flex flex-col gap-16 bg-[#08070a] pb-4 pt-10 text-white">
      <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_15%_0%,rgba(244,63,94,0.3),transparent_55%)] p-8 sm:p-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-rose-400">18+ mod</p>
          <h1 className="mt-3 max-w-2xl text-balance text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-6xl">
            Gece <span className="accent-serif italic text-rose-400">seansi</span> basladi
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
            Yetiskin katalog onunde. Anime ve sinemaya donmek icin yukaridaki anahtari kullan.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/hentai" className="inline-flex h-11 items-center rounded-full bg-rose-600 px-6 text-sm font-semibold">
              Tumunu gor
            </Link>
            <Link href="/galeri" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm">
              Galeri
            </Link>
            <Link href="/porno" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm">
              Porno
            </Link>
          </div>
        </div>
      </section>

      <Rail title="Trend" accent="olanlar" items={trending.items} />
      <Rail title="Yeni" accent="eklenenler" items={fresh.items} />
      <Rail title="En cok" accent="begenilenler" items={top.items} />
    </div>
  )
}

function Rail({ title, accent, items }: { title: string; accent: string; items: import('@/lib/hanime/catalog').HanimeVideo[] }) {
  if (!items.length) return null
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 sm:px-6 lg:px-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">
          {title} <span className="accent-serif italic text-white/35">{accent}</span>
        </h2>
        <Link href="/hentai" className="text-sm text-white/40 transition hover:text-white">Tumu</Link>
      </div>
      <ul className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {items.slice(0, 12).map((v) => (
          <li key={v.slug} className="w-[46%] shrink-0 snap-start sm:w-auto">
            <HanimeCard video={v} />
          </li>
        ))}
      </ul>
    </section>
  )
}