import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getGallery, imageUrl } from '@/lib/nhentai'

type Props = { params: Promise<{ id: string }> }
const img = (u: string) => '/api/manga/img?u=' + Buffer.from(u).toString('base64url')

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Doujin oku', robots: { index: false, follow: false } }
}

export default async function DoujinReader({ params }: Props) {
  const { id } = await params
  const gallery = await getGallery(id)
  if (!gallery) notFound()

  return (
    <div className="ht-theme dark min-h-screen bg-background pb-20 text-foreground">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center gap-3 px-4 py-3 text-sm">
          <Link href="/hentai/doujin" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Doujin
          </Link>
          <span className="ml-auto truncate font-mono text-[11px] text-muted-foreground">{gallery.pages} sayfa</span>
        </div>
      </div>

      <h1 className="mx-auto max-w-[900px] px-4 pt-4 text-lg font-semibold">{gallery.title}</h1>

      <div className="mx-auto flex max-w-[900px] flex-col gap-1 px-2 pt-4 sm:px-4">
        {gallery.files.map((file, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={file} src={img(imageUrl(file))} alt={'sayfa ' + (i + 1)} loading={i < 3 ? 'eager' : 'lazy'} className="w-full rounded-sm bg-muted" />
        ))}
        {!gallery.files.length && <p className="py-20 text-center text-sm text-muted-foreground">Sayfalar yüklenemedi.</p>}
      </div>
    </div>
  )
}