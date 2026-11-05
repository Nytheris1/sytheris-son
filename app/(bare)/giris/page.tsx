import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getIntroCovers } from '@/lib/anilist'
import { providerStatus } from '@/lib/oauth'
import { getSettings } from '@/lib/site'
import { getCurrentUser } from '@/lib/users'
import { CoverWall } from '@/components/shell/cover-wall'
import { LoginPanel } from '@/components/auth/login-panel'

export const metadata: Metadata = { title: 'Giriş yap', description: 'Discord, Google, GitHub veya e-posta ile Sytheris hesabına giriş yap.' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; provider?: string }> }) {
  const [user, covers, settings, sp] = await Promise.all([getCurrentUser(), getIntroCovers(), getSettings(), searchParams])
  if (user) redirect('/profil')
  return (
    <main className="dark relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-scrim px-4 py-10 text-foreground">
      <div className="absolute inset-0 -z-10">
        <CoverWall covers={covers} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--scrim)_55%,transparent)_0%,var(--scrim)_80%)]" />
        <div className="absolute inset-0 bg-scrim/50" />
        <div className="grain absolute inset-0" />
      </div>
      <LoginPanel providers={providerStatus()} error={sp.error} errorProvider={sp.provider} registrationsOpen={settings.registrationsOpen} />
    </main>
  )
}
