import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { searchAnime } from '@/lib/anilist'
import { genreTr } from '@/lib/format'
import { AnimeCard } from '@/components/anime/anime-card'
import { SectionHeading } from '@/components/anime/section-heading'
import { SearchFilters } from '@/components/search/search-filters'

export const metadata: Metadata = { title: 'Keşfet', description: 'Tüm anime kataloğunda tür, yıl, sezon ve formata göre ara.' }

type SP = Promise<Record<string, string | undefined>>

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const result = await searchAnime({
    q: sp.q,
    genre: sp.genre,
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
      <SectionHeading as="h1" eyebrow="Katalog" title={sp.genre ? genreTr(sp.genre) : 'Tüm animeleri'} accent={sp.genre ? 'animeleri' : 'keşfet'} description="Binlerce anime arasında ara, filtrele ve yeni favorini bul." />
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
