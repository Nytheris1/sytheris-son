import Link from 'next/link'
import type { SeriesDetail } from '@/lib/series'
import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'

/** "Yıldızlar geçidi" — the faces behind this week's series, each opening its actor page. */
export function StarFaces({ series }: { series: SeriesDetail[] }) {
  const seen = new Set<number>()
  const faces: { id: number; name: string; character: string; show: string; image: string }[] = []
  const maxPerShow = 5
  for (const s of series) {
    let taken = 0
    for (const c of s.cast) {
      if (taken >= maxPerShow || seen.has(c.personId) || !c.personImage) continue
      seen.add(c.personId)
      faces.push({ id: c.personId, name: c.name, character: c.character, show: s.name, image: c.personImage })
      taken++
    }
  }
  if (faces.length < 4) return null

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:px-10" id="star-faces" aria-label="Ekranın yüzleri">
      <SectionHeading eyebrow="Yıldızlar geçidi" title="Ekranın" accent="yüzleri" description="Bu haftanın dizilerinde rol alan oyuncular. Bir yüze dokun, tüm filmografisini aç." />
      <ScrollRow label="Oyuncular">
        {faces.map((f) => (
          <Link key={f.id} href={`/oyuncu/tv-${f.id}`} className="group flex w-[38vw] shrink-0 snap-start flex-col items-center gap-4 text-center outline-none sm:w-[168px]">
            <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-t-full rounded-b-lg bg-muted ring-1 ring-border transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_0_60px_-18px_var(--primary)] group-hover:ring-primary/70 group-focus-visible:ring-2 group-focus-visible:ring-primary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.image} alt="" loading="lazy" decoding="async" className="cine-portrait size-full object-cover object-top" />
            </span>
            <span className="flex w-full flex-col gap-1">
              <span className="truncate font-semibold transition group-hover:text-ink">{f.name}</span>
              <span className="truncate font-serif text-sm italic text-muted-foreground">{f.character}</span>
              <span className="truncate font-mono text-[10px] tracking-[0.08em] text-foreground/45">{f.show}</span>
            </span>
          </Link>
        ))}
      </ScrollRow>
    </section>
  )
}
