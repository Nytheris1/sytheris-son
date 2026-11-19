import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Dices, Radio, Sparkles } from 'lucide-react'
import { searchAnime } from '@/lib/anilist'
import { currentSeason, genreTr } from '@/lib/format'
import { TROPE_LABEL } from '@/lib/tropes'
import { AnimeCard } from '@/components/anime/anime-card'
import { SectionHeading } from '@/components/anime/section-heading'
import { SearchFilters } from '@/components/search/search-filters'

export const metadata: Metadata = { title: 'Keşfet', description: 'Tüm anime kataloğunda tür, yıl, sezon ve formata göre ara.' }

type SP = Promise<Record<string, string | undefined>>

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const { season, year } = currentSeason()
  const result = await searchAnime({
    q: sp.q,
    genre: sp.genre,
    tag: sp.tag,
    year: sp.year ? Number(sp.year) : undefined,
    season: sp.season,
    format: sp.format,
    status: sp.status,
    sort: sp.sort,
    page,
  })
  const link = (p: number) => {
    const next = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][])
    next.set('page', String(p))
    return `/ara?${next.toString()}`
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pt-14">
      <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <SectionHeading
          as="h1"
          eyebrow="Katalog"
          title={sp.genre ? genreTr(sp.genre) : sp.tag ? sp.tag.split(',').map((t) => TROPE_LABEL[t] ?? t).join(' + ') : 'Tüm animeleri'}
          accent={sp.genre || sp.tag ? 'animeleri' : 'keşfet'}
          description="Binlerce anime arasında ara; türlere, klişelere ve sezonlara göre filtrele, yeni favorini bul."
        />
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Hızlı erişim">
          {[
            { href: `/ara?season=${season}&year=${year}`, label: 'Bu sezon', icon: Sparkles },
            { href: '/ara?status=RELEASING&sort=TRENDING_DESC', label: 'Yayında', icon: Radio },
            { href: '/takvim', label: 'Takvim', icon: CalendarDays },
            { href: '/rastgele', label: 'Rastgele öneri', icon: Dices },
          ].map((l) => (
            <Link key={l.label} href={l.href} className="group flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary">
              <span className="grid size-8 place-items-center rounded-xl bg-accent text-ink transition group-hover:bg-primary group-hover:text-primary-foreground">
                <l.icon className="size-4" />
              </span>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <Suspense>
        <SearchFilters />
      </Suspense>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {result.pageInfo.total > 0 ? `${result.pageInfo.total.toLocaleString('tr-TR')}+ sonuç · sayfa ${page}` : 'Sonuç yok'}
      </p>
      {result.media.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {result.media.map((m, i) => (
            <li key={m.id}>
              <AnimeCard media={m} priority={i < 6} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-24 text-center">
          <p className="text-2xl font-semibold">
            Hiçbir şey <span className="accent-serif">bulunamadı</span>
          </p>
          <p className="text-muted-foreground">Filtreleri gevşetmeyi ya da farklı bir arama yapmayı dene.</p>
        </div>
      )}
      <nav className="flex items-center justify-center gap-3" aria-label="Sayfalama">
        {page > 1 && (
          <Link href={link(page - 1)} className="flex h-12 items-center gap-2 rounded-full border border-border px-6 transition hover:border-primary">
            <ArrowLeft className="size-4" /> Önceki
          </Link>
        )}
        {result.pageInfo.hasNextPage && (
          <Link href={link(page + 1)} className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition hover:brightness-110">
            Sonraki <ArrowRight className="size-4" />
          </Link>
        )}
      </nav>
    </div>
  )
}
