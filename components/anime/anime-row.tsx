import type { MediaCard } from '@/lib/anilist-types'
import { AnimeCard } from './anime-card'
import { ScrollRow } from './scroll-row'
import { SectionHeading } from './section-heading'

export function AnimeRow({
  eyebrow,
  title,
  accent,
  description,
  href,
  items,
}: {
  eyebrow?: string
  title: string
  accent?: string
  description?: string
  href?: string
  items: MediaCard[]
}) {
  if (!items.length) return null
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10">
      <SectionHeading eyebrow={eyebrow} title={title} accent={accent} description={description} href={href} />
      <ScrollRow label={`${title} ${accent ?? ''}`}>
        {items.map((m) => (
          <AnimeCard key={m.id} media={m} className="w-[42vw] shrink-0 snap-start sm:w-[190px] lg:w-[208px]" />
        ))}
      </ScrollRow>
    </section>
  )
}
