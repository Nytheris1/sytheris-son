import type { Metadata } from 'next'
import { GateForm } from '@/components/gate/gate-form'

export const metadata: Metadata = { title: 'Kilit ekranı önizleme', robots: { index: false, follow: false } }

export default function GatePreview() {
  return <GateForm next="/rehber" />
}
