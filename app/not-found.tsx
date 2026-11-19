import type { Metadata } from 'next'
import { getIntroCovers } from '@/lib/anilist'
import { NotFoundView } from '@/components/lost/not-found-view'

export const metadata: Metadata = {
  title: 'Kayıp bölüm',
  robots: { index: false, follow: false },
}

export default async function NotFound() {
  const covers = await getIntroCovers().catch(() => [] as string[])
  return <NotFoundView covers={covers} />
}
