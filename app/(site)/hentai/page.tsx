import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { getTopTags, searchHanime, type HanimeSort } from '@/lib/hanime/catalog'
import { HanimeCard } from '@/components/hentai/hanime-card'
import { SectionHeading } from '@/components/anime/section-heading'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Hentai',
  description: 'hanime.tv kataloğu: trend, yeni ve en beğenilen yetişkin animeler. Doğrudan sitede izle.',
  robots: { index: false, follow: false },
}

const SORTS: { id: HanimeSort; label: string }[] = [
  { id: 'trending', label: 'Trend' },
  { id: 'new', label: 'Yeni' },
  { id: 'top', label: 'Beğeni' },
  { id: 'az', label: 'A–Z' },
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
    return q ? `/hentai?${q}` : '/hentai'
  }

  if (!filtered) {
    const [trending, fresh, top, tags] = await Promise.all([
      searchHanime({ sort: 'trending' }),
      searchHanime({ sort: 'new' }),
      searchHanime({ sort: 'top' }),
      getTopTags(),
    ])
    const hero = trending.items[0]

    return (
      <div className="dark bg-scrim pb-16 text-foreground">
        <section className="relative isolate overflow-hidden">
          {hero?.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.cover} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full scale-110 object-cover opacity-25 blur-2xl" />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-scrim/60 via-scrim/85 to-scrim" aria-hidden="true" />
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-12 pt-16 sm:px-6 lg:px-10">
            <p className="label-mono flex items-center gap-3 text-rose-400">
              <span className="h-px w-8 bg-rose-500" /> Yetişkin · 18+
            </p>
            <h1 className="text-balance text-5xl font-bold tracking-[-0.05em] sm:text-7xl">
              Gece <span className="accent-serif">seansı</span>
            </h1>
            <form action="/hentai" className="flex w-full max-w-xl gap-2">
              <input name="q" placeholder="Başlık, alternatif isim, slug…" className="h-12 flex-1 rounded-full border border-foreground/15 bg-foreground/5 px-5 text-sm outline-none placeholder:text-foreground/35 focus:border-rose-500" />
              <button className="grid size-12 place-items-center rounded-full bg-rose-600 text-white" aria-label="Ara"><Search className="size-4" /></button>
            </form>
            {hero && (
              <Link href={`/hentai/${hero.slug}`} className="group flex w-fit items-center gap-4 rounded-2xl border border-foreground/15 bg-foreground/5 p-2 pr-5 transition hover:border-rose-500/60">
                {(hero.poster ?? hero.cover) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(hero.poster ?? hero.cover)!} alt="" className="h-16 w-28 rounded-lg object-cover" />
                )}
                <span className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-400">Şu an trend</span>
                  <span className="line-clamp-1 font-semibold">{hero.name}</span>
                </span>
              </Link>
            )}
          </div>
        </section>

        <div className="mx-auto flex max-w-[1440px] flex-col gap-14 px-4 pt-10 sm:px-6 lg:px-10">
          <section className="flex flex-col gap-4">
            <SectionHeading eyebrow="Etiketler" title="Ne izlemek" accent="istiyorsun" />
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t.text}>
                  <Link href={href({ etiket: t.text })} className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs transition hover:border-rose-500">
                    {t.text} <span className="font-mono text-[10px] text-muted-foreground">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <Row title="Trend" accent="olanlar" videos={trending.items} badge="TREND" />
          <Row title="Yeni" accent="eklenenler" videos={fresh.items} badge="YENİ" />
          <Row title="En çok" accent="beğenilenler" videos={top.items} />
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
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pb-16 pt-12 sm:px-6 lg:px-10">
      <SectionHeading as="h1" eyebrow="18+ katalog" title={sp.etiket ?? sp.studyo ?? (sp.q ? `“${sp.q}”` : 'Tüm')} accent={sp.etiket || sp.studyo || sp.q ? 'sonuçlar' : 'kitaplık'} />
      <form action="/hentai" className="flex w-full max-w-xl gap-2">
        <input name="q" defaultValue={sp.q ?? ''} placeholder="Ara…" className="h-11 flex-1 rounded-full border border-border px-5 text-sm outline-none focus:border-primary" />
        <button className="grid size-11 place-items-center rounded-full bg-foreground text-background" aria-label="Ara"><Search className="size-4" /></button>
      </form>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full bg-muted p-1" role="group" aria-label="Sıralama">
          {SORTS.map((s) => (
            <Link key={s.id} href={href({ sira: s.id })} className={cn('rounded-full px-3.5 py-1.5 text-xs font-medium transition', (sp.sira ?? 'trending') === s.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {s.label}
            </Link>
          ))}
        </div>
        <p className="ml-auto font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{result.total.toLocaleString('tr-TR')} sonuç</p>
      </div>

      {result.items.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {result.items.map((v) => (
            <li key={v.slug}><HanimeCard video={v} /></li>
          ))}
        </ul>
      ) : (
        <p className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">Sonuç yok.</p>
      )}

      <nav className="flex items-center justify-center gap-3" aria-label="Sayfalama">
        {page > 1 && (
          <Link href={href({ sayfa: String(page - 1) })} className="flex h-12 items-center gap-2 rounded-full border border-border px-6 transition hover:border-primary">
            <ArrowLeft className="size-4" /> Önceki
          </Link>
        )}
        {result.hasNext && (
          <Link href={href({ sayfa: String(page + 1) })} className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground">
            Sonraki <ArrowRight className="size-4" />
          </Link>
        )}
      </nav>
    </div>
  )
}

function Row({ title, accent, videos, badge }: { title: string; accent: string; videos: import('@/lib/hanime/catalog').HanimeVideo[]; badge?: string }) {
  if (!videos.length) return null
  return (
    <section className="flex flex-col gap-5">
      <SectionHeading eyebrow="Seçki" title={title} accent={accent} />
      <ul className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {videos.slice(0, 10).map((v) => (
          <li key={v.slug} className="w-[220px] shrink-0 snap-start sm:w-auto">
            <HanimeCard video={v} badge={badge} />
          </li>
        ))}
      </ul>
    </section>
  )
}