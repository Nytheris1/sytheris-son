import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { GateForm } from '@/components/gate/gate-form'
import { GATE_COOKIE, gateEnabled, safeNext, verifyGateToken } from '@/lib/gate'

export const metadata: Metadata = {
  title: 'Özel Erişim',
  robots: { index: false, follow: false },
}

export default async function GatePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const target = safeNext(next)
  const store = await cookies()
  if (!gateEnabled() || (await verifyGateToken(store.get(GATE_COOKIE)?.value))) redirect(target)

  return <GateForm next={target} />
}
