import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, ExternalLink, Heart, Star } from 'lucide-react'
import { DEMO_TR, READ_LANGS, STATUS_TR, getChapters, getManga, getOfficialLink, type ReadLang } from '@/lib/manga'
import { ExpandableText } from '@/components/anime/expandable-text'
import { ChapterList } from '@/components/manga/chapter-list'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ dil?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const manga = await getManga(id)
  if (!manga) return { title: 'Manga bulunamadı' }
  return { title: `${manga.title} — Manga`, description: manga.description.slice(0, 160) || `${manga.title} mangasını oku.` }
}

export default async function MangaDetailPage({ params, searchParams }: Props) {
  const [{ id }, { dil }] = await Promise.all([params, searchParams])
  const manga = await getManga(id)
  if (!manga) notFound()

  const preferred: ReadLang = dil === 'en' || dil === 'tr' ? dil : manga.languages.includes('tr') ? 'tr' : 'en'
  let lang = preferred
  let chapters = await getChapters(id, lang)
  if (!chapters.length && !dil) {
    lang = preferred === 'tr' ? 'en' : 'tr'
    chapters = await getChapters(id, lang)
  }
  const first = chapters[0]
  const last = chapters.at(-1)
  const official = chapters.length ? null : await getOfficialLink(id)

  const facts = [
    manga.status && { k: 'Durum', v: STATUS_TR[manga.status] },
    manga.year && { k: 'Yıl', v: String(manga.year) },
    manga.demographic && { k: 'Hedef kitle', v: DEMO_TR[manga.demographic] ?? manga.demographic },
    manga.authors.length && { k: 'Yazar', v: manga.authors.join(', ') },
    manga.artists.length && manga.artists.join() !== manga.authors.join() && { k: 'Çizer', v: manga.artists.join(', ') },
    manga.lastChapter && { k: 'Final', v: `${manga.lastChapter}. bölüm` },
  ].filter(Boolean) as { k: string; v: string }[]

  return (
    <div className="flex flex-col pb-16">
      <section className="relative isolate overflow-hidden">
        {manga.coverHi && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={manga.coverHi} alt="" aria-hidden="true" className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-40 blur-3xl" />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/85 to-background" />
        <div aria-hidden="true" className="halftone halftone-fade absolute inset-0 -z-10 text-foreground/[0.06]" />

        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pb-12 pt-8 sm:px-6 lg:px-10">
          <Link href="/manga" className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> Manga kataloğu
          </Link>

          <div className="grid gap-8 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12">
            <div className="mx-auto w-48 md:mx-0 md:w-full">
              <div className="mg-spine relative aspect-[5/7] overflow-hidden rounded-md bg-muted shadow-2xl ring-1 ring-border">
                {manga.coverHi ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={manga.coverHi} alt={`${manga.title} kapağı`} className="size-full object-cover" />
                ) : (
                  <span className="halftone grid size-full place-items-center text-muted-foreground">Kapak yok</span>
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {manga.languages.includes('tr') && <span className="rounded-sm bg-primary px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-primary-foreground">TÜRKÇE</span>}
                  {manga.rating && (
                    <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 font-mono text-xs">
                      <Star className="size-3 fill-primary text-primary" aria-hidden="true" /> {manga.rating}
                    </span>
                  )}
                  {manga.follows && (
                    <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                      <Heart className="size-3" aria-hidden="true" /> {manga.follows.toLocaleString('tr-TR')} takipçi
                    </span>
                  )}
                </div>
                <h1 className="text-balance text-4xl font-bold leading-[0.95] tracking-[-0.045em] sm:text-6xl">{manga.title}</h1>
                {manga.altTitle && <p className="accent-serif text-xl">{manga.altTitle}</p>}
              </div>

              <div className="flex flex-wrap gap-3">
                {first ? (
                  <Link
                    href={`/manga/${manga.id}/oku/${first.id}`}
                    className="flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lg transition hover:opacity-90"
                  >
                    <BookOpen className="size-4" aria-hidden="true" /> Okumaya başla
                  </Link>
                ) : official ? (
                  <a
                    href={official.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-2.5 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-lg transition hover:opacity-90"
                  >
                    <ExternalLink className="size-4" aria-hidden="true" /> Resmî platformda oku · {official.host}
                  </a>
                ) : (
                  <span className="rounded-full border border-border px-6 py-3 text-sm text-muted-foreground">Okunabilir bölüm bulunamadı</span>
                )}
                {last && last.id !== first?.id && (
                  <Link href={`/manga/${manga.id}/oku/${last.id}`} className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:bg-muted">
                    Son bölüm · {last.chapter ?? '—'}
                  </Link>
                )}
              </div>

              <ExpandableText text={manga.description} lines={4} />

              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.k} className="flex flex-col gap-1">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{f.k}</dt>
                    <dd className="text-sm font-medium">{f.v}</dd>
                  </div>
                ))}
              </dl>

              {manga.tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Etiketler">
                  {manga.tags.slice(0, 14).map((t) => (
                    <li key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 sm:px-6 lg:px-10" aria-labelledby="mg-chapters">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="mg-chapters" className="text-3xl font-semibold tracking-[-0.03em]">
            Bölümler <span className="font-mono text-base font-normal tabular-nums text-muted-foreground">{chapters.length}</span>
          </h2>
          <div className="flex rounded-full border border-border p-0.5" role="group" aria-label="Çeviri dili">
            {READ_LANGS.map((l) => (
              <Link
                key={l}
                href={`/manga/${manga.id}?dil=${l}`}
                scroll={false}
                aria-current={lang === l ? 'true' : undefined}
                className={cn('rounded-full px-4 py-1.5 text-xs font-semibold transition', lang === l ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
              >
                {l === 'tr' ? 'Türkçe' : 'İngilizce'}
              </Link>
            ))}
          </div>
        </div>
        <ChapterList mangaId={manga.id} chapters={chapters} />
      </section>
    </div>
  )
}
