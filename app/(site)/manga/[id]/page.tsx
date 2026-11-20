import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { getManga, listChapters } from '@/lib/mangadex'

type Props = { params: Promise<{ id: string }> }
const img = (u: string) => (u ? '/api/manga/img?u=' + Buffer.from(u).toString('base64url') : '')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const manga = await getManga(id)
  return { title: manga ? manga.title : 'Manga' }
}

export default async function MangaDetail({ params }: Props) {
  const { id } = await params
  const [manga, chapters] = await Promise.all([getManga(id), listChapters(id)])
  if (!manga) notFound()

  const first = chapters[0]

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-24 text-white">
      <div className="mx-auto max-w-[1100px] px-4 pt-10 sm:px-6 lg:px-10">
        <Link href="/manga" className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/40 hover:text-white">- Manga kataloğu</Link>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            {manga.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img(manga.cover)} alt={manga.title + ' kapağı'} className="size-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full bg-rose-600/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300">türkçe</span>
            <h1 className="text-balance text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{manga.title}</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
              {manga.year ? manga.year + ' · ' : ''}
              {chapters.length} bölüm
            </p>
            {manga.tags.length ? <p className="text-sm text-white/45">{manga.tags.join(' · ')}</p> : null}
            {first ? (
              <Link href={'/manga/' + manga.id + '/' + first.id} className="mt-2 flex w-fit items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold">
                <BookOpen className="size-4" /> Okumaya başla
              </Link>
            ) : (
              <p className="mt-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/50">Türkçe bölüm yok</p>
            )}
          </div>
        </div>

        {chapters.length ? (
          <ul className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((ch) => (
              <li key={ch.id}>
                <Link href={'/manga/' + manga.id + '/' + ch.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm transition hover:border-rose-500/50">
                  <span className="truncate">{ch.number ? ch.number + '. bölüm' : 'bölüm'}{ch.title ? ' · ' + ch.title : ''}</span>
                  <span className="shrink-0 font-mono text-[10px] text-white/30">{ch.pages} sayfa</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">
            Bu seride Türkçe çeviri yok. <Link href="/manga" className="underline">Kataloğa dön</Link>
          </p>
        )}
      </div>
    </div>
  )
}