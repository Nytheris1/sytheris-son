import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Play } from 'lucide-react'
import { getAnime } from '@/lib/anilist'
import type { MediaCard } from '@/lib/anilist-types'
import { listComments } from '@/lib/community'
import { toCommentViews } from '@/lib/comment-views'
import { formatTr, fuzzyDate, pickTitle, relationTr, seasonTr, statusTr, stripHtml } from '@/lib/format'
import { statusOf } from '@/lib/library'
import { listEpisodes } from '@/lib/site'
import { aniEpisodes } from '@/lib/anime-source'
import { getViewer } from '@/lib/viewer'
import { AnimeCard } from '@/components/anime/anime-card'
import { DetailBackdrop } from '@/components/anime/detail-backdrop'
import { FavoriteButton } from '@/components/anime/favorite-button'
import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'
import { TrailerButton } from '@/components/anime/trailer-button'
import { DetailHero } from '@/components/anime/detail/detail-hero'
import { Synopsis } from '@/components/anime/detail/synopsis'
import { translate } from '@/lib/translate'
import { LibraryButton } from '@/components/anime/detail/library-button'
import { SectionNav } from '@/components/anime/detail/section-nav'
import { CharactersGrid } from '@/components/anime/detail/characters-grid'
import { StatsPanel } from '@/components/anime/detail/stats-panel'
import { Comments } from '@/components/anime/detail/comments'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const media = await getAnime(Number(id))
  if (!media) return { title: 'Anime bulunamadı' }
  const title = pickTitle(media.title)
  const description = stripHtml(media.description).slice(0, 180)
  return {
    title,
    description,
    openGraph: { title: `${title} — SYTHERIS`, description, type: 'video.tv_show' },
    twitter: { card: 'summary_large_image', title: `${title} — SYTHERIS`, description },
  }
}

export default async function AnimePage({ params }: Props) {
  const { id } = await params
  const animeId = Number(id)
  if (!Number.isInteger(animeId) || animeId <= 0) notFound()

  const [media, episodes, viewer, rawComments] = await Promise.all([
    getAnime(animeId).catch(() => null),
    listEpisodes(animeId).catch(() => []),
    getViewer().catch(() => null),
    listComments(animeId).catch(() => []),
  ])
  if (!media) notFound()

  const comments = await toCommentViews(rawComments, viewer?.user.id ?? null)
  const title = pickTitle(media.title)
  const trailerId = media.trailer?.site === 'youtube' ? media.trailer.id : null
  const studio = media.studios?.nodes.find((s) => s.isAnimationStudio) ?? media.studios?.nodes[0]
  const recs = (media.recommendations?.nodes ?? []).map((n) => n.mediaRecommendation).filter((m): m is MediaCard => Boolean(m))
  const relations = (media.relations?.edges ?? []).filter((e) => e.node.type === 'ANIME')
  const characters = media.characters?.edges ?? []
  const tags = (media.tags ?? []).filter((t) => !t.isMediaSpoiler).slice(0, 12)
  const streaming = (media.externalLinks ?? []).filter((l) => l.type === 'STREAMING')
  const links = (media.externalLinks ?? []).filter((l) => l.type !== 'STREAMING').slice(0, 8)
  const synopsis = stripHtml(media.description)
  const synopsisTr = synopsis ? await Promise.race([translate(synopsis, 'tr'), new Promise<null>((r) => setTimeout(() => r(null), 1800))]) : null

  const info: [string, string | null | undefined][] = [
    ['Format', formatTr(media.format)],
    ['Durum', statusTr(media.status)],
    ['Başlangıç', fuzzyDate(media.startDate)],
    ['Bitiş', fuzzyDate(media.endDate)],
    ['Sezon', media.season ? `${seasonTr(media.season)} ${media.seasonYear ?? ''}` : null],
    ['Stüdyo', studio?.name],
    ['Kaynak', media.source ? media.source.replace(/_/g, ' ').toLowerCase() : null],
    ['Ülke', media.countryOfOrigin === 'JP' ? 'Japonya' : media.countryOfOrigin === 'CN' ? 'Çin' : media.countryOfOrigin === 'KR' ? 'Kore' : media.countryOfOrigin],
    ['Japonca', media.title.native],
    ['Diğer adlar', media.synonyms?.slice(0, 2).join(', ')],
  ]

  const episodeList = episodes.length ? episodes : await aniEpisodes(animeId, (media as { episodes?: number | null } | null)?.episodes ?? 0)

  const sections = [
    { id: 'genel', label: 'Genel bakış' },
    { id: 'bolumler', label: 'Bölümler', count: episodeList.length },
    ...(characters.length ? [{ id: 'karakterler', label: 'Karakterler', count: characters.length }] : []),
    ...(relations.length ? [{ id: 'iliskili', label: 'Evren', count: relations.length }] : []),
    { id: 'istatistik', label: 'İstatistik' },
    ...(recs.length ? [{ id: 'oneriler', label: 'Benzerleri' }] : []),
    { id: 'yorumlar', label: 'Yorumlar', count: comments.length },
  ]

  const customLists = (viewer?.lists ?? []).filter((l) => !l.system).map((l) => ({ id: l.id, name: l.name, hue: l.hue, has: l.items.some((i) => i.id === animeId) }))

  return (
    <div className="flex flex-col gap-16 pb-10">
      <section className="dark relative isolate overflow-hidden bg-scrim text-foreground">
        <DetailBackdrop media={media} />
        <DetailHero
          media={media}
          firstEpisode={episodes[0]?.number ?? null}
          actions={
            <>
              {trailerId && <TrailerButton videoId={trailerId} title={title} poster={media.bannerImage} />}
              <LibraryButton animeId={animeId} loggedIn={Boolean(viewer)} initialStatus={viewer ? statusOf(viewer.lists, animeId) : null} customLists={customLists} />
              <FavoriteButton animeId={animeId} initial={Boolean(viewer?.user.favorites.includes(animeId))} loggedIn={Boolean(viewer)} />
            </>
          }
        />
      </section>

      <SectionNav sections={sections} title={title} />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-24 px-4 sm:px-6 lg:px-10">
        <section id="genel" className="grid scroll-mt-36 gap-12 lg:grid-cols-[1fr_340px]">
          <div className="flex min-w-0 flex-col gap-10">
            <div className="flex flex-col gap-5">
              <SectionHeading eyebrow="Özet" title="Hikâye" accent="hakkında" />
              <Synopsis id={media.id} original={synopsis} initialTr={synopsisTr} />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="label-mono text-muted-foreground">Etiketler</p>
                <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {tags.map((t) => (
                    <li key={t.id} className="relative overflow-hidden rounded-xl border border-border bg-card px-4 py-2.5">
                      <span className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${t.rank}%` }} aria-hidden="true" />
                      <span className="relative flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{t.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{t.rank}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {streaming.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="label-mono text-muted-foreground">Resmî yayın platformları</p>
                <div className="flex flex-wrap gap-2">
                  {streaming.map((l) => (
                    <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:border-primary">
                      <span className="size-2 rounded-full" style={{ background: l.color ?? 'var(--primary)' }} />
                      {l.site}
                      <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-36 lg:self-start">
            <dl className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card px-5">
              {info
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="shrink-0 text-sm text-muted-foreground">{k}</dt>
                    <dd className={`text-right text-sm font-medium ${k === 'Japonca' ? 'font-jp' : 'capitalize'}`}>{v}</dd>
                  </div>
                ))}
            </dl>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {links.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground">
                    {l.site}
                  </a>
                ))}
              </div>
            )}
          </aside>
        </section>

        {(episodes.length > 0 || ((media as { episodes?: number | null } | null)?.episodes ?? 0) > 0) && (
          <section id="bolumler" className="flex scroll-mt-36 flex-col gap-6">
            <SectionHeading eyebrow="Sytheris oynatıcı" title="Bölümler" accent="izle" description="Türkçe altyazılı bölümler doğrudan sitede." />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {episodeList.map((ep) => (
                <li key={ep.id}>
                  <Link href={`/anime/${animeId}/izle/${ep.number}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary">
                    <span className="relative grid aspect-video w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ep.thumbnail || media.bannerImage || media.coverImage.large || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-110" />
                      <span className="relative grid size-9 place-items-center rounded-full bg-primary text-primary-foreground opacity-90 transition group-hover:scale-110">
                        <Play className="ml-0.5 size-4 fill-current" />
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="label-mono text-[10px] text-ink">Bölüm {ep.number}</span>
                      <span className="mt-1 block truncate font-medium">{ep.title || `${ep.number}. bölüm`}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {characters.length > 0 && (
          <section id="karakterler" className="flex scroll-mt-36 flex-col gap-6">
            <SectionHeading eyebrow="Kadro" title="Karakterler ve" accent="sesleri" />
            <CharactersGrid edges={characters} />
          </section>
        )}

        {relations.length > 0 && (
          <section id="iliskili" className="flex scroll-mt-36 flex-col gap-6">
            <SectionHeading eyebrow="Evren" title="Bağlantılı" accent="yapımlar" description="Devam filmleri, öncesi, yan hikâyeler ve uyarlamalar." />
            <ScrollRow label="Bağlantılı yapımlar">
              {relations.map((r) => (
                <AnimeCard key={`${r.relationType}-${r.node.id}`} media={r.node} badge={relationTr(r.relationType)} className="w-[150px] shrink-0 snap-start sm:w-[180px]" />
              ))}
            </ScrollRow>
          </section>
        )}

        <section id="istatistik" className="flex scroll-mt-36 flex-col gap-6">
          <SectionHeading eyebrow="Veri" title="Topluluk" accent="istatistikleri" />
          <StatsPanel media={media} />
        </section>

        {recs.length > 0 && (
          <section id="oneriler" className="flex scroll-mt-36 flex-col gap-6">
            <SectionHeading eyebrow="Öneriler" title="Bunu sevdiysen" accent="bunlar da var" />
            <ScrollRow label="Benzer animeler">
              {recs.map((m) => (
                <AnimeCard key={m.id} media={m} className="w-[150px] shrink-0 snap-start sm:w-[180px]" />
              ))}
            </ScrollRow>
          </section>
        )}

        <section id="yorumlar" className="flex scroll-mt-36 flex-col gap-6">
          <SectionHeading eyebrow="Topluluk" title="Yorumlar ve" accent="tartışma" description="Saygılı ol, spoiler’ları işaretlemeyi unutma." />
          <Comments
            animeId={animeId}
            animeTitle={title}
            comments={comments}
            viewer={viewer ? { displayName: viewer.header.displayName, avatar: viewer.header.avatar, frame: viewer.header.frame, nameStyle: viewer.header.nameStyle, commentColor: viewer.header.commentColor } : null}
          />
        </section>
      </div>
    </div>
  )
}
