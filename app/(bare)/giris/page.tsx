import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getIntroCovers } from '@/lib/anilist'
import { providerStatus } from '@/lib/oauth'
import { getSettings } from '@/lib/site'
import { getCurrentUser } from '@/lib/users'
import { CoverWall } from '@/components/shell/cover-wall'
import { LoginPanel } from '@/components/auth/login-panel'
import { LoginStage } from '@/components/auth/login-stage'

export const metadata: Metadata = { title: 'Giriş yap', description: 'Discord, Google, GitHub veya e-posta ile Sytheris hesabına giriş yap.' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; provider?: string }> }) {
  const [user, covers, settings, sp] = await Promise.all([getCurrentUser(), getIntroCovers(), getSettings(), searchParams])
  if (user) redirect('/')
  return (
    <main className="dark relative isolate grid min-h-dvh overflow-hidden bg-scrim text-foreground lg:grid-cols-[1.15fr_1fr]">
      <div className="absolute inset-0 -z-10">
        <CoverWall covers={covers} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,color-mix(in_oklch,var(--scrim)_40%,transparent)_0%,var(--scrim)_75%)]" />
        <div className="absolute inset-0 bg-scrim/55" />
        <div className="grain absolute inset-0" />
      </div>
      <LoginStage />
      <div className="flex items-center justify-center px-4 py-10 lg:border-l lg:border-foreground/10 lg:bg-scrim/50 lg:backdrop-blur-xl">
        <LoginPanel providers={providerStatus()} error={sp.error} errorProvider={sp.provider} registrationsOpen={settings.registrationsOpen} />
      </div>
    </main>
  )
}
