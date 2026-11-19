import type { Metadata } from 'next'
import { MaintenanceScreen } from '@/components/shell/maintenance-screen'
import { getSettings } from '@/lib/site'

export const metadata: Metadata = { title: 'Bakım ekranı önizleme', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function MaintenancePreview() {
  const settings = await getSettings()
  const eta = settings.maintenanceEta || new Date(Date.now() + 2 * 86400_000 + 5 * 3600_000).toISOString()
  return <MaintenanceScreen settings={{ ...settings, maintenanceEta: eta }} />
}
