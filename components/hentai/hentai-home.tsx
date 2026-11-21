import Link from 'next/link'
import { Flame, Play, Sparkles } from 'lucide-react'
import { getTopTags, searchHanime } from '@/lib/hanime/catalog'
import { compactNumber, shortDuration } from '@/lib/hanime/format'
import { HanimeCard } from './hanime-card'

export async function HentaiHome() {
  const [trending, fresh, top, tags] = await Promise.all([
    searchHanime({ sort: 'trending' }),
    searchHanime({ sort: 'new' }),
    searchHanime({ sort: 'top' }),
    getTopTags(18),
  ])

  const hero = trending.items[0]
  const spotlight = trending.items.slice(1, 4)

  return (
    <div className="dark flex flex-col gap-20 bg-[#08070a] pb-16 text-white">
      <section className="relative isolate overflow-hidden">
        {hero?.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.cover} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full scale-110 object-cover opacity-30 blur-sm" />
        )}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,rgba(244,63,94,0.32),transparent_55%),linear-gradient(to_bottom,rgba(8,7,10,0.5),rgba(8,7,10,0.94)_65%,#08070a)]" aria-hidden="true" />

        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-14 pt-20 sm:px-6 lg:px-10">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-rose-400">
            <span className="h-px w-10 bg-rose-500" /> 18+ mod
          </p>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-3xl text-balance text-6xl font-bold leading-[0.9] tracking-[-0.055em] sm:text-8xl">
              Gece <span className="accent-serif italic text-rose-400">seansi</span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/55">
              Yetiskin katalog onunde. Anime ve sinemaya donmek icin yukaridaki anahtari kullan.
            </p>
          </div>

          {hero && (
            <Link href={'/hentai/' + hero.slug} className="group flex w-full max-w-2xl items-end gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-rose-500/60">
              {hero.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero.cover} alt="" className="h-28 w-20 shrink-0 rounded-xl object-cover" />
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-1.5 pb-1">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-rose-400">
                  <Flame className="size-3" /> Su an trend
                </span>
                <span className="line-clamp-2 text-lg font-semibold leading-snug">{hero.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                  {compactNumber(hero.views)} izlenme · {shortDuration(hero.durationMs)}
                </span>
              </span>
              <span className="mb-1 grid size-12 shrink-0 place-items-center rounded-full bg-rose-600 text-white transition group-hover:scale-105">
                <Play className="ml-0.5 size-5 fill-current" />
              </span>
            </Link>
          )}

          <div className="flex flex-wrap gap-2">
            <Link href="/hentai" className="inline-flex h-11 items-center rounded-full bg-rose-600 px-6 text-sm font-semibold">Katalog</Link>
            <Link href="/galeri" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm">Rule34</Link>
            <Link href="/porno" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm">Porno</Link>
            <Link href="/rastgele" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm">Rastgele</Link>
          </div>
        </div>
      </section>

      {spotlight.length > 0 && (
        <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <ul className="grid gap-4 sm:grid-cols-3">
            {spotlight.map((v, i) => (
              <li key={v.slug}>
                <Link href={'/hentai/' + v.slug} className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl border border-white/10">
                  {v.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.cover} alt="" className="absolute inset-0 -z-10 size-full object-cover transition duration-700 group-hover:scale-105" />
                  )}
                  <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <span className="p-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300">#{i + 2} trend</span>
                    <span className="mt-1 line-clamp-2 block text-sm font-semibold">{v.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-rose-400" />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">Etiketler</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t.text}>
              <Link href={'/hentai?etiket=' + encodeURIComponent(t.text)} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-white/65 transition hover:border-rose-500 hover:text-white">
                {t.text} <span className="font-mono text-[10px] text-white/25">{t.count}</span>
              </Link>
            </li>
          ))}
        </ul>
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