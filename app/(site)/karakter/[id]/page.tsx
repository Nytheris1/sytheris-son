import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heart } from 'lucide-react'
import { getCharacter } from '@/lib/anilist'
import { compact, fuzzyDate, pickTitle, roleTr, splitTitle, stripHtml } from '@/lib/format'
import { ExpandableText } from '@/components/anime/expandable-text'
import { SectionHeading } from '@/components/anime/section-heading'
import { PersonHero } from '@/components/anime/person-hero'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const c = await getCharacter(Number(id))
  if (!c) return { title: 'Karakter bulunamadı' }
  return { title: c.name.full, description: stripHtml(c.description).slice(0, 160), openGraph: { images: c.image.large ? [c.image.large] : [] } }
}

const GENDER: Record<string, string> = { Male: 'Erkek', Female: 'Kadın', 'Non-binary': 'Non-binary' }

export default async function CharacterPage({ params }: Props) {
  const { id } = await params
  const c = await getCharacter(Number(id))
  if (!c) notFound()
  const { head, tail } = splitTitle(c.name.full)
  const vaMap = new Map<number, { id: number; name: { full: string }; image: { large?: string | null }; languageV2?: string }>()
  c.media.edges.forEach((e) => e.voiceActors.forEach((v) => vaMap.set(v.id, v)))
  const voiceActors = [...vaMap.values()].slice(0, 8)
  const facts: [string, string | null | undefined][] = [
    ['Cinsiyet', c.gender ? (GENDER[c.gender] ?? c.gender) : null],
    ['Yaş', c.age],
    ['Doğum günü', fuzzyDate(c.dateOfBirth)],
    ['Kan grubu', c.bloodType],
    ['Japonca', c.name.native],
  ]

  return (
    <div className="flex flex-col gap-16 pb-10">
      <PersonHero image={c.image.large} label="Karakter" head={head} tail={tail} sub={c.name.native ?? c.name.alternative?.join(' · ')}>
        <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 font-mono text-sm text-primary-foreground">
          <Heart className="size-4 fill-current" /> {compact(c.favourites)} favori
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
        <section className="flex max-w-3xl flex-col gap-5">
          <SectionHeading eyebrow="Biyografi" title="Karakter" accent="hakkında" />
          <ExpandableText text={stripHtml(c.description)} lines={8} />
        </section>

        {voiceActors.length > 0 && (
          <section className="flex flex-col gap-5">
            <SectionHeading eyebrow="Ses" title="Seslendiren" accent="sanatçılar" />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {voiceActors.map((v) => (
                <li key={v.id}>
                  <Link href={`/seslendirmen/${v.id}`} className="group flex flex-col gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.image.large || '/placeholder.svg'} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-2xl object-cover ring-1 ring-border transition group-hover:-translate-y-1" />
                    <span className="truncate text-sm font-medium group-hover:text-ink">{v.name.full}</span>
                    <span className="-mt-2 text-xs text-muted-foreground">{v.languageV2}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-5">
          <SectionHeading eyebrow="Filmografi" title="Yer aldığı" accent="animeler" />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {c.media.edges.map((e) => (
              <li key={e.node.id}>
                <Link href={`/anime/${e.node.id}`} className="group flex flex-col gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.node.coverImage.extraLarge || e.node.coverImage.large || '/placeholder.svg'} alt="" loading="lazy" className="aspect-[2/3] w-full rounded-2xl object-cover ring-1 ring-border transition group-hover:-translate-y-1 group-hover:shadow-xl" />
                  <span className="label-mono text-[9px] text-ink">{roleTr(e.characterRole)}</span>
                  <span className="line-clamp-2 text-sm font-medium group-hover:text-ink">{pickTitle(e.node.title)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
