'use client'

import { AvatarFrame } from '@/components/membership/avatar-frame'
import type { FrameId } from '@/lib/membership'

export type { HeaderUser } from '@/lib/viewer-types'

type AvatarUser = { displayName: string; avatar?: string | null; frame?: FrameId | null; username?: string }

export function Avatar({ user, className = 'size-9', framed = false }: { user: AvatarUser; className?: string; framed?: boolean }) {
  return <AvatarFrame src={user.avatar} name={user.displayName} frame={framed ? (user.frame ?? 'none') : 'none'} className={className} />
}
