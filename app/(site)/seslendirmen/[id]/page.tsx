import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heart } from 'lucide-react'
import { getStaff } from '@/lib/anilist'
import { compact, fuzzyDate, pickTitle, roleTr, splitTitle, stripHtml } from '@/lib/format'
import { ExpandableText } from '@/components/anime/expandable-text'
import { SectionHeading } from '@/components/anime/section-heading'
import { PersonHero } from '@/components/anime/person-hero'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const s = await getStaff(Number(id))
  if (!s) return { title: 'Kişi bulunamadı' }
  return { title: `${s.name.full} — Seslendirmen`, description: stripHtml(s.description).slice(0, 160), openGraph: { images: s.image.large ? [s.image.large] : [] } }
}

export default async function StaffPage({ params }: Props) {
  const { id } = await params
  const s = await getStaff(Number(id))
  if (!s) notFound()
  const { head, tail } = splitTitle(s.name.full)
  const roles = s.characterMedia.edges.flatMap((e) => e.characters.map((c) => ({ character: c, media: e.node, role: e.characterRole })))
  const seen = new Set<number>()
  const uniqueRoles = roles.filter((r) => (seen.has(r.character.id) ? false : (seen.add(r.character.id), true)))
  const facts: [string, string | null | undefined][] = [
    ['Meslek', s.primaryOccupations?.join(', ')],
    ['Dil', s.languageV2],
    ['Doğum', fuzzyDate(s.dateOfBirth)],
    ['Yaş', s.age ? String(s.age) : null],
    ['Memleket', s.homeTown],
    ['Aktif', s.yearsActive?.length ? `${s.yearsActive[0]}–${s.yearsActive[1] ?? 'günümüz'}` : null],
  ]

  return (
    <div className="flex flex-col gap-16 pb-10">
      <PersonHero image={s.image.large} label="Seslendirmen" head={head} tail={tail} sub={s.name.native}>
        <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 font-mono text-sm text-primary-foreground">
          <Heart className="size-4 fill-current" /> {compact(s.favourites)} favori
        </span>
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <span key={k} className="rounded-full border border-foreground/20 px-3 py-1.5 text-sm text-foreground/85">
              <span className="text-foreground/50">{k}:</span> {v}
            </span>
          ))}
      </PersonHero>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-4 sm:px-6 lg:px-10">
        {s.description && (
          <section className="flex max-w-3xl flex-col gap-5">
            <SectionHeading eyebrow="Biyografi" title="Sanatçı" accent="hakkında" />
            <ExpandableText text={stripHtml(s.description)} lines={8} />
          </section>
        )}
        <section className="flex flex-col gap-5">
          <SectionHeading eyebrow={`${uniqueRoles.length} rol`} title="Seslendirdiği" accent="karakterler" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueRoles.map((r) => (
              <li key={`${r.character.id}-${r.media.id}`} className="flex overflow-hidden rounded-2xl border border-border bg-card">
                <Link href={`/karakter/${r.character.id}`} className="group flex min-w-0 flex-1 items-center gap-3 p-2 transition hover:bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.character.image.large || '/placeholder.svg'} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium group-hover:text-ink">{r.character.name.full}</span>
                    <span className="block text-xs text-muted-foreground">{roleTr(r.role)}</span>
                  </span>
                </Link>
                <Link href={`/anime/${r.media.id}`} className="group flex w-2/5 min-w-0 items-center justify-end gap-3 border-l border-border p-2 text-right transition hover:bg-muted">
                  <span className="line-clamp-2 text-xs font-medium group-hover:text-ink">{pickTitle(r.media.title)}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.media.coverImage.large || '/placeholder.svg'} alt="" loading="lazy" className="h-20 w-14 shrink-0 rounded-lg object-cover" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
