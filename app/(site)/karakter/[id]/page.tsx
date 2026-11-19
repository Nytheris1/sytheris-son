import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Mic2 } from 'lucide-react'
import { getCast, getCharacter } from '@/lib/anilist'
import { formatTr, fuzzyDate, pickTitle, roleTr, stripHtml } from '@/lib/format'
import { artSrc, getCharacterGallery, getFullBodies, proxied } from '@/lib/fullbody'
import { ExpandableText } from '@/components/anime/expandable-text'
import { CharacterShowcase, type ShowcaseArt } from '@/components/character/character-showcase'
import { CharacterSelect } from '@/components/character/character-select'
import { TaggedHeading } from '@/components/character/tagged-heading'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const c = await getCharacter(Number(id))
  if (!c) return { title: 'Karakter bulunamadı' }
  return { title: c.name.full, description: stripHtml(c.description).slice(0, 160), openGraph: { images: c.image.large ? [c.image.large] : [] } }
}

const GENDER: Record<string, string> = { Male: 'Erkek', Female: 'Kadın', 'Non-binary': 'Non-binary' }
const LANG: Record<string, string> = { Japanese: 'Japonca', English: 'İngilizce', Korean: 'Korece', Turkish: 'Türkçe', Spanish: 'İspanyolca', German: 'Almanca', French: 'Fransızca', Italian: 'İtalyanca', Portuguese: 'Portekizce' }
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

/** AniList descriptions often open with "__Height:__ 170cm" style fact lines; drop them since the hero shows facts. */
function cleanBio(raw?: string | null) {
  const body = (raw ?? '')
    // Spoiler blocks first, so a fact line inside one can't leave a dangling "~!" behind.
    .replace(/~![\s\S]*?!~/g, '')
    .replace(/~!|!~/g, '')
    .split('\n')
    .filter((l) => !/^\s*(__|\*\*)[^_*\n]{1,40}:?\s*(__|\*\*)\s*:?/.test(l))
    .join('\n')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[\s(])[_*]([^_*\n]+)[_*](?=[\s.,;:!?)]|$)/g, '$1$2')
  return stripHtml(body).replace(/\n{3,}/g, '\n\n').trim()
}

const SECTIONS = [
  { id: 'karakter-ust', label: 'Giriş' },
  { id: 'kadro', label: 'Kadro' },
  { id: 'biyografi', label: 'Biyografi' },
  { id: 'seslendirenler', label: 'Seslendirenler' },
  { id: 'yapimlar', label: 'Yapımlar' },
]

export default async function CharacterPage({ params }: Props) {
  const { id } = await params
  const c = await getCharacter(Number(id))
  if (!c) notFound()

  const vaMap = new Map<number, { id: number; name: { full: string }; image: { large?: string | null }; languageV2?: string }>()
  c.media.edges.forEach((e) => e.voiceActors.forEach((v) => vaMap.set(v.id, v)))
  const voiceActors = [...vaMap.values()].sort((a, b) => Number(b.languageV2 === 'Japanese') - Number(a.languageV2 === 'Japanese')).slice(0, 10)
  const featured = c.media.edges[0]
  const bio = cleanBio(c.description)
  const [lead, ...rest] = bio.split(/(?<=[.!?])\s+/)

  const birthday = fuzzyDate(c.dateOfBirth) ?? (c.dateOfBirth?.month ? `${c.dateOfBirth.day ?? ''} ${MONTHS[c.dateOfBirth.month - 1]}`.trim() : null)
  const facts = (
    [
      ['Cinsiyet', c.gender ? (GENDER[c.gender] ?? c.gender) : null],
      ['Yaş', c.age],
      ['Doğum günü', birthday],
      ['Kan grubu', c.bloodType],
    ] as [string, string | null | undefined][]
  ).filter((f): f is [string, string] => Boolean(f[1]))

  const seriesTitle = featured ? pickTitle(featured.node.title) : null
  const seriesNames = featured ? [featured.node.title.romaji, featured.node.title.english, featured.node.title.native].filter((t): t is string => Boolean(t)) : []
  const [poses, cast] = await Promise.all([getFullBodies(c.name.full, seriesNames, 2).catch(() => []), featured ? getCast(featured.node.id).catch(() => []) : Promise.resolve([])])
  const fanArt = poses[0] ? await getCharacterGallery(poses[0].tag, poses[0].url, 4).catch(() => []) : []

  const toArt = (p?: (typeof poses)[number]): ShowcaseArt | null => (p ? { src: artSrc(p), transparent: p.transparent } : null)
  const fallbackArt: ShowcaseArt | null = c.image.large ? { src: c.image.large, transparent: false } : null
  const heroArt = toArt(poses[0]) ?? fallbackArt
  const selectArt = toArt(poses[1]) ?? heroArt

  const castLinks = cast.map((m) => ({ id: m.node.id, name: m.node.name.full }))
  const position = castLinks.findIndex((m) => m.id === c.id)
  const inCast = position >= 0
  const roster = inCast ? castLinks : [{ id: c.id, name: c.name.full }, ...castLinks]
  const at = inCast ? position : 0
  const gallery = fanArt.length
    ? fanArt.map((u) => proxied(u))
    : c.media.edges
        .slice(0, 4)
        .map((e) => e.node.bannerImage || e.node.coverImage.extraLarge || '')
        .filter(Boolean)

  const subtitle = featured ? `${seriesTitle} serisinde ${roleTr(featured.characterRole).toLocaleLowerCase('tr')}` : 'Anime karakteri'
  const tone = featured?.node.coverImage.color ?? null

  return (
    <div className="flex flex-col gap-24 pb-20" style={tone ? ({ ['--tone' as string]: tone } as React.CSSProperties) : undefined}>
      <div>
        <CharacterShowcase
          name={c.name.full}
          native={c.name.native}
          subtitle={subtitle}
          bio={bio}
          favourites={c.favourites}
          art={heroArt}
          seriesTitle={seriesTitle}
          seriesColor={tone}
          primaryHref={featured ? `/anime/${featured.node.id}` : undefined}
          sections={SECTIONS}
        />
        <CharacterSelect
          name={c.name.full}
          native={c.name.native}
          art={selectArt}
          roleLabel={featured ? roleTr(featured.characterRole) : 'Karakter'}
          favourites={c.favourites ?? 0}
          index={at + 1}
          total={roster.length}
          prev={at > 0 ? roster[at - 1] : null}
          next={at < roster.length - 1 ? roster[at + 1] : null}
          cast={roster}
          currentId={c.id}
          gallery={gallery}
          primaryHref={featured ? `/anime/${featured.node.id}` : undefined}
          seriesTitle={seriesTitle}
        />
      </div>

      {facts.length > 0 && (
        <dl className="mx-auto -mt-12 grid w-full max-w-[1440px] grid-cols-2 gap-px border-y border-border bg-border px-0 sm:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 bg-background px-5 py-5 sm:px-8 lg:px-12">
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{k}</dt>
              <dd className="text-lg font-bold tracking-tight">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-24 px-5 sm:px-8 lg:px-12">
        <section id="biyografi" aria-labelledby="biyografi-baslik" className="grid scroll-mt-24 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <div className="flex flex-col gap-8">
            <TaggedHeading id="biyografi-baslik" title="Biyografi" tag="プロフィール" />
            {lead ? (
              <>
                <p className="max-w-2xl text-pretty font-serif text-3xl leading-snug sm:text-4xl">{lead}</p>
                {rest.length > 0 && <ExpandableText text={rest.join(' ')} lines={7} className="max-w-2xl leading-relaxed text-muted-foreground" />}
              </>
            ) : (
              <p className="text-muted-foreground">Bu karakter için henüz bir biyografi yok.</p>
            )}
          </div>

          {featured && (
            <Link href={`/anime/${featured.node.id}`} className="group flex flex-col gap-4">
              <span className="relative block overflow-hidden rounded-xl ring-1 ring-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.node.bannerImage || featured.node.coverImage.extraLarge || '/placeholder.svg'}
                  alt=""
                  className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 bg-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-background">En bilinen yapımı</span>
              </span>
              <span className="flex items-start justify-between gap-4">
                <span className="flex flex-col gap-1">
                  <span className="text-balance text-xl font-bold leading-tight tracking-tight">{pickTitle(featured.node.title)}</span>
                  <span className="text-sm text-muted-foreground">{[roleTr(featured.characterRole), formatTr(featured.node.format), featured.node.seasonYear].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-foreground/30 transition group-hover:rotate-45 group-hover:bg-foreground group-hover:text-background">
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          )}
        </section>

        {voiceActors.length > 0 && (
          <section id="seslendirenler" aria-labelledby="ses-baslik" className="flex scroll-mt-24 flex-col gap-10">
            <TaggedHeading id="ses-baslik" title="Seslendirenler" tag="キャスト" />
            <ul className="scrollbar-none -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-5">
              {voiceActors.map((v) => (
                <li key={v.id} className="w-44 shrink-0 snap-start sm:w-auto">
                  <Link href={`/seslendirmen/${v.id}`} className="group flex flex-col gap-3">
                    <span className="relative block overflow-hidden rounded-lg ring-1 ring-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.image.large || '/placeholder.svg'} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        <Mic2 className="size-3" aria-hidden="true" /> {v.languageV2 ? (LANG[v.languageV2] ?? v.languageV2) : 'Ses'}
                      </span>
                      <span className="text-pretty font-semibold leading-tight">{v.name.full}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="yapimlar" aria-labelledby="yapim-baslik" className="flex scroll-mt-24 flex-col gap-10">
          <div className="flex items-end justify-between gap-4">
            <TaggedHeading id="yapim-baslik" title="Yapımlar" tag="出演作品" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.media.edges.length} yapım</span>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {c.media.edges.map((e) => (
              <li key={e.node.id}>
                <Link href={`/anime/${e.node.id}`} className="group flex flex-col gap-3">
                  <span className="relative block overflow-hidden rounded-lg ring-1 ring-border transition duration-500 group-hover:-translate-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.node.coverImage.extraLarge || e.node.coverImage.large || '/placeholder.svg'} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover transition duration-700 group-hover:scale-105" />
                    <span className={`absolute left-2 top-2 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider ${e.characterRole === 'MAIN' ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'}`}>
                      {roleTr(e.characterRole)}
                    </span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="line-clamp-2 text-sm font-semibold leading-snug">{pickTitle(e.node.title)}</span>
                    <span className="text-xs text-muted-foreground">{[formatTr(e.node.format), e.node.seasonYear].filter(Boolean).join(' · ')}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
