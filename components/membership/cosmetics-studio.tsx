'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { ArrowUpRight, Check, ImageIcon, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { setBannerOverlay, setCommentColor, setFrame, setNameplate } from '@/app/actions/membership'
import {
  BADGES,
  BADGE_IDS,
  BANNER_OVERLAYS,
  COMMENT_COLORS,
  FRAMES,
  NAMEPLATES,
  RARITY,
  TIER_LABEL,
  TIER_RANK,
  commentInkClass,
  commentInkStyle,
  resolveBannerOverlay,
  resolveFrame,
  resolveNameplate,
  type BadgeId,
  type BadgeRarity,
  type BannerOverlay,
  type CommentColor,
  type FrameId,
  type Nameplate,
  type Tier,
} from '@/lib/membership'
import { cn } from '@/lib/utils'
import { AvatarFrame } from './avatar-frame'
import { BannerOverlayLayer, ProfileBanner } from './banner-preset'
import { BadgeIcon } from './badge-icon'
import { BadgeTray } from './badge-tray'
import { NamePlate } from './nameplate'

export type CosmeticLook = {
  tier: Tier
  frame: string
  overlay: string
  commentColor: CommentColor
  nameplate?: string
  badges: BadgeId[]
  avatar?: string | null
  background?: string | null
  name: string
  username?: string
  /** Legacy fields some callers still pass; ignored. */
  effect?: string
  nameStyle?: string
}

type TabId = 'frame' | 'overlay' | 'plate' | 'ink' | 'badges'
type ApplyKey = 'frame' | 'overlay' | 'commentColor' | 'nameplate'

const TABS: { id: TabId; label: string }[] = [
  { id: 'frame', label: 'Avatar çerçevesi' },
  { id: 'overlay', label: 'Afiş çerçevesi' },
  { id: 'plate', label: 'İsim plakası' },
  { id: 'ink', label: 'Yorum mürekkebi' },
  { id: 'badges', label: 'Rozetler' },
]

const SAMPLE_BANNER = '/cosmetics/sample-banner.png'
const RARITY_ORDER: BadgeRarity[] = ['mythic', 'legendary', 'epic', 'rare', 'common']
const SAMPLE_COMMENT = 'Final bölümünü üç kez izledim; o son sahne hâlâ aklımda.'

function TierChip({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider',
        tier === 'free' ? 'bg-muted text-muted-foreground' : tier === 'plus' ? 'bg-primary/15 text-ink' : 'bg-foreground text-background',
      )}
    >
      {TIER_LABEL[tier]}
    </span>
  )
}

function StateMark({ busy, on, open }: { busy: boolean; on: boolean; open: boolean }) {
  if (busy) return <Loader2 className="size-4 animate-spin text-muted-foreground" />
  if (on)
    return (
      <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3" strokeWidth={3} />
      </span>
    )
  if (!open) return <Lock className="size-3.5 text-muted-foreground" />
  return null
}

export function CosmeticsStudio({ look: initial, interactive = true }: { look: CosmeticLook; interactive?: boolean }) {
  const router = useRouter()
  const [, start] = useTransition()
  const [tab, setTab] = useState<TabId>('frame')
  const [look, setLook] = useState<CosmeticLook>({
    ...initial,
    frame: resolveFrame(initial.frame),
    overlay: resolveBannerOverlay({ bannerOverlay: initial.overlay }),
    nameplate: resolveNameplate(initial.nameplate),
  })
  const [peek, setPeek] = useState<Partial<CosmeticLook>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const unlocked = (need: Tier) => TIER_RANK[look.tier] >= TIER_RANK[need]
  const shown = { ...look, ...peek }

  function apply<K extends ApplyKey>(key: K, value: string, need: Tier, label: string) {
    if (!interactive) {
      toast('Kozmetikleri kullanmak için giriş yap', { action: { label: 'Giriş', onClick: () => router.push('/giris') } })
      return
    }
    if (!unlocked(need)) {
      toast(`${label} ${TIER_LABEL[need]} gerektirir`, { action: { label: 'Planları gör', onClick: () => router.push('/abonelik') } })
      return
    }
    if (look[key] === value) return
    const prev = look[key]
    setLook((l) => ({ ...l, [key]: value }))
    setBusy(`${key}:${value}`)
    start(async () => {
      const res =
        key === 'frame'
          ? await setFrame(value as FrameId)
          : key === 'overlay'
            ? await setBannerOverlay(value as BannerOverlay)
            : key === 'nameplate'
              ? await setNameplate(value as Nameplate)
              : await setCommentColor(value as CommentColor)
      setBusy(null)
      if (!res.ok) {
        setLook((l) => ({ ...l, [key]: prev }))
        toast.error(res.error)
      } else {
        toast.success(`${label} uygulandı`)
        router.refresh()
      }
    })
  }

  const hover = (key: keyof CosmeticLook, value: string) => ({
    onPointerEnter: () => setPeek({ [key]: value } as Partial<CosmeticLook>),
    onPointerLeave: () => setPeek({}),
    onFocus: () => setPeek({ [key]: value } as Partial<CosmeticLook>),
    onBlur: () => setPeek({}),
  })

  const tile = (on: boolean) =>
    cn(
      'group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-primary',
      on ? 'border-primary bg-accent/60 shadow-[0_10px_30px_-15px_var(--primary)]' : 'border-border bg-card hover:-translate-y-0.5 hover:border-foreground/25',
    )

  const earned = new Set(look.badges)
  const banner = shown.background || SAMPLE_BANNER

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
      <aside className="flex flex-col gap-3 lg:sticky lg:top-24">
        <div className="dark relative isolate overflow-hidden rounded-[1.75rem] border border-border bg-scrim text-foreground shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]">
          <ProfileBanner src={banner} overlay={shown.overlay} dim={25} className="h-40" />
          <div className="relative -mt-12 flex flex-col items-center gap-3 px-5 pb-7 text-center">
            <AvatarFrame src={shown.avatar} name={shown.name} frame={shown.frame} className="size-24" />
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-2xl font-bold tracking-tight">
                <NamePlate plate={shown.nameplate}>{shown.name}</NamePlate>
              </p>
              {shown.username && <p className="mt-3 font-mono text-xs text-foreground/50">@{shown.username}</p>}
            </div>
            {look.badges.length > 0 && <BadgeTray ids={look.badges} max={6} />}
            <p className="w-full border-l-2 border-foreground/15 pl-3 text-left text-sm leading-relaxed">
              <span className={commentInkClass(shown.commentColor)} style={commentInkStyle(shown.commentColor)}>
                {SAMPLE_COMMENT}
              </span>
            </p>
          </div>
        </div>
        <p className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
          <span>{Object.keys(peek).length ? 'Önizleme — uygulamak için tıkla' : 'Canlı önizleme'}</span>
          {interactive && (
            <Link href="/ayarlar?tab=profil" className="flex items-center gap-1 font-medium text-ink hover:underline">
              <ImageIcon className="size-3.5" /> Afiş görselini değiştir
            </Link>
          )}
        </p>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="label-mono text-ink">Koleksiyon</p>
          <h3 className="text-balance text-2xl font-semibold tracking-tight">
            Kızıl Kurdele <span className="accent-serif">seti</span>
          </h3>
          <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">Gül altını pervaz, kızıl saten kurdeleler, yakut taşlar ve inci sarkıtlar. Avatarın, afişin ve ismin aynı takımı giyer.</p>
        </div>

        <div role="tablist" aria-label="Kozmetik kategorileri" className="scrollbar-none flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id)
                setPeek({})
              }}
              className={cn('relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition', tab === t.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {tab === t.id && <motion.span layoutId="cx-tab" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
            {tab === 'frame' && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {FRAMES.map((f) => {
                  const on = look.frame === f.id
                  return (
                    <li key={f.id}>
                      <button type="button" aria-pressed={on} onClick={() => apply('frame', f.id, f.tier, `${f.name} çerçevesi`)} {...hover('frame', f.id)} className={cn(tile(on), 'items-center gap-5 px-4 pb-6 pt-10 text-center')}>
                        <AvatarFrame src={look.avatar} name={look.name} frame={f.id} className="size-24 transition duration-500 group-hover:scale-[1.04]" />
                        <span className="mt-3 flex flex-col items-center gap-1.5">
                          <span className="text-base font-semibold">{f.name}</span>
                          <span className="max-w-[16rem] text-pretty text-xs leading-relaxed text-muted-foreground">{f.description}</span>
                        </span>
                        <span className="absolute right-3 top-3 flex items-center gap-2">
                          <TierChip tier={f.tier} />
                          <StateMark busy={busy === `frame:${f.id}`} on={on} open={unlocked(f.tier)} />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {tab === 'overlay' && (
              <div className="flex flex-col gap-4">
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Afiş çerçevesi <strong className="font-semibold text-foreground">kendi yüklediğin görselin üstüne</strong> oturur; görselin hiçbir zaman değişmez.
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {BANNER_OVERLAYS.map((o) => {
                    const on = look.overlay === o.id
                    return (
                      <li key={o.id}>
                        <button type="button" aria-pressed={on} onClick={() => apply('overlay', o.id, o.tier, `${o.name} afiş çerçevesi`)} {...hover('overlay', o.id)} className={tile(on)}>
                          <span className="relative block h-36 overflow-hidden bg-scrim">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={banner || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                            <BannerOverlayLayer overlay={o.id} />
                          </span>
                          <span className="flex items-center justify-between gap-3 px-4 py-3.5">
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-sm font-semibold">{o.name}</span>
                              <span className="line-clamp-1 text-xs text-muted-foreground">{o.description}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <TierChip tier={o.tier} />
                              <StateMark busy={busy === `overlay:${o.id}`} on={on} open={unlocked(o.tier)} />
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {tab === 'plate' && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {NAMEPLATES.map((pl) => {
                  const on = look.nameplate === pl.id
                  return (
                    <li key={pl.id}>
                      <button type="button" aria-pressed={on} onClick={() => apply('nameplate', pl.id, pl.tier, `${pl.name} plakası`)} {...hover('nameplate', pl.id)} className={cn(tile(on), 'gap-4 p-4')}>
                        <span className="dark grid h-28 place-items-center overflow-hidden rounded-xl bg-scrim bg-[radial-gradient(80%_120%_at_50%_0%,oklch(0.3_0.06_20),transparent)] px-4 text-foreground">
                          <span className="text-xl font-bold tracking-tight">
                            <NamePlate plate={pl.id}>{look.name}</NamePlate>
                          </span>
                        </span>
                        <span className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-sm font-semibold">{pl.name}</span>
                            <span className="line-clamp-1 text-xs text-muted-foreground">{pl.description}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <TierChip tier={pl.tier} />
                            <StateMark busy={busy === `nameplate:${pl.id}`} on={on} open={unlocked(pl.tier)} />
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {tab === 'ink' && (
              <div className="flex flex-col gap-4">
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Mürekkep, yorumlarındaki <strong className="font-semibold text-foreground">yazının kendisini</strong> boyar. Varaklı olanların üzerinden birkaç saniyede bir ışık geçer.
                </p>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {COMMENT_COLORS.map((c) => {
                    const on = look.commentColor === c.id
                    return (
                      <li key={c.id}>
                        <button type="button" aria-pressed={on} onClick={() => apply('commentColor', c.id, c.tier, `${c.name} mürekkebi`)} {...hover('commentColor', c.id)} className={cn(tile(on), 'gap-3 p-4')}>
                          <span className="min-h-12 text-pretty text-[15px] leading-relaxed">
                            <span className={commentInkClass(c.id)} style={commentInkStyle(c.id)}>
                              Harika bir bölümdü, müziği hâlâ kulağımda.
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-2 border-t border-border pt-3">
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              <span className="size-3.5 rounded-full ring-1 ring-border" style={{ background: c.from ? `linear-gradient(135deg, ${c.from}, ${c.to})` : 'var(--foreground)' }} />
                              {c.name}
                            </span>
                            <span className="flex items-center gap-2">
                              <TierChip tier={c.tier} />
                              <StateMark busy={busy === `commentColor:${c.id}`} on={on} open={unlocked(c.tier)} />
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {tab === 'badges' && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-4">
                  <p className="text-sm">
                    <span className="text-2xl font-bold tabular-nums">{look.badges.length}</span>
                    <span className="text-muted-foreground"> / {BADGE_IDS.length} rozet kazanıldı</span>
                  </p>
                  <div className="h-1.5 min-w-32 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${(look.badges.length / BADGE_IDS.length) * 100}%` }} />
                  </div>
                </div>
                {RARITY_ORDER.map((r) => {
                  const ids = BADGE_IDS.filter((id) => BADGES[id].rarity === r)
                  const got = ids.filter((id) => earned.has(id)).length
                  return (
                    <section key={r} className="flex flex-col gap-3" aria-label={`${RARITY[r].label} rozetler`}>
                      <h4 className="flex items-baseline justify-between gap-3">
                        <span className="text-base font-semibold">{RARITY[r].label}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {got}/{ids.length}
                        </span>
                      </h4>
                      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {ids.map((id) => {
                          const has = earned.has(id)
                          return (
                            <li key={id} className={cn('flex items-center gap-3 rounded-2xl border p-3 transition', has ? 'border-border bg-card' : 'border-dashed border-border/80')}>
                              <BadgeIcon id={id} size="md" locked={!has} tip={false} />
                              <span className="min-w-0 flex-1">
                                <span className={cn('block truncate text-sm font-semibold', !has && 'text-muted-foreground')}>{BADGES[id].name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{BADGES[id].description}</span>
                              </span>
                              {has ? <Check className="size-4 shrink-0 text-ink" /> : BADGES[id].auto ? <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Oto</span> : null}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {look.tier === 'free' && (
          <Link href="/abonelik" className="group flex items-center justify-between gap-4 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-4 text-sm transition hover:bg-primary/15">
            <span>
              <span className="font-semibold">Sytheris+ ile daha fazlası.</span> <span className="text-muted-foreground">Varaklı mürekkepler, hareketli afiş ve Gece Sineması.</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-ink transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  )
}
