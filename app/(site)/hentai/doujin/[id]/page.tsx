import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getGallery } from '@/lib/nhentai'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Doujin', robots: { index: false, follow: false } }
}

export default async function DoujinDetail({ params }: Props) {
  const { id } = await params
  const gallery = await getGallery(id)
  if (!gallery) redirect('/hentai/doujin')
  redirect('/hentai/doujin/' + id + '/oku')
}