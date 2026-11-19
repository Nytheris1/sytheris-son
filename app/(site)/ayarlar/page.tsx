import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowUpRight, LogIn, Sparkles } from 'lucide-react'
import { getManyAnime } from '@/lib/anilist'
import { pickTitle } from '@/lib/format'
import { PLANS } from '@/lib/membership'
import { passwordEmailOf, toPublic } from '@/lib/users'
import { getViewer } from '@/lib/viewer'
import { AvatarFrame } from '@/components/membership/avatar-frame'
import { BadgeRow } from '@/components/membership/badge-icon'
import { CosmeticsStudio } from '@/components/membership/cosmetics-studio'
import { ProfileEditor } from '@/components/profile/profile-editor'
import { AccountPanel } from '@/components/settings/account-panel'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { CustomThemeStudio } from '@/components/settings/custom-theme-studio'
import { SettingsShell, type SettingsTab } from '@/components/settings/settings-shell'
import { ContentModePanel } from '@/components/settings/content-mode-panel'
import { getContentMode } from '@/lib/content-mode'

export const metadata: Metadata = { title: 'Ayarlar' }

const WRAP = 'mx-auto flex w-full max-w-[1240px] flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10'

const ICERIK: SettingsTab = { id: 'icerik', label: 'İçerik modu', hint: 'Anime ya da anime olmayan sinema', icon: 'content', group: 'Deneyim', keywords: 'film sinema mod anime değiştir' }
const GORUNUM: SettingsTab = { id: 'gorunum', label: 'Görünüm', hint: 'Tema, renk modu ve özel tema', icon: 'appearance', group: 'Deneyim', keywords: 'renk karanlık açık koyu intro' }
const ERISIM: SettingsTab = { id: 'erisim', label: 'Erişilebilirlik', hint: 'Yazı boyutu, hareket, odak, kısayollar', icon: 'access', group: 'Deneyim', keywords: 'animasyon klavye bağlantı puan font' }
const OYNATMA: SettingsTab = { id: 'oynatma', label: 'Oynatma', hint: 'Fragman, hız, altyazı, veri tasarrufu', icon: 'playback', group: 'Deneyim', keywords: 'video ses özet dil' }
const ASISTAN: SettingsTab = { id: 'asistan', label: 'Yapay zekâ', hint: 'Asistan sağlayıcısı ve model', icon: 'ai', group: 'Deneyim', keywords: 'ollama gemini sohbet' }
const VERI: SettingsTab = { id: 'veri', label: 'Cihaz verisi', hint: 'Yedekle, geri yükle, temizle', icon: 'data', group: 'Cihaz', keywords: 'sıfırla dışa aktar sil' }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [viewer, sp, mode] = await Promise.all([getViewer().catch(() => null), searchParams, getContentMode()])

  if (!viewer) {
    const tabs: SettingsTab[] = [ICERIK, GORUNUM, ERISIM, OYNATMA, ASISTAN, VERI]
    return (
      <div className={WRAP}>
        <Suspense>
          <SettingsShell
            tabs={tabs}
            initial={sp.tab ?? 'icerik'}
            identity={
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Bu tercihler cihazında saklanır. Profil ve hesap ayarları için giriş yap.</p>
                <Link href="/giris" className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                  <LogIn className="size-4" aria-hidden="true" /> Giriş yap
                </Link>
              </div>
            }
            panels={{
              icerik: <ContentModePanel mode={mode} />,
              gorunum: (
                <div className="flex flex-col gap-4">
                  <SettingsPanel only="appearance" />
                  <CustomThemeStudio tier="free" loggedIn={false} initialThemes={[]} />
                </div>
              ),
              erisim: <SettingsPanel only="access" />,
              oynatma: <SettingsPanel only="playback" />,
              asistan: <SettingsPanel only="ai" />,
              veri: <SettingsPanel only="data" />,
            }}
          />
        </Suspense>
      </div>
    )
  }

  const { user, header } = viewer
  const favs = await getManyAnime(user.favorites.slice(0, 24))
  const plan = PLANS.find((p) => p.id === header.tier)
  const tabs: SettingsTab[] = [
    { id: 'profil', label: 'Profil', hint: 'Fotoğraf, afiş, biyografi, bağlantılar', icon: 'profile', group: 'Hesabın', keywords: 'avatar isim kullanıcı adı favori' },
    { id: 'kozmetik', label: 'Kozmetik', hint: 'Kızıl Kurdele seti, mürekkep, rozetler', icon: 'cosmetics', group: 'Hesabın', keywords: 'abonelik plus rozet çerçeve plaka yorum rengi' },
    { id: 'hesap', label: 'Hesap ve güvenlik', hint: 'E-posta, şifre, oturumlar, hesabı sil', icon: 'account', group: 'Hesabın', keywords: 'parola giriş çıkış güvenlik doğrulama' },
    ICERIK,
    GORUNUM,
    ERISIM,
    OYNATMA,
    ASISTAN,
    VERI,
  ]

  return (
    <div className={WRAP}>
      <Suspense>
        <SettingsShell
          tabs={tabs}
          initial={sp.tab ?? 'profil'}
          identity={
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3 pr-4">
              <AvatarFrame src={header.avatar} name={header.displayName} frame={header.frame} className="size-12 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-lg font-semibold tracking-tight">{header.displayName}</span>
                  {header.tier !== 'free' && (
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                      <Sparkles className="size-3" /> {plan?.name}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-foreground/50">@{header.username}</span>
                <BadgeRow ids={header.badges} size="sm" max={8} />
              </div>
              <Link href={`/u/${header.username}`} className="flex h-10 items-center gap-1.5 rounded-full border border-foreground/20 px-4 text-sm font-medium backdrop-blur transition hover:border-primary hover:text-ink">
                Profilimi gör <ArrowUpRight className="size-4" />
              </Link>
            </div>
          }
          panels={{
            icerik: <ContentModePanel mode={mode} />,
            profil: <ProfileEditor user={toPublic(user)} favorites={favs.map((m) => ({ id: m.id, title: pickTitle(m.title), cover: m.coverImage.large ?? null }))} />,
            kozmetik: (
              <CosmeticsStudio
                look={{
                  tier: header.tier,
                  frame: header.frame ?? 'none',
                  overlay: header.bannerOverlay ?? 'none',
                  commentColor: header.commentColor ?? 'default',
                  nameplate: header.nameplate ?? 'none',
                  badges: header.badges,
                  avatar: header.avatar,
                  background: header.background,
                  name: header.displayName,
                  username: header.username,
                }}
              />
            ),
            gorunum: (
              <div className="flex flex-col gap-4">
                <SettingsPanel only="appearance" />
                <CustomThemeStudio tier={header.tier} loggedIn initialThemes={user.customThemes ?? []} />
              </div>
            ),
            erisim: <SettingsPanel only="access" />,
            oynatma: <SettingsPanel only="playback" />,
            asistan: <SettingsPanel only="ai" />,
            hesap: (
              <AccountPanel
                provider={user.provider}
                email={user.email}
                passwordEmail={passwordEmailOf(user)}
                memberSince={user.createdAt}
                username={user.username}
                displayName={user.displayName}
                logins={user.security?.logins ?? []}
                passwordChangedAt={user.security?.passwordChangedAt}
                revokedAt={user.security?.revokedAt}
                emailVerified={user.emailVerified}
              />
            ),
            veri: <SettingsPanel only="data" />,
          }}
        />
      </Suspense>
    </div>
  )
}
