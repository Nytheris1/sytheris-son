import Link from 'next/link'
import type { Film } from '@/lib/films'
import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'

/** A literal strip of 35mm film: perforated rails, one frame per title, giant outlined rank numerals. */
export function FilmTopTen({ items }: { items: Film[] }) {
  const top = items.slice(0, 10)
  if (!top.length) return null
  const week = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })

  return (
    <section className="flex w-full flex-col gap-8" aria-labelledby="film-top10">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <SectionHeading eyebrow={`Türkiye · ${week} haftası`} title="Bu hafta" accent="vizyonun zirvesi" description="Türkiye'de en çok kiralanan ve satın alınan filmler, her gün güncellenir." href="/filmler" />
      </div>
      <div className="dark hx-filmstrip py-6 text-foreground">
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <ScrollRow label="Haftanın ilk 10 filmi">
            {top.map((f, i) => (
              <Link key={f.id} href={`/film/${f.id}`} className="group relative flex shrink-0 snap-start items-end pl-14 sm:pl-20" aria-label={`${i + 1}. ${f.title}`}>
                <span className="top10-slice-numeral pointer-events-none absolute bottom-[-0.12em] left-0 select-none font-sans text-[8rem] font-black leading-none tracking-[-0.08em] sm:text-[10rem]" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="relative block w-[34vw] overflow-hidden rounded-md ring-1 ring-foreground/10 group-hover:ring-primary/60 transition duration-500 group-hover:-translate-y-1.5 sm:w-[170px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.poster || '/placeholder.svg'} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-scrim via-scrim/70 to-transparent p-3 pt-10">
                    <span className="line-clamp-2 text-xs font-semibold leading-snug">{f.title}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/60">{f.genreTr}</span>
                  </span>
                </span>
              </Link>
            ))}
          </ScrollRow>
        </div>
      </div>
    </section>
  )
}
