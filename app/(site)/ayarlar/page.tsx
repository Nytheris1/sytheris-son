import type { Metadata } from 'next'
import { SectionHeading } from '@/components/anime/section-heading'
import { SettingsPanel } from '@/components/settings/settings-panel'

export const metadata: Metadata = { title: 'Ayarlar' }

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 pb-10 pt-10 sm:px-6 lg:pt-14">
      <SectionHeading as="h1" eyebrow="Tercihler" title="Deneyimini" accent="kişiselleştir" description="Tema, fragman, altyazı ve yapay zekâ ayarların bu cihazda saklanır." />
      <SettingsPanel />
    </div>
  )
}
