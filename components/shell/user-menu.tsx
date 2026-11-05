'use client'

import Link from 'next/link'
import { LogIn, LogOut, Settings, User as UserIcon, UserPen } from 'lucide-react'
import { Popover } from '@/components/ui-kit/popover'

export type HeaderUser = { username: string; displayName: string; avatar?: string | null }

export function Avatar({ user, className = 'size-9' }: { user: HeaderUser; className?: string }) {
  return user.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar || '/placeholder.svg'} alt="" className={`${className} rounded-full object-cover`} />
  ) : (
    <span className={`${className} grid place-items-center rounded-full bg-primary text-sm font-bold uppercase text-primary-foreground`}>
      {user.displayName.slice(0, 1)}
    </span>
  )
}

export function UserMenu({ user }: { user: HeaderUser | null }) {
  if (!user) {
    return (
      <Link
        href="/giris"
        className="flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-primary hover:text-primary-foreground"
      >
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Giriş yap</span>
        <span className="sr-only sm:hidden">Giriş yap</span>
      </Link>
    )
  }
  return (
    <Popover
      label="Hesap menüsü"
      className="w-64"
      trigger={({ open, toggle, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Hesap menüsü"
          className="rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-primary"
        >
          <Avatar user={user} />
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 p-3">
            <Avatar user={user} className="size-11" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.displayName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-border" />
          {[
            { href: `/u/${user.username}`, label: 'Profilim', icon: UserIcon },
            { href: '/profil', label: 'Profili düzenle', icon: UserPen },
            { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
          ].map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition hover:bg-muted">
              <l.icon className="size-4 text-muted-foreground" />
              {l.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-destructive transition hover:bg-destructive/10">
              <LogOut className="size-4" />
              Çıkış yap
            </button>
          </form>
        </div>
      )}
    </Popover>
  )
}
