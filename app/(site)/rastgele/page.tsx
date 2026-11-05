import type { Metadata } from 'next'
import { getRandomPool } from '@/lib/anilist'
import { SectionHeading } from '@/components/anime/section-heading'
import { RandomSpinner } from '@/components/random/random-spinner'

export const metadata: Metadata = { title: 'Rastgele anime', description: 'Çarkı çevir, sana rastgele bir anime seçelim.' }
export const dynamic = 'force-dynamic'

export default async function RandomPage() {
  const pool = await getRandomPool()
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pt-14">
      <SectionHeading as="h1" eyebrow="Şans" title="Ne izleyeceğine" accent="çark karar versin" description="Bir tür seç ya da hepsini açık bırak, ardından çevir. Kader senin için bir anime seçecek." />
      <RandomSpinner initialPool={pool} />
    </div>
  )
}
