import type { Metadata, Viewport } from 'next'
import { getDraft } from '@/lib/artworks'
import { getViewer } from '@/lib/viewer'
import { StudioEditor } from '@/components/studio/studio-editor'
import { StudioGate } from '@/components/studio/studio-gate'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Stüdyo — Çizim Atölyesi',
  description: 'Katmanlar, basınç duyarlı fırçalar, simetri ve karışım modlarıyla tarayıcıda çiz; eserini Sytheris galerisinde sergile.',
  robots: { index: false },
}

export const viewport: Viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function StudioPage() {
  const viewer = await getViewer().catch(() => null)
  if (!viewer) return <StudioGate reason="login" />
  if (viewer.header.tier === 'free') return <StudioGate reason="premium" />
  const draft = await getDraft(viewer.user.id).catch(() => null)
  return <StudioEditor draft={draft} artist={`@${viewer.user.username}`} />
}
