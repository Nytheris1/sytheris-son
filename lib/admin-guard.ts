import 'server-only'
import { isAdmin } from '@/lib/session'
import { getCurrentUser } from '@/lib/users'

/** Full-access staff only: the ADMIN_PASSWORD session, or a signed-in account with the admin role. */
export async function adminActor(): Promise<string | null> {
  if (await isAdmin()) return 'yönetici'
  const user = await getCurrentUser().catch(() => null)
  return user?.role === 'admin' ? `@${user.username}` : null
}
