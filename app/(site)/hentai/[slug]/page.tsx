import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Eye, Heart } from 'lucide-react'
import { getRelated, getVideo } from '@/lib/hanime/catalog'
import { compactNumber, plainDescription, shortDuration } from '@/lib/hanime/format'
import { HanimeCard } from '@/components/hentai/hanime-card'
import { HanimePlayer } from '@/components/hentai/hanime-player'

type Props = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const v = await getVideo(slug)
  if (!v) return { title: 'Bulunamadi' }
  return { title: v.name + ' - Hentai', description: plainDescription(v.description).slice(0, 160), robots: { index: false } }
}

export default async function HanimeDetailPage({ params }: Props) {
  const { slug } = await params
  const video = await getVideo(slug)
  if (!video) notFound()

  const related = await getRelated(video)
  const external = 'https://hanime.tv/videos/hentai/' + video.slug
  const description = plainDescription(video.description)

  const facts: [string, string][] = [
    ['Study o', video.brand ?? '-'],
    ['Sure', shortDuration(video.durationMs)],
    ['Sansur', video.censored ? 'Var' : 'Yok'],
    ['Izlenme', compactNumber(video.views)],
    ['Begeni', compactNumber(video.likes)],
    ['Cikis', video.releasedAt ? new Date(video.releasedAt * 1000).toLocaleDateString('tr-TR') : '-'],
  ]

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <section className="relative isolate overflow-hidden">
        {(video.banner ?? video.cover) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(video.banner ?? video.cover)!} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(244,63,94,0.25),transparent_50%),linear-gradient(to_bottom,rgba(8,7,10,0.6),#08070a_85%)]" aria-hidden="true" />

        <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-10 sm:px-6 lg:px-10">
          <Link href="/hentai" className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40 transition hover:text-white">
            - Hentai
          </Link>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_120px_-40px_rgba(244,63,94,0.4)]">
            <HanimePlayer slug={video.slug} title={video.name} />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
            <div className="flex flex-col gap-5">
              <h1 className="text-balance text-4xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl">{video.name}</h1>
              <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                <span className="flex items-center gap-1.5"><Eye className="size-3.5" /> {compactNumber(video.views)}</span>
                <span className="flex items-center gap-1.5"><Heart className="size-3.5" /> {compactNumber(video.likes)}</span>
                <a href={external} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition hover:text-white">hanime.tv <ExternalLink className="size-3.5" /></a>
              </div>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((t) => (
                  <Link key={t.text} href={'/hentai?etiket=' + encodeURIComponent(t.text)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 transition hover:border-rose-500 hover:text-white">
                    {t.text}
                  </Link>
                ))}
              </div>
              {description && (
                <section className="flex flex-col gap-3 border-t border-white/10 pt-6">
                  <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/35">Konu</h2>
                  <p className="max-w-2xl whitespace-pre-line text-pretty leading-relaxed text-white/65">{description}</p>
                </section>
              )}
            </div>

            <dl className="flex h-fit flex-col divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-white/40">{k}</dt>
                  <dd className="font-medium text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto mt-8 flex max-w-[1280px] flex-col gap-5 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Bunlari da <span className="accent-serif italic text-white/35">izle</span></h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((v) => (
              <li key={v.slug}><HanimeCard video={v} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}