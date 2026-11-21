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

  return (
    <div className="ht-theme dark flex flex-col gap-16 bg-background pb-16 text-foreground">
      <section className="relative isolate overflow-hidden border-b border-border">
        {hero?.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.cover} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full scale-110 object-cover opacity-25" />
        )}
        <div className="ht-hero-veil absolute inset-0 -z-10" aria-hidden="true" />
        <div className="ht-grid absolute inset-0 -z-10" aria-hidden="true" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-12 pt-16 sm:px-6 lg:px-10">
          <p className="label-mono flex items-center gap-3 text-primary">
            <span className="h-px w-10 bg-primary" /> 18+ mod
          </p>

          <h1 className="max-w-3xl text-balance text-5xl font-bold leading-[0.92] tracking-[-0.05em] sm:text-7xl">
            Gece <span className="accent-serif italic text-primary">seansi</span>
          </h1>

          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Yetiskin katalog onde: trend, yeni ve en cok begenilenler. Her baslik gomulu oynaticida acilir.
          </p>

          <form action="/hentai" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card/70 p-1.5 pl-5 backdrop-blur transition focus-within:border-primary/60">
            <Flame className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input name="q" placeholder="Baslik, studyo, etiket..." className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
            <button className="h-10 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Ara</button>
          </form>

          <nav className="flex flex-wrap gap-2">
            <Link href="/hentai" className="inline-flex h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground">Katalog</Link>
            <Link href="/hentai/doujin" className="inline-flex h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground">Doujinshi</Link>
            <Link href="/porno" className="inline-flex h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground">Pornolar</Link>
            <Link href="/galeri" className="inline-flex h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground">Rule34</Link>
            <Link href="/rastgele" className="inline-flex h-10 items-center rounded-full border border-border px-4 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-foreground">Rastgele</Link>
          </nav>

          {hero && (
            <Link href={'/hentai/' + hero.slug} className="ht-glow-sm group flex w-full max-w-xl items-center gap-4 rounded-2xl border border-border bg-card/80 p-3 backdrop-blur transition hover:border-primary">
              {hero.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero.cover} alt="" className="h-24 w-16 shrink-0 rounded-xl object-cover" />
              )}
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="label-mono flex items-center gap-1.5 text-[10px] text-primary">
                  <Flame className="size-3" /> Su an trend
                </span>
                <span className="line-clamp-2 text-[15px] font-semibold leading-snug">{hero.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {compactNumber(hero.views)} izlenme &middot; {shortDuration(hero.durationMs)}
                </span>
              </span>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-105">
                <Play className="ml-0.5 size-4 fill-current" />
              </span>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <h2 className="label-mono text-muted-foreground">Etiketler</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t.text}>
              <Link href={'/hentai?etiket=' + encodeURIComponent(t.text)} className="ht-chip flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground">
                {t.text} <span className="font-mono text-[10px] opacity-60">{t.count}</span>
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
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">
          {title} <span className="accent-serif italic text-muted-foreground">{accent}</span>
        </h2>
        <Link href="/hentai" className="text-sm text-muted-foreground transition hover:text-foreground">Tumu</Link>
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