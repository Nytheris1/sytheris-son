import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Captions, Play } from 'lucide-react'
import { getAnimeMeta } from '@/lib/anilist'
import { pickTitle } from '@/lib/format'
import { listEpisodes } from '@/lib/site'
import { cn } from '@/lib/utils'
import { VideoPlayer } from '@/components/player/video-player'

type Props = { params: Promise<{ id: string; ep: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, ep } = await params
  const media = await getAnimeMeta(Number(id))
  return { title: media ? `${pickTitle(media.title)} ${ep}. Bölüm izle` : 'Bölüm izle' }
}

export default async function WatchPage({ params }: Props) {
  const { id, ep } = await params
  const animeId = Number(id)
  const number = Number(ep)
  const [media, episodes] = await Promise.all([getAnimeMeta(animeId), listEpisodes(animeId).catch(() => [])])
  const index = episodes.findIndex((e) => e.number === number)
  const current = episodes[index]
  const title = media ? pickTitle(media.title) : 'Anime'

  if (!current) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
        <p className="label-mono text-ink">Bölüm yok</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Bu bölüm henüz <span className="accent-serif">eklenmedi</span>
        </h1>
        <p className="leading-relaxed text-muted-foreground">Yöneticiler bölümü eklediğinde burada izleyebileceksin.</p>
        <Link href={`/anime/${animeId}`} className="mt-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">
          Anime sayfasına dön
        </Link>
      </div>
    )
  }

  const prev = episodes[index - 1]
  const next = episodes[index + 1]
  const subtitleSrc = current.subtitleText || current.subtitleUrl ? `/api/subtitle/${current.id}` : null

  return (
    <div className="mx-auto grid max-w-[1440px] gap-8 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-10">
      <div className="flex min-w-0 flex-col gap-5">
        <Link href={`/anime/${animeId}`} className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> {title}
        </Link>
        <VideoPlayer
          key={current.id}
          src={current.videoUrl}
          subtitleSrc={subtitleSrc}
          subtitleLang={current.subtitleLang}
          poster={current.thumbnail || media?.bannerImage}
          title={current.title || `${current.number}. bölüm`}
          episodeLabel={`${title} · Bölüm ${current.number}`}
          storageKey={current.id}
          prevHref={prev ? `/anime/${animeId}/izle/${prev.number}` : null}
          nextHref={next ? `/anime/${animeId}/izle/${next.number}` : null}
        />
        <div className="flex flex-col gap-2">
          <p className="label-mono text-ink">Bölüm {current.number}</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {title} <span className="accent-serif">{current.title || `${current.number}. bölüm`}</span>
          </h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Captions className="size-4" />
            {subtitleSrc ? `${current.subtitleLang.toUpperCase()} altyazı mevcut — C tuşuyla aç/kapat` : 'Bu bölümde altyazı yok'}
          </p>
          <p className="text-xs text-muted-foreground">Kısayollar: Boşluk / K oynat · J / L 10 sn · F tam ekran · M sessiz</p>
        </div>
      </div>
      <aside className="flex flex-col gap-3 lg:pt-10">
        <p className="label-mono text-muted-foreground">Bölümler ({episodes.length})</p>
        <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
          {episodes.map((e) => {
            const active = e.id === current.id
            return (
              <li key={e.id}>
                <Link
                  href={`/anime/${animeId}/izle/${e.number}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex items-center gap-3 rounded-2xl border p-2 transition', active ? 'border-primary bg-accent' : 'border-border bg-card hover:border-primary/50')}
                >
                  <span className="relative grid aspect-video w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.thumbnail || media?.bannerImage || media?.coverImage.large || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover" />
                    {active && (
                      <span className="relative grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Play className="ml-0.5 size-3.5 fill-current" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="label-mono text-[9px] text-ink">Bölüm {e.number}</span>
                    <span className="block truncate text-sm font-medium">{e.title || `${e.number}. bölüm`}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}
