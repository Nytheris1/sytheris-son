import type { Metadata } from 'next'
import Link from 'next/link'
import { SERIES_GENRES, getSeriesByGenre, getSeriesIndex, isSeriesGenre } from '@/lib/series'
import { cn } from '@/lib/utils'
import { SeriesCard } from '@/components/series/series-card'

export const metadata: Metadata = {
  title: 'Diziler',
  description: 'En sevilen yabancı diziler: dram, suç, bilim kurgu, fantastik, komedi, gerilim ve daha fazlası. Puanlar, sezonlar ve oyuncular.',
}

const SORTS = [
  { id: 'populer', label: 'Popüler' },
  { id: 'puan', label: 'En yüksek puan' },
  { id: 'yeni', label: 'En yeni' },
] as const

export default async function SeriesPage({ searchParams }: { searchParams: Promise<{ tur?: string; sira?: string }> }) {
  const { tur, sira } = await searchParams
  const genre = isSeriesGenre(tur) ? SERIES_GENRES.find((g) => g.id === tur)! : null
  const sort = SORTS.find((s) => s.id === sira)?.id ?? 'populer'
  const base = genre ? await getSeriesByGenre(genre.id, 120) : (await getSeriesIndex()).slice(0, 120)
  const list = sort === 'puan' ? [...base].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)) : sort === 'yeni' ? [...base].sort((a, b) => (b.premiered ?? '').localeCompare(a.premiered ?? '')) : base
  const href = (next: { tur?: string | null; sira?: string | null }) => {
    const p = new URLSearchParams()
    const t = next.tur === undefined ? genre?.id : next.tur
    const s = next.sira === undefined ? sort : next.sira
    if (t) p.set('tur', t)
    if (s && s !== 'populer') p.set('sira', s)
    const q = p.toString()
    return q ? `/diziler?${q}` : '/diziler'
  }

  return (
    <div className="cine dark min-h-dvh">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-24 pt-10 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4">
          <p className="label-mono flex items-center gap-3 text-ink">
            <span className="h-px w-8 bg-primary" /> Sinema modu · Diziler
          </p>
          <h1 className="text-balance text-5xl font-bold tracking-[-0.04em] sm:text-6xl">
            {genre ? genre.label : 'Tüm'} <span className="accent-serif">diziler</span>
          </h1>
          <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">{genre ? genre.blurb : 'Dünyada en çok izlenen, en çok konuşulan diziler. Tür ve sıralama seçerek daralt.'}</p>
        </header>

        <div className="flex flex-col gap-4">
          <nav aria-label="Dizi türleri" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={href({ tur: null })} aria-current={!genre ? 'page' : undefined} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm transition', !genre ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
              Hepsi
            </Link>
            {SERIES_GENRES.map((g) => (
              <Link key={g.id} href={href({ tur: g.id })} aria-current={genre?.id === g.id ? 'page' : undefined} className={cn('shrink-0 rounded-full border px-4 py-2 text-sm transition', genre?.id === g.id ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40')}>
                {g.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 self-start rounded-full bg-muted p-1" role="group" aria-label="Sıralama">
            {SORTS.map((s) => (
              <Link key={s.id} href={href({ sira: s.id })} aria-current={sort === s.id ? 'true' : undefined} className={cn('rounded-full px-3.5 py-1.5 text-xs font-medium transition', sort === s.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {list.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {list.map((s, i) => (
              <li key={s.id}>
                <SeriesCard series={s} rank={sort === 'populer' && i < 10 ? i + 1 : undefined} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">Dizi listesine şu an ulaşılamıyor. Biraz sonra tekrar dene.</p>
        )}
      </div>
    </div>
  )
}
