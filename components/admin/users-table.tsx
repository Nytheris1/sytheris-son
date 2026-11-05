'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Ban, Search, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { setUserBanned } from '@/app/admin/actions'
import type { PublicUser } from '@/lib/users'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shell/user-menu'
import { BrandIcon } from '@/components/ui-kit/brand-icon'

export function UsersTable({ users }: { users: PublicUser[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [, start] = useTransition()
  const list = users.filter((u) => `${u.username} ${u.displayName}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kullanıcı ara…" aria-label="Kullanıcı ara" className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-primary" />
      </div>
      {list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-3xl border border-border bg-card">
          {list.map((u) => (
            <li key={u.id} className={cn('flex flex-wrap items-center gap-3 p-4', u.banned && 'opacity-60')}>
              <Avatar user={u} className="size-10" />
              <div className="min-w-0 flex-1">
                <Link href={`/u/${u.username}`} target="_blank" className="block truncate font-medium hover:text-ink">
                  {u.displayName}
                </Link>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  @{u.username} · {new Date(u.createdAt).toLocaleDateString('tr-TR')} · {u.favorites.length} favori · {u.views} görüntülenme
                </p>
              </div>
              {u.provider !== 'email' ? <BrandIcon name={u.provider} className="size-4" /> : <span className="font-mono text-[10px] uppercase text-muted-foreground">e-posta</span>}
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    await setUserBanned(u.id, !u.banned)
                    toast.success(u.banned ? 'Yasak kaldırıldı' : 'Kullanıcı askıya alındı')
                    router.refresh()
                  })
                }
                className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition', u.banned ? 'bg-accent text-ink' : 'bg-destructive/10 text-destructive hover:bg-destructive/20')}
              >
                {u.banned ? <ShieldCheck className="size-3.5" /> : <Ban className="size-3.5" />}
                {u.banned ? 'Yasağı kaldır' : 'Askıya al'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
