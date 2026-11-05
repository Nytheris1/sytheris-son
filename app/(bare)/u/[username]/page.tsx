import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getManyAnime } from '@/lib/anilist'
import { pickTitle } from '@/lib/format'
import { getCurrentUser, getUserByUsername, toPublic } from '@/lib/users'
import { ProfileView } from '@/components/profile/profile-view'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const user = await getUserByUsername(username)
  if (!user) return { title: 'Profil bulunamadı' }
  return {
    title: `${user.displayName} (@${user.username})`,
    description: user.bio || `${user.displayName} Sytheris profili`,
    openGraph: { title: `${user.displayName} — SYTHERIS`, description: user.bio, images: user.avatar ? [user.avatar] : undefined, type: 'profile' },
    twitter: { card: 'summary', title: `${user.displayName} — SYTHERIS`, description: user.bio },
  }
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params
  const [user, viewer] = await Promise.all([getUserByUsername(username), getCurrentUser()])
  if (!user || user.banned) notFound()
  const favs = await getManyAnime(user.favorites.slice(0, 8))
  return (
    <ProfileView
      user={toPublic(user)}
      isOwner={viewer?.id === user.id}
      favorites={favs.map((m) => ({ id: m.id, title: pickTitle(m.title), cover: m.coverImage.extraLarge || m.coverImage.large || null }))}
    />
  )
}
