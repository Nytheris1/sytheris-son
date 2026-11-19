import type { Metadata } from 'next'
import { getViewer } from '@/lib/viewer'
import { SubscriptionView } from '@/components/membership/subscription-view'

export const metadata: Metadata = {
  title: 'Sytheris+ abonelik',
  description: 'Hareketli avatar ve afişler, özel çerçeveler ve parlayan rozetlerle profilini sahneye taşı.',
}

export default async function SubscriptionPage() {
  const viewer = await getViewer().catch(() => null)
  return (
    <SubscriptionView
      viewer={
        viewer
          ? {
              name: viewer.header.displayName,
              avatar: viewer.header.avatar,
              tier: viewer.header.tier,
              until: viewer.header.premiumUntil ?? null,
              frame: viewer.header.frame ?? 'halo',
              overlay: viewer.header.bannerOverlay ?? 'none',
              effect: viewer.header.profileEffect ?? 'none',
              nameStyle: viewer.header.nameStyle ?? 'default',
              commentColor: viewer.header.commentColor ?? 'default',
              nameplate: viewer.header.nameplate ?? 'none',
              background: viewer.header.background ?? null,
              username: viewer.header.username,
              badges: viewer.header.badges,
            }
          : null
      }
    />
  )
}
