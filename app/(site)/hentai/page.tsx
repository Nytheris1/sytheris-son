import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Play, Search, Sparkles } from 'lucide-react'
import { getTopTags, searchHanime, type HanimeSort } from '@/lib/hanime/catalog'
import { compactNumber, shortDuration } from '@/lib/hanime/format'
import { HanimeCard } from '@/components/hentai/hanime-card'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Hentai',
  description: 'Yetiskin anime katalogu: trend, yeni ve en begenilenler. Dogrudan sitede izle.',
  robots: { index: false, follow: false },
}

const SORTS: { id: HanimeSort; label: string }[] = [
  { id: 'trending', label: 'Trend' },
  { id: 'new', label: 'Yeni' },
  { id: 'top', label: 'Begeni' },
  { id: 'az', label: 'A-Z' },
]

type SP = Promise<Record<string, string | undefined>>

export const dynamic = 'force-dynamic'

export default async function HentaiPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.sayfa) || 1)
  const filtered = Boolean(sp.q || sp.etiket || sp.studyo || sp.sira || page > 1)

  const href = (next: Record<string, string | null>) => {
    const merged = { q: sp.q ?? null, etiket: sp.etiket ?? null, studyo: sp.studyo ?? null, sira: sp.sira ?? null, ...next }
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
    const q = p.toString()
    return q ? '/hentai?' + q : '/hentai'
  }

  if (!filtered) {
    const [trending, fresh, top, tags] = await Promise.all([
      searchHanime({ sort: 'trending' }),
      searchHanime({ sort: 'new' }),
      searchHanime({ sort: 'top' }),
      getTopTags(30),
    ])
    const hero = trending.items[0]
    const spotlight = trending.items.slice(0, 3)

    return (
      <div className="dark min-h-screen bg-background pb-24 text-foreground">
        <section className="relative isolate overflow-hidden">
          {hero?.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.cover} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full scale-110 object-cover opacity-30 blur-[2px]" />
          )}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_-10%,rgba(244,63,94,0.28),transparent_55%),linear-gradient(to_bottom,rgba(8,7,10,0.55),rgba(8,7,10,0.92)_60%,#08070a)]" aria-hidden="true" />

          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 pb-16 pt-20 sm:px-6 lg:px-10">
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
              <span className="h-px w-10 bg-primary" /> 18+ · Yetiskin
            </p>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-balance text-6xl font-bold leading-[0.92] tracking-[-0.055em] sm:text-8xl">
                Gece <span className="accent-serif italic text-primary">seansi</span>
              </h1>
              <p className="max-w-md text-pretty text-sm leading-relaxed text-foreground/55">
                Binlerce yetiskin anime, tek yerde. Sec, kaliteyi belirle, kaldigin yerden devam et.
              </p>
            </div>

            <form action="/hentai" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5 backdrop-blur">
              <Search className="size-4 shrink-0 text-foreground/35" aria-hidden="true" />
              <input name="q" placeholder="Baslik, alternatif isim, studyo..." className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/30" />
              <button className="h-10 rounded-full bg-primary px-6 text-sm font-semibold transition hover:bg-primary">Ara</button>
            </form>

            {spotlight.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {spotlight.map((v, i) => (
                  <Link
                    key={v.slug}
                    href={'/hentai/' + v.slug}
                    className="group relative isolate flex items-end gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 transition hover:border-primary/60"
                  >
                    <span className="relative block h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {v.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.cover} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                      )}
                      <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <Play className="size-4 fill-current text-foreground" aria-hidden="true" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 pb-1">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">0{i + 1}</span>
                      <span className="mt-0.5 line-clamp-2 block text-sm font-semibold leading-snug">{v.name}</span>
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-foreground/35">
                        {compactNumber(v.views)} izlenme · {shortDuration(v.durationMs)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto flex max-w-[1440px] flex-col gap-16 px-4 sm:px-6 lg:px-10">
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-foreground/40">Etiketler</h2>
            </div>
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t.text}>
                  <Link href={href({ etiket: t.text })} className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-foreground/65 transition hover:border-primary hover:text-foreground">
                    {t.text} <span className="font-mono text-[10px] text-foreground/25">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <Rail title="Trend" accent="olanlar" videos={trending.items} badge="TREND" />
          <Rail title="Yeni" accent="eklenenler" videos={fresh.items} badge="YENI" />
          <Rail title="En cok" accent="begenilenler" videos={top.items} />
        </div>
      </div>
    )
  }

  const result = await searchHanime({
    q: sp.q,
    tag: sp.etiket,
    brand: sp.studyo,
    sort: (sp.sira as HanimeSort | undefined) ?? 'trending',
    page,
  })

  return (
    <div className="dark min-h-screen bg-background pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">18+ katalog</p>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            {sp.etiket ?? sp.studyo ?? (sp.q ? '"' + sp.q + '"' : 'Tum')}{' '}
            <span className="accent-serif italic text-foreground/35">{sp.etiket || sp.studyo || sp.q ? 'sonuclar' : 'kitaplik'}</span>
          </h1>
        </div>

        <form action="/hentai" className="flex w-full max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1.5 pl-5">
          <Search className="size-4 shrink-0 text-foreground/35" aria-hidden="true" />
          <input name="q" defaultValue={sp.q ?? ''} placeholder="Ara..." className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/30" />
          <button className="h-10 rounded-full bg-muted px-5 text-sm font-medium">Ara</button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border p-1" role="group" aria-label="Siralama">
            {SORTS.map((s) => (
              <Link key={s.id} href={href({ sira: s.id })} className={cn('rounded-full px-3.5 py-1.5 text-xs font-medium transition', (sp.sira ?? 'trending') === s.id ? 'bg-primary text-foreground' : 'text-foreground/45 hover:text-foreground')}>
                {s.label}
              </Link>
            ))}
          </div>
          <p className="ml-auto font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/30">{result.total.toLocaleString('tr-TR')} sonuc</p>
        </div>

        {result.items.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {result.items.map((v) => (
              <li key={v.slug}><HanimeCard video={v} /></li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border px-6 py-20 text-center">
            <span className="grid size-12 place-items-center rounded-full border border-border bg-card">
              <Search className="size-5 text-foreground/35" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold">Sonuç yok</p>
              <p className="text-sm text-foreground/40">Filtreleri gevşetmeyi ya da başka bir etiket denemeyi dene.</p>
            </div>
            <Link href="/hentai" className="rounded-full border border-border px-5 py-2.5 text-sm transition hover:border-primary">
              Filtreleri temizle
            </Link>
          </div>
        )}

        <nav className="flex items-center justify-center gap-3 pt-4" aria-label="Sayfalama">
          {page > 1 && (
            <Link href={href({ sayfa: String(page - 1) })} className="flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm transition hover:border-primary">
              <ArrowLeft className="size-4" /> Onceki
            </Link>
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/30">Sayfa {page}</span>
          {result.hasNext && (
            <Link href={href({ sayfa: String(page + 1) })} className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold transition hover:bg-primary">
              Sonraki <ArrowRight className="size-4" />
            </Link>
          )}
        </nav>
      </div>
    </div>
  )
}

function Rail({ title, accent, videos, badge }: { title: string; accent: string; videos: import('@/lib/hanime/catalog').HanimeVideo[]; badge?: string }) {
  if (!videos.length) return null
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">
          {title} <span className="accent-serif italic text-foreground/35">{accent}</span>
        </h2>
      </div>
      <ul className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {videos.slice(0, 12).map((v) => (
          <li key={v.slug} className="w-[46%] shrink-0 snap-start sm:w-auto">
            <HanimeCard video={v} badge={badge} />
          </li>
        ))}
      </ul>
    </section>
  )
}