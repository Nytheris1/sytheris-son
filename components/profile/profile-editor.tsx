'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ExternalLink, Loader2, Music2, Plus, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile, type ProfileInput } from '@/app/actions/profile'
import type { PublicUser } from '@/lib/users'
import { THEMES } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { BrandIcon } from '@/components/ui-kit/brand-icon'
import { MusicSearch } from '@/components/music/music-panel'
import { Card } from '@/components/settings/settings-panel'
import { AvatarFrame } from '@/components/membership/avatar-frame'
import { ProfileBanner } from '@/components/membership/banner-preset'
import { NamePlate } from '@/components/membership/nameplate'
import { resolveBannerOverlay } from '@/lib/membership'
import { MediaPicker } from './media-picker'

const LINK_TYPES = [
  ['discord', 'Discord'],
  ['github', 'GitHub'],
  ['instagram', 'Instagram'],
  ['x', 'X'],
  ['youtube', 'YouTube'],
  ['spotify', 'Spotify'],
  ['twitch', 'Twitch'],
  ['tiktok', 'TikTok'],
  ['steam', 'Steam'],
  ['website', 'Web sitesi'],
] as const

const input = 'h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary'

export function ProfileEditor({ user, favorites }: { user: PublicUser; favorites: { id: number; title: string; cover: string | null }[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [songPicker, setSongPicker] = useState(false)
  const [favs, setFavs] = useState(favorites)
  const [form, setForm] = useState<ProfileInput>({
    displayName: user.displayName,
    username: user.username,
    bio: user.bio,
    location: user.location,
    avatar: user.avatar ?? '',
    background: user.background ?? '',
    backgroundDim: user.backgroundDim,
    accent: user.accent,
    links: user.links,
    song: user.song,
    favorites: user.favorites,
    effects: user.effects,
  })
  const set = <K extends keyof ProfileInput>(k: K, v: ProfileInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  function save() {
    start(async () => {
      const res = await updateProfile({ ...form, favorites: favs.map((f) => f.id) })
      if (!res.ok) toast.error(res.error)
      else {
        toast.success('Profil kaydedildi', { action: { label: 'Görüntüle', onClick: () => router.push(`/u/${res.username}`) } })
        router.refresh()
      }
    })
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <Card title="Kimlik" accent="bilgileri">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Görünen ad</span>
              <input className={input} value={form.displayName} maxLength={40} onChange={(e) => set('displayName', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Kullanıcı adı</span>
              <div className="flex items-center rounded-2xl border border-border bg-background pl-4 focus-within:border-primary">
                <span className="font-mono text-xs text-muted-foreground">/u/</span>
                <input className="h-12 flex-1 bg-transparent pr-4 text-sm outline-none" value={form.username} maxLength={20} onChange={(e) => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} />
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              <span className="flex justify-between text-muted-foreground">
                Biyografi <span className="font-mono text-xs">{form.bio.length}/300</span>
              </span>
              <textarea className="min-h-24 rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed outline-none focus:border-primary" value={form.bio} maxLength={300} onChange={(e) => set('bio', e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Konum</span>
              <input className={input} value={form.location} maxLength={60} placeholder="İstanbul, TR" onChange={(e) => set('location', e.target.value)} />
            </label>
            <div className="sm:col-span-2">
              <MediaPicker kind="avatar" label="Profil fotoğrafı" value={form.avatar} onChange={(v) => set('avatar', v)} hint="PNG, JPG, WebP · GIF ve MP4 hareketli avatar Sytheris+ · en fazla 2 MB, 15 sn" />
            </div>
          </div>
        </Card>

        <Card title="Görünüm ve" accent="arka plan">
          <div className="mt-4 flex flex-col gap-5">
            <MediaPicker kind="banner" label="Afiş / arka plan" value={form.background} onChange={(v) => set('background', v)} hint="Görsel · GIF ve MP4/WebM video Sytheris+ · en fazla 4 MB, 30 sn" />
            <Link href="/ayarlar?tab=kozmetik" className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-sm transition hover:border-primary">
              <span>
                <span className="font-medium">Afişine efekt ekle</span>
                <span className="text-muted-foreground"> — kar, aurora, hologram ve 25+ efekt görselinin üstünde oynar.</span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-ink" />
            </Link>
            <label className="flex flex-col gap-2 text-sm">
              <span className="flex justify-between text-muted-foreground">
                Karartma <span className="font-mono text-xs">%{form.backgroundDim}</span>
              </span>
              <input type="range" min={0} max={90} value={form.backgroundDim} onChange={(e) => set('backgroundDim', Number(e.target.value))} className="accent-[var(--primary)]" />
            </label>
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-muted-foreground">Vurgu rengi</span>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button key={t.id} type="button" aria-pressed={form.accent === t.id} onClick={() => set('accent', t.id)} className={cn('flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition', form.accent === t.id ? 'border-foreground' : 'border-border hover:border-foreground/40')}>
                    <span className="size-4 rounded-full" style={{ background: t.swatch }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Profil" accent="şarkısı">
          <div className="mt-4 flex flex-col gap-4">
            {form.song ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.song.cover || '/placeholder.svg'} alt="" className="size-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{form.song.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{form.song.artist}</p>
                </div>
                <button type="button" onClick={() => set('song', null)} aria-label="Şarkıyı kaldır" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Profilinde ziyaretçilerin isterse dinleyebileceği şarkıyı seç. Adını yaz, bul ve seç.</p>
            )}
            <button type="button" onClick={() => setSongPicker((v) => !v)} className="flex h-11 w-fit items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:border-primary">
              {songPicker ? <X className="size-4" /> : <Music2 className="size-4" />}
              {songPicker ? 'Kapat' : form.song ? 'Şarkıyı değiştir' : 'Şarkı seç'}
            </button>
            {songPicker && (
              <MusicSearch
                pickLabel="Seç"
                pickedIds={[]}
                sources={['anime']}
                onPick={(t) => {
                  set('song', { title: t.title, artist: t.artist, url: t.url, cover: t.cover ?? null })
                  setSongPicker(false)
                  toast.success(`"${t.title}" profil şarkısı olarak seçildi`)
                }}
              />
            )}
          </div>
        </Card>

        <Card title="Sosyal" accent="bağlantılar">
          <ul className="mt-4 flex flex-col gap-2">
            {form.links.map((l, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border">
                  {l.type === 'website' ? <ExternalLink className="size-4" /> : <BrandIcon name={l.type} />}
                </span>
                <select
                  value={l.type}
                  onChange={(e) => set('links', form.links.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
                  className="h-12 rounded-2xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  aria-label="Bağlantı türü"
                >
                  {LINK_TYPES.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
                <input className={input} value={l.url} placeholder={l.type === 'discord' ? 'kullanıcı adı veya davet linki' : 'https://…'} onChange={(e) => set('links', form.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} aria-label="Bağlantı adresi" />
                <button type="button" onClick={() => set('links', form.links.filter((_, j) => j !== i))} aria-label="Bağlantıyı sil" className="grid size-12 shrink-0 place-items-center rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {form.links.length < 8 && (
            <button type="button" onClick={() => set('links', [...form.links, { type: 'instagram', url: '' }])} className="mt-3 flex h-11 items-center gap-2 rounded-full border border-dashed border-border px-5 text-sm transition hover:border-primary hover:text-ink">
              <Plus className="size-4" /> Bağlantı ekle
            </button>
          )}
        </Card>

        <Card title="Favori" accent="animeler">
          {favs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Anime sayfalarındaki “Favorilere ekle” butonuyla buraya ekleyebilirsin.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {favs.map((f) => (
                <li key={f.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.cover || '/placeholder.svg'} alt={f.title} className="aspect-[2/3] w-full rounded-xl object-cover" />
                  <button type="button" onClick={() => setFavs(favs.filter((x) => x.id !== f.id))} aria-label={`${f.title} favorilerden çıkar`} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-scrim/70 text-on-scrim opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
        <div data-theme={form.accent} className="flex flex-col overflow-hidden rounded-[2rem] border border-border bg-card">
          <div className="dark">
            <ProfileBanner src={form.background || null} dim={form.background ? form.backgroundDim : 30} overlay={resolveBannerOverlay(user)} className="h-32" />
          </div>
          <div className="-mt-10 flex flex-col gap-3 px-5 pb-6">
            <span className="w-fit rounded-full bg-card p-1">
              <AvatarFrame src={form.avatar || null} name={form.displayName} frame={user.frame} className="size-20" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-bold tracking-tight">
                <NamePlate plate={user.nameplate}>{form.displayName}</NamePlate>
              </p>
              <p className="font-mono text-xs text-muted-foreground">@{form.username}</p>
            </div>
            {form.bio && <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{form.bio}</p>}
            {form.links.length > 0 && (
              <div className="flex gap-2">
                {form.links.slice(0, 6).map((l, i) => (
                  <span key={i} className="grid size-8 place-items-center rounded-full bg-muted">
                    {l.type === 'website' ? <ExternalLink className="size-3.5" /> : <BrandIcon name={l.type} className="size-4" />}
                  </span>
                ))}
              </div>
            )}
            <p className="label-mono pt-1 text-[10px] text-muted-foreground">Canlı önizleme</p>
          </div>
        </div>
        <button type="button" onClick={save} disabled={pending} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-70">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Değişiklikleri kaydet
        </button>
        <Link href={`/u/${user.username}`} className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border text-sm font-medium transition hover:border-primary">
          Profilimi görüntüle <ExternalLink className="size-4" />
        </Link>
      </aside>
    </div>
  )
}
