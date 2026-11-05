import type { Metadata } from 'next'
import Link from 'next/link'
import { getCompare } from '@/lib/anilist'
import type { MediaDetail } from '@/lib/anilist-types'
import { compact, formatTr, genreTr, pickTitle, seasonTr, statusTr } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SectionHeading } from '@/components/anime/section-heading'
import { ComparePicker } from '@/components/compare/compare-picker'

export const metadata: Metadata = { title: 'Karşılaştır', description: 'İki animeyi puan, popülerlik ve detaylarına göre yan yana karşılaştır.' }

type SP = Promise<{ a?: string; b?: string }>

function Bar({ a, b, label, fmt = (n: number) => String(n) }: { a?: number | null; b?: number | null; label: string; fmt?: (n: number) => string }) {
  const av = a ?? 0
  const bv = b ?? 0
  const max = Math.max(av, bv, 1)
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
      <div className="flex items-center justify-end gap-3">
        <span className={cn('font-mono text-sm tabular-nums', av >= bv && av > 0 && 'font-semibold text-ink')}>{a != null ? fmt(av) : '—'}</span>
        <div className="h-2.5 w-full max-w-60 overflow-hidden rounded-full bg-muted">
          <div className="ml-auto h-full rounded-full bg-primary" style={{ width: `${(av / max) * 100}%`, opacity: av >= bv ? 1 : 0.45 }} />
        </div>
      </div>
      <span className="label-mono w-24 text-center text-[10px] text-muted-foreground sm:w-32">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-full max-w-60 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(bv / max) * 100}%`, opacity: bv >= av ? 1 : 0.45 }} />
        </div>
        <span className={cn('font-mono text-sm tabular-nums', bv >= av && bv > 0 && 'font-semibold text-ink')}>{b != null ? fmt(bv) : '—'}</span>
      </div>
    </div>
  )
}

function Side({ m, align }: { m?: MediaDetail; align: 'left' | 'right' }) {
  if (!m) return <div className="grid aspect-[2/3] w-full max-w-56 place-items-center rounded-3xl border border-dashed border-border text-sm text-muted-foreground">Anime seç</div>
  return (
    <Link href={`/anime/${m.id}`} className={cn('group flex flex-col gap-3', align === 'right' ? 'items-start' : 'items-end text-right')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.coverImage.extraLarge || m.coverImage.large || '/placeholder.svg'} alt="" className="aspect-[2/3] w-full max-w-56 rounded-3xl object-cover shadow-xl transition group-hover:-translate-y-1" />
      <p className="text-lg font-semibold leading-tight group-hover:text-ink sm:text-xl">{pickTitle(m.title)}</p>
      <p className="text-sm text-muted-foreground">{[m.seasonYear, formatTr(m.format), statusTr(m.status)].filter(Boolean).join(' · ')}</p>
    </Link>
  )
}

export default async function ComparePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams
  const ids = [sp.a, sp.b].map(Number).filter((n) => Number.isInteger(n) && n > 0)
  const list = await getCompare(ids)
  const a = list.find((m) => m.id === Number(sp.a))
  const b = list.find((m) => m.id === Number(sp.b))
  const completed = (m?: MediaDetail) => m?.stats?.statusDistribution?.find((s) => s.status === 'COMPLETED')?.amount ?? null

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pt-14">
      <SectionHeading as="h1" eyebrow="Kafa kafaya" title="İki animeyi" accent="karşılaştır" description="İki yapımı seç; puan, popülerlik, bölüm sayısı ve daha fazlasını yan yana gör." />
      <ComparePicker a={a ? { id: a.id, title: pickTitle(a.title) } : null} b={b ? { id: b.id, title: pickTitle(b.title) } : null} />
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-10">
        <Side m={a} align="left" />
        <span className="mt-24 font-serif text-4xl italic text-ink sm:text-6xl">vs</span>
        <Side m={b} align="right" />
      </div>
      {a && b && (
        <div className="flex flex-col gap-5 rounded-[2rem] border border-border bg-card p-5 sm:p-10">
          <Bar label="Ortalama puan" a={a.averageScore} b={b.averageScore} fmt={(n) => `${n}%`} />
          <Bar label="Popülerlik" a={a.popularity} b={b.popularity} fmt={compact} />
          <Bar label="Favori" a={a.favourites} b={b.favourites} fmt={compact} />
          <Bar label="Tamamlayan" a={completed(a)} b={completed(b)} fmt={compact} />
          <Bar label="Bölüm" a={a.episodes} b={b.episodes} />
          <Bar label="Süre (dk)" a={a.duration} b={b.duration} />
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] gap-3 border-t border-border pt-6 text-sm sm:gap-6">
            {(
              [
                ['Stüdyo', a.studios?.nodes[0]?.name, b.studios?.nodes[0]?.name],
                ['Sezon', a.season ? `${seasonTr(a.season)} ${a.seasonYear}` : null, b.season ? `${seasonTr(b.season)} ${b.seasonYear}` : null],
                ['Türler', a.genres?.slice(0, 3).map(genreTr).join(', '), b.genres?.slice(0, 3).map(genreTr).join(', ')],
              ] as const
            ).map(([k, x, y]) => (
              <div key={k} className="contents">
                <span className="text-right">{x ?? '—'}</span>
                <span className="label-mono w-24 text-center text-[10px] text-muted-foreground sm:w-32">{k}</span>
                <span>{y ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
