import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getChapterPages, getChapters, getManga, type ReadLang } from '@/lib/manga'
import { MangaReader } from '@/components/manga/manga-reader'

type Props = { params: Promise<{ id: string; chapter: string }>; searchParams: Promise<{ hq?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const manga = await getManga(id)
  return { title: manga ? `${manga.title} oku` : 'Manga oku', robots: { index: false } }
}

export default async function ReaderPage({ params, searchParams }: Props) {
  const [{ id, chapter }, { hq }] = await Promise.all([params, searchParams])
  const quality = hq === '1' ? 'data' : 'data-saver'
  const [manga, pages] = await Promise.all([getManga(id), getChapterPages(chapter, quality)])
  if (!manga || !pages || !pages.pages.length) notFound()

  const lang: ReadLang = pages.lang === 'tr' ? 'tr' : 'en'
  const chapters = await getChapters(id, lang)
  const index = chapters.findIndex((c) => c.id === chapter)
  const prev = index > 0 ? chapters[index - 1] : null
  const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null

  return (
    <MangaReader
      manga={{ id: manga.id, title: manga.title }}
      chapter={{ id: chapter, number: pages.chapter, title: pages.title, lang }}
      pages={pages.pages}
      chapters={chapters.map((c) => ({ id: c.id, number: c.chapter, title: c.title }))}
      prevId={prev?.id ?? null}
      nextId={next?.id ?? null}
      hq={quality === 'data'}
    />
  )
}
