import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { chapterPages, getManga, listChaptersAll } from '@/lib/mangadex'

type Props = { params: Promise<{ id: string; ch: string }> }
const img = (u: string) => '/api/manga/img?u=' + Buffer.from(u).toString('base64url')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const manga = await getManga(id)
  return { title: manga ? manga.title + ' oku' : 'Doujin oku' }
}

export default async function DoujinReader({ params }: Props) {
  const { id, ch } = await params
  const [manga, chapters, pages] = await Promise.all([getManga(id), listChaptersAll(id), chapterPages(ch)])
  const index = chapters.findIndex((c) => c.id === ch)
  const prev = chapters[index - 1]
  const next = chapters[index + 1]

  return (
    <div className="dark min-h-screen bg-[#08070a] pb-20 text-white">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#08070a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center gap-3 px-4 py-3 text-sm">
          <Link href={'/hentai/doujin/' + id} className="flex items-center gap-1.5 text-white/50 hover:text-white">
            <ArrowLeft className="size-4" /> {manga?.title || 'Geri'}
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[900px] flex-col gap-1 px-2 pt-4 sm:px-4">
        {pages.files.map((file, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={file} src={img(pages.base + '/data/' + pages.hash + '/' + file)} alt={'sayfa ' + (i + 1)} loading={i < 3 ? 'eager' : 'lazy'} className="w-full rounded-sm bg-white/5" />
        ))}
        {!pages.files.length && <p className="py-20 text-center text-sm text-white/40">Sayfalar yüklenemedi.</p>}
      </div>

      <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 px-4 py-8">
        {prev ? (
          <Link href={'/hentai/doujin/' + id + '/' + prev.id} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm">
            <ArrowLeft className="size-4" /> Önceki
          </Link>
        ) : <span />}
        {next ? (
          <Link href={'/hentai/doujin/' + id + '/' + next.id} className="flex h-11 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold">
            Sonraki <ArrowRight className="size-4" />
          </Link>
        ) : <span />}
      </div>
    </div>
  )
}