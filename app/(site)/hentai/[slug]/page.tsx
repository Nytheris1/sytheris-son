import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Eye, Heart } from 'lucide-react'
import { getRelated, getVideo } from '@/lib/hanime/catalog'
import { compactNumber, plainDescription, shortDuration } from '@/lib/hanime/format'
import { HanimeCard } from '@/components/hentai/hanime-card'
import { HanimePlayer } from '@/components/hentai/hanime-player'
import { SectionHeading } from '@/components/anime/section-heading'

type Props = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const v = await getVideo(slug)
  if (!v) return { title: 'Bulunamadı' }
  return { title: `${v.name} — Hentai`, description: plainDescription(v.description).slice(0, 160), robots: { index: false } }
}

export default async function HanimeDetailPage({ params }: Props) {
  const { slug } = await params
  const video = await getVideo(slug)
  if (!video) notFound()

  const related = await getRelated(video)
  const external = `https://hanime.tv/videos/hentai/${video.slug}`
  const description = plainDescription(video.description)

  const facts: [string, string][] = [
    ['Stüdyo', video.brand ?? '—'],
    ['Süre', shortDuration(video.durationMs)],
    ['Sansür', video.censored ? 'Var' : 'Yok'],
    ['İzlenme', compactNumber(video.views)],
    ['Beğeni', compactNumber(video.likes)],
    ['Çıkış', video.releasedAt ? new Date(video.releasedAt * 1000).toLocaleDateString('tr-TR') : '—'],
  ]

  return (
    <div className="dark bg-scrim pb-16 text-foreground">
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-10">
        <Link href="/hentai" className="text-sm text-muted-foreground transition hover:text-foreground">← Hentai</Link>

        <div className="mt-4">
          <HanimePlayer slug={video.slug} title={video.name} />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{video.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Eye className="size-3.5" /> {compactNumber(video.views)}</span>
              <span className="flex items-center gap-1.5"><Heart className="size-3.5" /> {compactNumber(video.likes)}</span>
              <a href={external} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition hover:text-foreground">hanime.tv <ExternalLink className="size-3.5" /></a>
            </div>
            <div className="flex flex-wrap gap-2">
              {video.tags.map((t) => (
                <Link key={t.text} href={`/hentai?etiket=${encodeURIComponent(t.text)}`} className="rounded-full border border-border px-3 py-1 text-xs transition hover:border-rose-500">
                  {t.text}
                </Link>
              ))}
            </div>
            {description && (
              <section className="flex flex-col gap-3 pt-2">
                <SectionHeading eyebrow="Özet" title="Konu" accent="hakkında" />
                <p className="max-w-2xl whitespace-pre-line text-pretty leading-relaxed text-foreground/75">{description}</p>
              </section>
            )}
          </div>
          <dl className="flex h-fit flex-col divide-y divide-border rounded-2xl border border-border">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {related.length > 0 && (
          <section className="mt-14 flex flex-col gap-5">
            <SectionHeading eyebrow="Benzer" title="Bunları da" accent="izle" />
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((v) => (
                <li key={v.slug}><HanimeCard video={v} /></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}