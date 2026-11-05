import type { Metadata } from 'next'
import { isAdmin } from '@/lib/session'
import { AdminLogin } from '@/components/admin/admin-login'

export const metadata: Metadata = { title: 'Yönetim paneli', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin()
  if (!admin) return <AdminLogin configured={Boolean(process.env.ADMIN_PASSWORD)} />
  return <div className="min-h-dvh bg-background">{children}</div>
}
