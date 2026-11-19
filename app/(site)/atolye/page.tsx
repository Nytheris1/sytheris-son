import type { Metadata } from 'next'
import { listArtworks } from '@/lib/artworks'
import { getUser } from '@/lib/users'
import { resolveFrame } from '@/lib/membership'
import { getViewer } from '@/lib/viewer'
import { GalleryView, type GalleryArtist, type GalleryItem } from '@/components/studio/gallery-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Çizim Atölyesi',
  description: 'Sytheris+ üyelerinin katmanlı çizim stüdyosunda yarattığı eserlerin sergilendiği topluluk galerisi.',
}

export default async function AtelierPage({ searchParams }: { searchParams: Promise<{ eser?: string }> }) {
  const [{ eser }, viewer, works] = await Promise.all([searchParams, getViewer().catch(() => null), listArtworks(160).catch(() => [])])

  const uids = [...new Set(works.map((w) => w.uid))]
  const users = await Promise.all(uids.map((id) => getUser(id).catch(() => null)))
  const artists: Record<string, GalleryArtist> = {}
  for (const u of users) {
    if (!u || u.banned) continue
    artists[u.id] = { username: u.username, displayName: u.displayName, avatar: u.avatar ?? null, frame: resolveFrame(u.frame), nameStyle: u.nameStyle ?? 'default' }
  }

  const me = viewer?.user.id ?? null
  const items: GalleryItem[] = works
    .filter((w) => artists[w.uid])
    .map((w) => ({
      id: w.id,
      title: w.title,
      width: w.width,
      height: w.height,
      at: w.at,
      likes: w.likes.length,
      liked: me ? w.likes.includes(me) : false,
      mine: me === w.uid,
      uid: w.uid,
      effort: w.effort ?? 0,
      layers: w.layers ?? 1,
    }))

  const week = Date.now() - 7 * 86400_000
  const pool = items.filter((i) => i.at >= week)
  const featured = [...(pool.length ? pool : items)].sort((a, b) => b.likes - a.likes || b.at - a.at)[0] ?? null

  const viewerInfo = viewer ? { loggedIn: true, premium: viewer.header.tier !== 'free', staff: viewer.header.role !== 'user' } : { loggedIn: false, premium: false, staff: false }
  // The exhibition is a Sytheris+ space: everyone else only receives the featured work and a small teaser set.
  const unlocked = viewerInfo.premium || viewerInfo.staff
  const shown = unlocked ? items : items.filter((i) => i.id === featured?.id || i.mine).concat(items.filter((i) => i.id !== featured?.id && !i.mine).slice(0, 8))

  return (
    <GalleryView
      items={shown}
      total={items.length}
      artistTotal={Object.keys(artists).length}
      locked={!unlocked}
      artists={artists}
      featuredId={featured?.id ?? null}
      initialOpen={unlocked && eser && items.some((i) => i.id === eser) ? eser : null}
      viewer={viewerInfo}
    />
  )
}
