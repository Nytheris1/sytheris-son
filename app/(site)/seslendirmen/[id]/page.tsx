import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStaff } from '@/lib/anilist'
import { fuzzyDate, pickTitle, stripHtml } from '@/lib/format'
import { artSrc, getFullBody } from '@/lib/fullbody'
import { ExpandableText } from '@/components/anime/expandable-text'
import { CharacterShowcase } from '@/components/character/character-showcase'
import { TaggedHeading } from '@/components/character/tagged-heading'
import { RoleGallery, type Role } from '@/components/person/role-gallery'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const s = await getStaff(Number(id))
  if (!s) return { title: 'Kişi bulunamadı' }
  return { title: `${s.name.full} — Seslendirmen`, description: stripHtml(s.description).slice(0, 160), openGraph: { images: s.image.large ? [s.image.large] : [] } }
}

const LANG: Record<string, string> = { Japanese: 'Japonca', English: 'İngilizce', Korean: 'Korece', Turkish: 'Türkçe', Spanish: 'İspanyolca', German: 'Almanca', French: 'Fransızca', Italian: 'İtalyanca', Portuguese: 'Portekizce' }
const JOBS: Record<string, string> = { 'Voice Actor': 'Seslendirme sanatçısı', Actor: 'Oyuncu', Singer: 'Şarkıcı', Narrator: 'Anlatıcı' }

const SECTIONS = [
  { id: 'karakter-ust', label: 'Giriş' },
  { id: 'roller', label: 'Roller' },
  { id: 'biyografi', label: 'Biyografi' },
]

export default async function StaffPage({ params }: Props) {
  const { id } = await params
  const s = await getStaff(Number(id))
  if (!s) notFound()

  const seen = new Set<string>()
  const roles: Role[] = []
  for (const e of s.characterMedia.edges) {
    for (const c of e.characters) {
      const key = `${c.id}-${e.node.id}`
      if (seen.has(key)) continue
      seen.add(key)
      roles.push({
        characterId: c.id,
        characterName: c.name.full,
        characterImage: c.image.large,
        mediaId: e.node.id,
        mediaTitle: pickTitle(e.node.title),
        mediaCover: e.node.coverImage.large ?? e.node.coverImage.extraLarge,
        mediaColor: e.node.coverImage.color ?? null,
        series: [e.node.title.romaji, e.node.title.english].filter((t): t is string => Boolean(t)),
        year: e.node.seasonYear,
        role: e.characterRole,
      })
    }
  }
  roles.sort((a, b) => Number(b.role === 'MAIN') - Number(a.role === 'MAIN'))
  const mainCount = roles.filter((r) => r.role === 'MAIN').length
  const animeCount = new Set(roles.map((r) => r.mediaId)).size
  const signature = roles[0]
  const standeeArt = signature ? await getFullBody(signature.characterName, signature.series).catch(() => null) : null

  const facts: [string, string][] = (
    [
      ['Meslek', s.primaryOccupations?.map((o) => JOBS[o] ?? o).join(', ')],
      ['Dil', s.languageV2 ? (LANG[s.languageV2] ?? s.languageV2) : null],
      ['Doğum', fuzzyDate(s.dateOfBirth)],
      ['Yaş', s.age ? String(s.age) : null],
      ['Memleket', s.homeTown],
      ['Aktif', s.yearsActive?.length ? `${s.yearsActive[0]}–${s.yearsActive[1] ?? 'günümüz'}` : null],
      ['Rol', String(roles.length)],
      ['Başrol', String(mainCount)],
    ] as [string, string | null | undefined][]
  ).filter((f): f is [string, string] => Boolean(f[1]))

  const bio = stripHtml(s.description)
  const subtitle = [s.primaryOccupations?.[0] ? (JOBS[s.primaryOccupations[0]] ?? s.primaryOccupations[0]) : 'Seslendirmen', `${roles.length} rol`, `${animeCount} yapım`].join(' · ')

  return (
    <div className="flex flex-col gap-20 pb-20" style={signature?.mediaColor ? ({ ['--tone' as string]: signature.mediaColor } as React.CSSProperties) : undefined}>
      <CharacterShowcase
        name={s.name.full}
        native={s.name.native}
        subtitle={subtitle}
        bio={bio}
        favourites={s.favourites}
        art={s.image.large ? { src: s.image.large, transparent: false } : null}
        seriesTitle="Seslendirmen"
        seriesColor={signature?.mediaColor ?? null}
        primaryHref={signature ? `/karakter/${signature.characterId}` : undefined}
        primaryLabel={signature ? `${signature.characterName} rolü` : undefined}
        secondaryHref="#roller"
        secondaryLabel="Tüm roller"
        standee={signature ? { src: standeeArt ? artSrc(standeeArt) : (signature.characterImage ?? ''), transparent: Boolean(standeeArt?.transparent), label: `${signature.characterName} · ${signature.mediaTitle}` } : null}
        sections={SECTIONS}
      />

      {facts.length > 0 && (
        <dl className="mx-auto -mt-20 grid w-full max-w-[1440px] grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 bg-background px-5 py-5 sm:px-8 lg:px-12">
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{k}</dt>
              <dd className="truncate text-lg font-bold tracking-tight">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-24 px-5 sm:px-8 lg:px-12">
        {roles.length > 0 && (
          <section id="roller" aria-labelledby="roller-baslik" className="flex scroll-mt-24 flex-col gap-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <TaggedHeading id="roller-baslik" title="Hayat verdiği karakterler" tag="キャラクター" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {roles.length} rol · {animeCount} yapım
              </span>
            </div>
            <RoleGallery roles={roles} />
          </section>
        )}

        {bio && (
          <section id="biyografi" aria-labelledby="biyografi-baslik" className="grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <TaggedHeading id="biyografi-baslik" title="Biyografi" tag="プロフィール" />
            <ExpandableText text={bio} lines={8} className="max-w-3xl text-lg leading-relaxed text-muted-foreground" />
          </section>
        )}
      </div>
    </div>
  )
}
