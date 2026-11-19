'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { BadgeCheck, CalendarDays, Check, Copy, ExternalLink, Eye, Flag, Heart, MapPin, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { PublicUser } from '@/lib/users'
import { cn } from '@/lib/utils'
import { BrandIcon } from '@/components/ui-kit/brand-icon'
import { reportContent } from '@/app/actions/community'
import { BADGES, TIER_LABEL, type BadgeId, type Tier } from '@/lib/membership'
import { AvatarFrame } from '@/components/membership/avatar-frame'
import { BadgeIcon } from '@/components/membership/badge-icon'
import { ProfileBanner } from '@/components/membership/banner-preset'
import { NamePlate } from '@/components/membership/nameplate'
import { ProfileSong } from './profile-song'

type ProfileStats = { library: number; completed: number; favorites: number; comments: number }

const OUT = [0.16, 1, 0.3, 1] as const
const LINK_LABEL: Record<string, string> = { discord: 'Discord', youtube: 'YouTube', twitch: 'Twitch', x: 'X', instagram: 'Instagram', tiktok: 'TikTok', github: 'GitHub', spotify: 'Spotify', steam: 'Steam', website: 'Web sitesi' }

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6', className)} aria-label={title}>
      <h2 className="label-mono text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

export function ProfileView({
  user,
  favorites,
  isOwner,
  loggedIn = false,
  badges = [],
  tier = 'free',
  stats,
}: {
  user: PublicUser
  favorites: { id: number; title: string; cover: string | null }[]
  isOwner: boolean
  loggedIn?: boolean
  badges?: BadgeId[]
  tier?: Tier
  stats?: ProfileStats
}) {
  const [views, setViews] = useState(user.views)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const key = `sy-viewed-${user.username}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/profile/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username }) })
      .then((r) => r.json())
      .then((j) => j.views && setViews(j.views))
      .catch(() => {})
  }, [user.username])

  const joined = new Date(user.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const statRows: [string, number][] = stats
    ? [
        ['Kütüphane', stats.library],
        ['Bitirdi', stats.completed],
        ['Favori', stats.favorites],
        ['Yorum', stats.comments],
      ]
    : []

  const copyLink = () => {
    navigator.clipboard.writeText(location.href).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const report = async () => {
    const res = await reportContent({ kind: 'user', targetId: user.id, reason: 'Uygunsuz profil', snapshot: `${user.displayName} (@${user.username}): ${user.bio}` })
    if (res.ok) toast.success('Profil ekibe bildirildi')
    else toast.error(res.error)
  }

  return (
    <div data-theme={user.accent} className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 pb-16 pt-4 sm:px-6 lg:px-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: OUT }} className="dark overflow-hidden rounded-[2rem] border border-border">
        <ProfileBanner src={user.background} dim={user.background ? user.backgroundDim : 30} overlay={user.bannerOverlay} className="h-48 sm:h-64 lg:h-72" />
      </motion.div>

      <header className="-mt-20 flex flex-col gap-6 px-1 sm:-mt-24 sm:px-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15, ease: OUT }} className="relative z-10 w-fit rounded-full bg-background p-1.5">
            <AvatarFrame src={user.avatar} name={user.displayName} frame={user.frame} className="size-28 sm:size-36" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease: OUT }} className="flex min-w-0 flex-col gap-2 pb-1">
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              <NamePlate plate={user.nameplate}>{user.displayName}</NamePlate>
              {badges.includes('verified') && <BadgeCheck className="size-6 shrink-0 fill-primary text-primary-foreground" aria-label="Doğrulanmış hesap" role="img" />}
              {tier !== 'free' && <span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">{TIER_LABEL[tier]}</span>}
            </h1>
            <p className={cn('font-mono text-sm text-muted-foreground', user.nameplate === 'ribbon' && 'mt-2')}>@{user.username}</p>
          </motion.div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copyLink} className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition hover:text-foreground">
            {copied ? <Check className="size-4 text-ink" /> : <Copy className="size-4" />}
            {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
          </button>
          {isOwner ? (
            <Link href="/ayarlar?tab=profil" className="flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-primary hover:text-primary-foreground">
              <Pencil className="size-4" /> Profili düzenle
            </Link>
          ) : (
            loggedIn && (
              <button type="button" onClick={report} className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition hover:border-destructive hover:text-destructive">
                <Flag className="size-4" /> Bildir
              </button>
            )
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 sm:p-7" aria-label="Hakkında">
            {user.bio ? <p className="max-w-2xl text-pretty text-lg leading-relaxed">{user.bio}</p> : <p className="text-muted-foreground">{isOwner ? 'Henüz bir biyografi yazmadın. Kendini birkaç cümleyle anlat.' : 'Bu kullanıcı henüz kendinden bahsetmemiş.'}</p>}
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {user.location && (
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {user.location}
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {joined} tarihinden beri
              </li>
              <li className="flex items-center gap-1.5">
                <Eye className="size-4" /> {views.toLocaleString('tr-TR')} görüntülenme
              </li>
            </ul>
            {statRows.length > 0 && (
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
                {statRows.map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5 bg-card px-4 py-4">
                    <dd className="text-2xl font-bold tabular-nums tracking-tight">{v.toLocaleString('tr-TR')}</dd>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="flex flex-col gap-5" aria-labelledby="fav-title">
            <div className="flex items-end justify-between gap-4">
              <h2 id="fav-title" className="text-2xl font-semibold tracking-tight">
                Favori <span className="accent-serif">animeler</span>
              </h2>
              <span className="font-mono text-xs text-muted-foreground">{favorites.length} yapım</span>
            </div>
            {favorites.length > 0 ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-4">
                {favorites.map((f, i) => (
                  <motion.li key={f.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.04, ease: OUT }}>
                    <Link href={`/anime/${f.id}`} className="group flex flex-col gap-2">
                      <span className="block overflow-hidden rounded-2xl ring-1 ring-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.cover || '/placeholder.svg'} alt="" className="aspect-[2/3] w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                      </span>
                      <span className="line-clamp-2 text-sm font-medium leading-snug transition group-hover:text-ink">{f.title}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3 rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                <Heart className="size-4 shrink-0" /> {isOwner ? 'Bir animenin sayfasında kalbe dokun, burada görünsün.' : 'Henüz favori eklenmemiş.'}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          {badges.length > 0 && (
            <Panel title={`Rozetler · ${badges.length}`}>
              <ul className="flex flex-col gap-3">
                {badges.slice(0, 8).map((id) => (
                  <li key={id} className="flex items-center gap-3">
                    <BadgeIcon id={id} size="sm" tip={false} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{BADGES[id].name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{BADGES[id].description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {user.song && (
            <Panel title="Profil müziği">
              <ProfileSong song={user.song} />
            </Panel>
          )}

          {user.links.length > 0 && (
            <Panel title="Bağlantılar">
              <ul className="flex flex-col gap-1">
                {user.links.map((l, i) => {
                  const isHandle = l.type === 'discord' && !l.url.startsWith('http')
                  const icon = l.type === 'website' ? <ExternalLink className="size-4" /> : <BrandIcon name={l.type} className="size-4 text-foreground" />
                  const row = 'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm transition hover:bg-muted'
                  return (
                    <li key={i}>
                      {isHandle ? (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(l.url).catch(() => {})
                            toast.success('Discord kullanıcı adı kopyalandı')
                          }}
                          className={row}
                        >
                          {icon}
                          <span className="font-medium">{LINK_LABEL[l.type] ?? l.type}</span>
                          <span className="ml-auto truncate font-mono text-xs text-muted-foreground">{l.url}</span>
                        </button>
                      ) : (
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className={row}>
                          {icon}
                          <span className="font-medium">{LINK_LABEL[l.type] ?? l.type}</span>
                          <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  )
}
