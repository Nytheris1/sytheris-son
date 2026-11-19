import Link from 'next/link'
import { Search } from 'lucide-react'
import type { MangaCard } from '@/lib/manga'

export function MangaHero({ stack, total, q }: { stack: MangaCard[]; total: number; q?: string }) {
  const covers = stack.filter((m) => m.coverHi).slice(0, 5)

  return (
    <section className="relative isolate overflow-hidden border-b border-border" aria-labelledby="mg-title">
      <div aria-hidden="true" className="halftone halftone-fade absolute inset-0 -z-10 text-foreground/[0.07]" />
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:px-10 lg:pb-20 lg:pt-16">
        <div className="flex flex-col gap-7">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" />
            Okuma salonu
          </p>
          <div className="flex items-start gap-5">
            <h1 id="mg-title" className="text-balance text-6xl font-bold leading-[0.88] tracking-[-0.055em] sm:text-8xl">
              Manga
              <br />
              <span className="accent-serif">kataloğu</span>
            </h1>
          </div>
          <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
            {total > 0 ? `${total.toLocaleString('tr-TR')}+ seri` : 'Binlerce seri'}, Türkçe ve İngilizce çevirileriyle. Sayfayı çevir, bölümler arasında akıp git — hesap gerekmeden.
          </p>

          <form action="/manga" method="get" role="search" className="group flex h-14 max-w-lg items-center gap-3 rounded-full border border-border bg-card pl-5 pr-1.5 shadow-sm transition focus-within:border-primary focus-within:shadow-lg">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="mg-q" className="sr-only">
              Manga ara
            </label>
            <input
              id="mg-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Chainsaw Man, Berserk, Frieren…"
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button type="submit" className="h-11 shrink-0 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90">
              Ara
            </button>
          </form>
        </div>

        {covers.length > 2 && (
          <div className="mg-fan relative mx-auto hidden h-[420px] w-full max-w-[520px] sm:block" aria-label="Öne çıkan seriler">
            {covers.map((m, i) => (
              <Link
                key={m.id}
                href={`/manga/${m.id}`}
                className="mg-fan-item absolute left-1/2 top-1/2 block aspect-[5/7] w-[46%] overflow-hidden rounded-md shadow-2xl ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ '--i': i - (covers.length - 1) / 2, zIndex: 10 - Math.abs(i - Math.floor(covers.length / 2)) } as React.CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.coverHi!} alt={m.title} className="size-full object-cover" loading={i < 3 ? 'eager' : 'lazy'} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
