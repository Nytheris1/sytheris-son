import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getManyAnime } from '@/lib/anilist'
import { pickTitle } from '@/lib/format'
import { getCurrentUser, toPublic } from '@/lib/users'
import { SectionHeading } from '@/components/anime/section-heading'
import { ProfileEditor } from '@/components/profile/profile-editor'

export const metadata: Metadata = { title: 'Profilimi düzenle' }

export default async function ProfileEditPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris')
  const favs = await getManyAnime(user.favorites.slice(0, 24))
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pt-14">
      <SectionHeading as="h1" eyebrow={`@${user.username}`} title="Profilini" accent="tasarla" description="guns.lol tarzı kişisel sayfan: arka plan, müzik, bağlantılar ve favori animelerin." />
      <ProfileEditor user={toPublic(user)} favorites={favs.map((m) => ({ id: m.id, title: pickTitle(m.title), cover: m.coverImage.large ?? null }))} />
    </div>
  )
}
