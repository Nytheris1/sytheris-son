import type { Metadata } from 'next'
import { getIntroCovers } from '@/lib/anilist'
import { getViewer } from '@/lib/viewer'
import { WelcomeExperience } from '@/components/welcome/welcome-experience'

export const metadata: Metadata = {
  title: 'Hoş geldin',
  description: 'Sytheris’i tanı: keşif, kader kartı, kütüphane, takvim ve Sytheris+. Maskotumuz Syra sana rehberlik etsin.',
}

export default async function WelcomePage() {
  const [covers, viewer] = await Promise.all([getIntroCovers().catch(() => [] as string[]), getViewer().catch(() => null)])
  return <WelcomeExperience covers={covers} name={viewer?.header.displayName ?? null} />
}
