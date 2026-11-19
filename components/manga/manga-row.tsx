import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'
import type { MangaCard as Manga } from '@/lib/manga'
import { MangaCard } from './manga-card'

export function MangaRow({ eyebrow, title, accent, description, href, items }: { eyebrow: string; title: string; accent?: string; description?: string; href?: string; items: Manga[] }) {
  if (!items.length) return null
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-10">
      <SectionHeading eyebrow={eyebrow} title={title} accent={accent} description={description} href={href} />
      <ScrollRow label={`${title} ${accent ?? ''}`}>
        {items.map((m) => (
          <MangaCard key={m.id} manga={m} className="w-[38vw] shrink-0 snap-start sm:w-[170px] lg:w-[184px]" />
        ))}
      </ScrollRow>
    </section>
  )
}
