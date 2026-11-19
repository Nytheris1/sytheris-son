'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Crown, LibraryBig, LogOut, Music2, Palette, Settings, Sparkles, UserRound } from 'lucide-react'
import type { HeaderUser } from '@/lib/viewer-types'
import { PLANS } from '@/lib/membership'
import { THEMES } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { Popover } from '@/components/ui-kit/popover'
import { AvatarFrame } from '@/components/membership/avatar-frame'
import { BadgeRow } from '@/components/membership/badge-icon'
import { ProfileBanner } from '@/components/membership/banner-preset'
import { nameStyleClass } from '@/lib/membership'
import { NamePlate } from '@/components/membership/nameplate'
import { useTheme } from '@/components/providers/theme-provider'
import { useMusic } from '@/components/music/music-provider'

function daysSince(ts: number) {
  return Math.max(1, Math.floor((Date.now() - ts) / 86400_000))
}

export function ProfilePanel({ user }: { user: HeaderUser }) {
  const { theme, setTheme } = useTheme()
  const music = useMusic()
  const plan = PLANS.find((p) => p.id === user.tier)
  const progress = user.stats.library ? Math.round((user.stats.completed / user.stats.library) * 100) : 0
  const stats = [
    { label: 'Kütüphane', value: user.stats.library },
    { label: 'Tamamlanan', value: user.stats.completed },
    { label: 'Favori', value: user.stats.favorites },
    { label: 'Yorum', value: user.stats.comments },
  ]

  return (
    <Popover
      label="Profil ve istatistikler"
      className="w-[min(94vw,360px)] overflow-hidden p-0"
      trigger={({ open, toggle, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Profil ve istatistikler"
          className="relative rounded-full p-1 transition hover:scale-105"
        >
          <AvatarFrame src={user.avatar} name={user.displayName} frame={user.frame} className="size-9" />
          {user.tier !== 'free' && (
            <span className="absolute -bottom-0.5 -right-0.5 z-10 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
              <Sparkles className="size-2.5" aria-hidden="true" />
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col">
          <div className="relative">
            <ProfileBanner preset={user.bannerPreset} src={user.background} dim={30} overlay={user.bannerOverlay} className="h-24" />
            <div className="absolute -bottom-8 left-5">
              <AvatarFrame src={user.avatar} name={user.displayName} frame={user.frame} className="size-16 ring-4 ring-popover" />
            </div>
            <span className="absolute right-3 top-3 rounded-full bg-scrim/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-on-scrim backdrop-blur">
              {plan?.name ?? 'Gezgin'}
            </span>
          </div>

          <div className="flex flex-col gap-4 px-5 pb-4 pt-10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold leading-tight">
                  <NamePlate plate={user.nameplate}>
                    <span className={nameStyleClass(user.nameStyle)}>{user.displayName}</span>
                  </NamePlate>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">@{user.username} · {daysSince(user.memberSince)} gündür burada</p>
              </div>
              <BadgeRow ids={user.badges} size="xs" max={4} className="justify-end pt-1" />
            </div>

            <dl className="grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex flex-col items-center gap-0.5 rounded-xl bg-card py-2.5"
                >
                  <dd className="text-lg font-semibold tabular-nums leading-none">{s.value}</dd>
                  <dt className="text-[10px] text-muted-foreground">{s.label}</dt>
                </motion.div>
              ))}
            </dl>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tamamlama oranı</span>
                <span className="font-mono tabular-nums">{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tema</span>
              <div className="flex items-center gap-1.5" role="group" aria-label="Tema seç">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={(e) => setTheme(t.id, { x: e.clientX, y: e.clientY })}
                    aria-label={t.name}
                    aria-pressed={t.id === theme}
                    className={cn('size-5 rounded-full ring-offset-2 ring-offset-popover transition hover:scale-110', t.id === theme && 'ring-2 ring-foreground')}
                    style={{ background: t.swatch }}
                  />
                ))}
              </div>
            </div>
          </div>

          <nav className="flex flex-col border-t border-border p-2" aria-label="Hesap">
            {[
              { href: `/u/${user.username}`, label: 'Profilim', icon: UserRound },
              { href: '/kutuphane', label: 'Kütüphanem', icon: LibraryBig },
              { href: '/atolye', label: 'Çizim Atölyesi', icon: Palette },
              { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition hover:bg-muted">
                <l.icon className="size-4 text-muted-foreground" />
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                music.setPanelOpen(true)
                close()
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition hover:bg-muted"
            >
              <Music2 className="size-4 text-muted-foreground" />
              Müzik
            </button>
            <Link
              href="/abonelik"
              onClick={close}
              className={cn(
                'mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                user.tier === 'free' ? 'bg-primary text-primary-foreground hover:brightness-110' : 'hover:bg-muted',
              )}
            >
              <Crown className="size-4" />
              {user.tier === 'free' ? 'Sytheris+’a yükselt' : 'Aboneliğim'}
            </Link>
            <form action="/api/auth/logout" method="post" className="mt-1">
              <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-destructive transition hover:bg-destructive/10">
                <LogOut className="size-4" />
                Çıkış yap
              </button>
            </form>
          </nav>
        </div>
      )}
    </Popover>
  )
}
