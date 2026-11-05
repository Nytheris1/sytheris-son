import Link from 'next/link'
import { Play } from 'lucide-react'
import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'

export function OnSiteRow({ catalog }: { catalog: { animeId: number; title: string; cover?: string | null; count: number }[] }) {
  if (!catalog.length) return null
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10">
      <SectionHeading eyebrow="Sytheris oynatıcı" title="Sytheris'te" accent="şimdi izle" description="Türkçe altyazılı, doğrudan sitede izleyebileceğin bölümler." />
      <ScrollRow label="Sytheris'te şimdi izle">
        {catalog.map((c) => (
          <Link key={c.animeId} href={`/anime/${c.animeId}/izle/1`} className="group/w flex w-[42vw] shrink-0 snap-start flex-col gap-3 sm:w-[190px] lg:w-[208px]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.cover || '/placeholder.svg'} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover/w:scale-105" />
              <span className="absolute inset-0 grid place-items-center bg-scrim/0 transition group-hover/w:bg-scrim/40">
                <span className="grid size-14 scale-75 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition group-hover/w:scale-100 group-hover/w:opacity-100">
                  <Play className="ml-0.5 size-5 fill-current" />
                </span>
              </span>
              <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-primary-foreground">{c.count} bölüm</span>
            </div>
            <p className="line-clamp-2 text-[15px] font-medium leading-snug group-hover/w:text-ink">{c.title}</p>
          </Link>
        ))}
      </ScrollRow>
    </section>
  )
}
