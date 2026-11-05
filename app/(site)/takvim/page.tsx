import type { Metadata } from 'next'
import { getSchedule } from '@/lib/anilist'
import { SectionHeading } from '@/components/anime/section-heading'
import { ScheduleView } from '@/components/schedule/schedule-view'

export const metadata: Metadata = { title: 'Yayın takvimi', description: 'Bu haftanın anime yayın takvimi, Türkiye saatiyle.' }

export default async function SchedulePage() {
  const items = await getSchedule()
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pt-14">
      <SectionHeading as="h1" eyebrow="Haftalık" title="Yayın" accent="takvimi" description="Önümüzdeki 7 gün boyunca yayınlanacak bölümler. Saatler Türkiye saatine göredir." />
      <ScheduleView items={items} />
    </div>
  )
}
