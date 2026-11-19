'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { Ban, ChevronDown, Crown, Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { grantPremium, resetUserContent, setUserBadges, setUserBanned, setUserRole } from '@/app/sy-core/actions'
import { BADGES, BADGE_IDS, activeTier, type BadgeId, type Role } from '@/lib/membership'
import type { PublicUser } from '@/lib/users'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shell/user-menu'
import { BadgeIcon } from '@/components/membership/badge-icon'
import { BrandIcon } from '@/components/ui-kit/brand-icon'

type Filter = 'all' | 'banned' | 'premium' | 'staff'

function Manage({ u, isAdmin }: { u: PublicUser; isAdmin: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [reason, setReason] = useState('')
  const [days, setDays] = useState(30)
  const [badges, setBadges] = useState<BadgeId[]>(u.badges ?? [])
  const run = (fn: () => Promise<{ ok: boolean; error?: string } | unknown>, msg: string) =>
    start(async () => {
      try {
        const res = (await fn()) as { ok?: boolean; error?: string }
        if (res && res.ok === false) toast.error(res.error ?? 'İşlem başarısız')
        else {
          toast.success(msg)
          router.refresh()
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    })

  return (
    <div className="grid gap-5 border-t border-border bg-muted/30 p-5 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <p className="label-mono text-[9px] text-muted-foreground">Moderasyon</p>
        <div className="flex gap-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Askı nedeni (isteğe bağlı)" aria-label="Askı nedeni" className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary" />
          <button
            type="button"
            onClick={() => run(() => setUserBanned(u.id, !u.banned, reason), u.banned ? 'Yasak kaldırıldı' : 'Kullanıcı askıya alındı')}
            className={cn('flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition', u.banned ? 'bg-accent text-ink' : 'bg-destructive text-on-scrim')}
          >
            {u.banned ? <ShieldCheck className="size-3.5" /> : <Ban className="size-3.5" />}
            {u.banned ? 'Yasağı kaldır' : 'Askıya al'}
          </button>
        </div>
        {u.banReason && <p className="text-xs text-destructive">Neden: {u.banReason}</p>}
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['avatar', 'Avatarı sıfırla'],
              ['bio', 'Biyografiyi temizle'],
              ['background', 'Afişi kaldır'],
            ] as const
          ).map(([f, l]) => (
            <button key={f} type="button" onClick={() => run(() => resetUserContent(u.id, f), 'İçerik sıfırlandı')} className="h-9 rounded-full border border-border px-3 text-xs transition hover:border-destructive hover:text-destructive">
              {l}
            </button>
          ))}
        </div>
      </section>

      {isAdmin ? (
        <section className="flex flex-col gap-3">
          <p className="label-mono text-[9px] text-muted-foreground">Rol ve abonelik</p>
          <div className="flex flex-wrap items-center gap-2">
            {(['user', 'moderator', 'admin'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={(u.role ?? 'user') === r}
                onClick={() => run(() => setUserRole(u.id, r), 'Rol güncellendi')}
                className={cn('h-9 rounded-full border px-3 text-xs font-medium transition', (u.role ?? 'user') === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary')}
              >
                {r === 'user' ? 'Kullanıcı' : r === 'moderator' ? 'Moderatör' : 'Yönetici'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Süre
              <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 w-20 rounded-xl border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary" />
              gün
            </label>
            <button type="button" onClick={() => run(() => grantPremium(u.id, 'plus', days), 'Sytheris+ verildi')} className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground">
              <Sparkles className="size-3.5" /> Plus ver
            </button>
            <button type="button" onClick={() => run(() => grantPremium(u.id, 'ultra', days), 'Ultra verildi')} className="flex h-9 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-medium text-background">
              <Crown className="size-3.5" /> Ultra ver
            </button>
            {u.premium && (
              <button type="button" onClick={() => run(() => grantPremium(u.id, null, 0), 'Abonelik kaldırıldı')} className="h-9 rounded-full px-3 text-xs text-muted-foreground hover:text-destructive">
                Kaldır
              </button>
            )}
          </div>
          <p className="label-mono mt-2 text-[9px] text-muted-foreground">Rozetler</p>
          <div className="flex flex-wrap gap-1.5">
            {BADGE_IDS.filter((b) => !BADGES[b].auto).map((b) => {
              const on = badges.includes(b)
              return (
                <button
                  key={b}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setBadges((s) => (on ? s.filter((x) => x !== b) : [...s, b]))}
                  className={cn('flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs transition', on ? 'border-primary bg-accent' : 'border-border opacity-60 hover:opacity-100')}
                >
                  <BadgeIcon id={b} size="xs" /> {BADGES[b].name}
                </button>
              )
            })}
          </div>
          <button type="button" onClick={() => run(() => setUserBadges(u.id, badges), 'Rozetler kaydedildi')} className="h-9 self-start rounded-full border border-border px-4 text-xs font-medium transition hover:border-primary">
            Rozetleri kaydet
          </button>
        </section>
      ) : (
        <p className="text-xs text-muted-foreground">Rol, abonelik ve rozet işlemleri yalnızca yöneticilere açıktır.</p>
      )}
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  )
}

export function UsersTable({ users, isAdmin = true }: { users: PublicUser[]; isAdmin?: boolean }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)
  const list = users
    .filter((u) => `${u.username} ${u.displayName}`.toLowerCase().includes(q.toLowerCase()))
    .filter((u) => (filter === 'banned' ? u.banned : filter === 'premium' ? activeTier(u.premium) !== 'free' : filter === 'staff' ? u.role === 'admin' || u.role === 'moderator' : true))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kullanıcı ara…" aria-label="Kullanıcı ara" className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Filtre">
          {(
            [
              ['all', 'Tümü'],
              ['premium', 'Premium'],
              ['staff', 'Ekip'],
              ['banned', 'Askıda'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={filter === v} onClick={() => setFilter(v)} className={cn('rounded-xl px-3 text-xs font-medium transition', filter === v ? 'bg-card shadow-sm' : 'text-muted-foreground')}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
          {list.map((u) => {
            const t = activeTier(u.premium)
            const expanded = open === u.id
            return (
              <li key={u.id} className={cn('border-b border-border last:border-0', u.banned && 'bg-destructive/5')}>
                <button type="button" onClick={() => setOpen(expanded ? null : u.id)} aria-expanded={expanded} className="flex w-full flex-wrap items-center gap-3 p-4 text-left transition hover:bg-muted/40">
                  <Avatar user={u} className="size-10" framed />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {u.displayName}
                      {u.role && u.role !== 'user' && <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] uppercase text-ink">{u.role === 'admin' ? 'Yönetici' : 'Moderatör'}</span>}
                      {t !== 'free' && <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[9px] uppercase text-primary-foreground">{t}</span>}
                      {u.banned && <span className="rounded-full bg-destructive px-2 py-0.5 font-mono text-[9px] uppercase text-on-scrim">Askıda</span>}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      @{u.username} · {new Date(u.createdAt).toLocaleDateString('tr-TR')} · {u.favorites.length} favori · {u.views} görüntülenme
                    </p>
                  </div>
                  {u.provider !== 'email' ? <BrandIcon name={u.provider} className="size-4" /> : <span className="font-mono text-[10px] uppercase text-muted-foreground">e-posta</span>}
                  <Link href={`/u/${u.username}`} target="_blank" onClick={(e) => e.stopPropagation()} className="rounded-full border border-border px-3 py-1.5 text-xs transition hover:border-primary">
                    Profil
                  </Link>
                  <ChevronDown className={cn('size-4 text-muted-foreground transition', expanded && 'rotate-180')} />
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <Manage u={u} isAdmin={isAdmin} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
