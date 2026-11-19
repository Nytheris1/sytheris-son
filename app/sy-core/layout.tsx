import type { Metadata } from 'next'
import { AdminLogin } from '@/components/admin/admin-login'
import { getStaff } from './actions'

export const metadata: Metadata = { title: 'Kontrol merkezi', robots: { index: false, follow: false, nocache: true } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff()
  if (!staff) return <AdminLogin configured={Boolean(process.env.ADMIN_PASSWORD)} />
  return (
    <div className="min-h-dvh bg-background" suppressHydrationWarning>
      {children}
    </div>
  )
}
