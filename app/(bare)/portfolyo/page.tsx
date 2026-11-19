import type { Metadata } from 'next'
import { Anton, Caveat } from 'next/font/google'
import { PortfolioHero } from '@/components/portfolio/portfolio-hero'
import { WorkIndex } from '@/components/portfolio/work-index'
import { Approach } from '@/components/portfolio/approach'
import { Contact } from '@/components/portfolio/contact'
import { PROFILE } from '@/components/portfolio/data'

const anton = Anton({ subsets: ['latin', 'latin-ext'], weight: '400', variable: '--font-anton', display: 'swap' })
const caveat = Caveat({ subsets: ['latin', 'latin-ext'], weight: ['500', '700'], variable: '--font-hand', display: 'swap' })

export const metadata: Metadata = {
  title: { absolute: `${PROFILE.name} — Portfolyo` },
  description: `${PROFILE.name}: ${PROFILE.role}. Marka kimliği, arayüz tasarımı, tipografi ve editoryal işlerden bir seçki.`,
}

export default function PortfolioPage() {
  return (
    <main className={`folio-zine ${anton.variable} ${caveat.variable} relative min-h-dvh overflow-x-clip font-sans antialiased`}>
      <PortfolioHero />
      <WorkIndex />
      <Approach />
      <Contact />
    </main>
  )
}
