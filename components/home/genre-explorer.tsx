import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { GENRE_LIST, genreTr } from '@/lib/format'
import { SectionHeading } from '@/components/anime/section-heading'

export function GenreExplorer() {
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 sm:px-6 lg:px-10">
      <SectionHeading eyebrow="Türler" title="Türe göre" accent="keşfet" description="Sevdiğin türe dokun, o türdeki en popüler animeler listelensin." href="/ara" hrefLabel="Gelişmiş arama" />
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {GENRE_LIST.map((g) => (
          <li key={g}>
            <Link
              href={`/ara?genre=${encodeURIComponent(g)}`}
              className="group relative flex h-20 items-end justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <span className="text-lg font-medium tracking-tight transition-all duration-300 group-hover:font-serif group-hover:text-xl group-hover:italic">{genreTr(g)}</span>
              <ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
