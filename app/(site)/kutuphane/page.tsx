import type { Metadata } from 'next'
import { getAnimeBatch, getTrendingBanners } from '@/lib/anilist'
import { libraryStats } from '@/lib/library'
import { LIST_LIMIT } from '@/lib/membership'
import { getViewer } from '@/lib/viewer'
import { LibraryView } from '@/components/library/library-view'

export const metadata: Metadata = { title: 'Kütüphanem', description: 'İzlediğin, izleyeceğin ve tamamladığın animeler; kendi koleksiyon listelerin.' }

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ yeni?: string; liste?: string }> }) {
  const [viewer, sp] = await Promise.all([getViewer().catch(() => null), searchParams])

  if (!viewer) {
    const banners = await getTrendingBanners()
    return <LibraryView guest banners={banners} lists={[]} media={{}} stats={null} limit={0} openCreate={false} initialList={null} />
  }

  const ids = viewer.lists.flatMap((l) => l.items.map((i) => i.id))
  const map = await getAnimeBatch(ids)
  const owned = [...map.values()].filter((m) => m.bannerImage)
  const banners = owned.length >= 3 ? owned.sort(() => Math.random() - 0.5).slice(0, 6) : await getTrendingBanners()

  return (
    <LibraryView
      guest={false}
      banners={banners}
      lists={viewer.lists}
      media={Object.fromEntries(map)}
      stats={libraryStats(viewer.lists)}
      limit={LIST_LIMIT[viewer.header.tier]}
      openCreate={sp.yeni === '1'}
      initialList={sp.liste ?? null}
    />
  )
}
