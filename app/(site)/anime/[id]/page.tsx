import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Clock, Play, Star, Tv, AlertCircle } from 'lucide-react'
import { getAnime } from '@/lib/anilist'
import type { MediaCard } from '@/lib/anilist-types'
import { compact, formatTr, fuzzyDate, genreTr, pickTitle, relationTr, roleTr, seasonTr, splitTitle, statusTr, stripHtml, timeUntil } from '@/lib/format'
import { listEpisodes } from '@/lib/site'
import { getCurrentUser } from '@/lib/users'
import { AnimeCard } from '@/components/anime/anime-card'
import { DetailBackdrop } from '@/components/anime/detail-backdrop'
import { ExpandableText } from '@/components/anime/expandable-text'
import { FavoriteButton } from '@/components/anime/favorite-button'
import { ScrollRow } from '@/components/anime/scroll-row'
import { SectionHeading } from '@/components/anime/section-heading'
import { TrailerButton } from '@/components/anime/trailer-button'

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
  
  // Veri çekilemezse bile boş obje ile devam et
  const [media, episodes, user] = await Promise.all([
    getAnime(animeId).catch(() => null), 
    listEpisodes(animeId).catch(() => []), 
    getCurrentUser()
  ])

  const title = media ? pickTitle(media.title) : 'Anime'
  const { head, tail } = media ? splitTitle(title) : { head: '', tail: title }
  const trailerId = media?.trailer?.site === 'youtube' ? media.trailer.id : null
  const studio = media?.studios?.nodes.find((s) => s.isAnimationStudio) ?? media?.studios?.nodes[0]
  const recs = (media?.recommendations?.nodes ?? []).map((n) => n.mediaRecommendation).filter((m): m is MediaCard => Boolean(m))
  const relations = (media?.relations?.edges ?? []).filter((e) => e.node.type === 'ANIME')
  
  const scoreDist = media?.stats?.scoreDistribution?.filter((s) => s.amount > 0) ?? []
  const maxScore = Math.max(1, ...scoreDist.map((s) => s.amount))
  
  const streaming = (media?.externalLinks ?? []).filter((l) => l.type === 'STREAMING')
  const rankTop = media?.rankings?.find((r) => r.allTime && r.type === 'RATED')
  const rankPop = media?.rankings?.find((r) => r.allTime && r.type === 'POPULAR')

  const info: [string, string | null | undefined][] = [
    ['Format', formatTr(media?.format)],
    ['Bölüm', media?.episodes ? `${media.episodes}` : media?.nextAiringEpisode ? `${media.nextAiringEpisode.episode - 1}+` : null],
    ['Süre', media?.duration ? `${media.duration} dk` : null],
    ['Durum', statusTr(media?.status)],
    ['Başlangıç', fuzzyDate(media?.startDate)],
    ['Bitiş', fuzzyDate(media?.endDate)],
    ['Sezon', media?.season ? `${seasonTr(media.season)} ${media.seasonYear ?? ''}` : null],
    ['Stüdyo', studio?.name],
    ['Kaynak', media?.source ? media.source.replace(/_/g, ' ').toLowerCase() : null],
    ['Japonca', media?.title?.native],
  ]

  return (
    <div className="flex flex-col gap-20 pb-10">
      <section className="dark relative isolate overflow-hidden bg-scrim text-foreground">
        {media && <DetailBackdrop media={media} />}
        <div className="mx-auto grid max-w-[1440px] items-end gap-8 px-4 pb-20 pt-16 sm:px-6 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] lg:gap-14 lg:px-10 lg:pb-28 lg:pt-28">
          <div className="relative mx-auto w-44 sm:w-56 md:mx-0 md:w-full">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] opacity-60 blur-3xl" style={{ background: media?.coverImage?.color ?? 'var(--primary)' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media?.coverImage?.extraLarge || media?.coverImage?.large || '/placeholder.svg'} alt={title} className="aspect-[2/3] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-foreground/10" />
          </div>
          <div className="flex flex-col gap-6">
            <p className="label-mono flex items-center gap-3 text-ink">
              <span className="h-px w-10 bg-primary" />
              {[formatTr(media?.format), media?.seasonYear].filter(Boolean).join(' · ')}
              {media?.status === 'RELEASING' && <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] text-primary-foreground">Yayında</span>}
            </p>
            <div>
              <h1 className="text-balance text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                {head} <span className="font-serif font-normal italic tracking-[-0.01em] text-primary">{tail}</span>
              </h1>
              {media?.title?.native && <p className="mt-3 text-lg text-foreground/50">{media.title.native}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {media?.averageScore ? (
                <span className="flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 font-mono text-sm font-semibold text-primary-foreground">
                  <Star className="size-4 fill-current" />
                  {media.averageScore}%
                </span>
              ) : null}
              {media?.episodes ? (
                <span className="flex items-center gap-1.5 text-sm text-foreground/75">
                  <Tv className="size-4" /> {media.episodes} bölüm
                </span>
              ) : null}
              {media?.duration ? (
                <span className="flex items-center gap-1.5 text-sm text-foreground/75">
                  <Clock className="size-4" /> {media.duration} dk
                </span>
              ) : null}
              {media?.genres?.map((g) => (
                <Link key={g} href={`/ara?genre=${encodeURIComponent(g)}`} className="rounded-full border border-foreground/20 px-3 py-1 text-sm text-foreground/85 backdrop-blur transition hover:border-primary hover:text-primary">
                  {genreTr(g)}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {episodes.length > 0 ? (
                <Link href={`/anime/${animeId}/izle/${episodes[0].number}`} className="flex h-13 items-center gap-2.5 rounded-full bg-primary px-7 font-medium text-primary-foreground shadow-[0_10px_40px_-10px_var(--primary)] transition hover:brightness-110">
                  <Play className="size-4 fill-current" />
                  {episodes[0].number}. bölümü izle
                </Link>
              ) : (
                <span className="flex h-13 items-center gap-2 rounded-full border border-border px-6 text-sm text-muted-foreground">
                  Henüz bölüm yok
                </span>
              )}
              {trailerId && <TrailerButton videoId={trailerId} title={title} poster={media?.bannerImage} />}
              <FavoriteButton animeId={animeId} initial={Boolean(user?.favorites.includes(animeId))} loggedIn={Boolean(user)} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1440px] gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-10">
        <div className="flex min-w-0 flex-col gap-16">
          <section className="flex flex-col gap-5">
            <SectionHeading eyebrow="Özet" title="Hikâye" accent="hakkında" />
            <ExpandableText text={stripHtml(media?.description)} />
          </section>

          {episodes.length > 0 && (
            <section className="flex flex-col gap-5">
              <SectionHeading eyebrow="Sytheris oynatıcı" title="Bölümler" accent="izle" description="Türkçe altyazılı bölümler doğrudan sitede." />
              <ul className="grid gap-3 sm:grid-cols-2">
                {episodes.map((ep) => (
                  <li key={ep.id}>
                    <Link href={`/anime/${animeId}/izle/${ep.number}`} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition hover:border-primary">
                      <span className="relative grid aspect-video w-32 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ep.thumbnail || media?.bannerImage || media?.coverImage?.large || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover" />
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
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <dl className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card px-5">
            {info.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="text-right text-sm font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  )
}