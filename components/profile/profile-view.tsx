'use client'

import Link from 'next/link'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, Copy, ExternalLink, Eye, Heart, MapPin, Pause, Pencil, Play, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import type { PublicUser } from '@/lib/users'
import { cn } from '@/lib/utils'
import { BrandIcon } from '@/components/ui-kit/brand-icon'
import { Avatar } from '@/components/shell/user-menu'
import { fmtTime } from '@/components/music/music-panel'

function Typewriter({ text, enabled }: { text: string; enabled: boolean }) {
  const [out, setOut] = useState(enabled ? '' : text)
  useEffect(() => {
    if (!enabled) return setOut(text)
    let i = 0
    setOut('')
    const id = window.setInterval(() => {
      i++
      setOut(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, 28)
    return () => window.clearInterval(id)
  }, [text, enabled])
  return (
    <span>
      {out}
      {enabled && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-primary" />}
    </span>
  )
}

const PROVIDER_LABEL: Record<string, string> = { discord: 'Discord ile bağlı', google: 'Google ile bağlı', github: 'GitHub ile bağlı', email: 'E-posta hesabı' }

export function ProfileView({ user, favorites, isOwner }: { user: PublicUser; favorites: { id: number; title: string; cover: string | null }[]; isOwner: boolean }) {
  const [entered, setEntered] = useState(false)
  const [views, setViews] = useState(user.views)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [copied, setCopied] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const card = useRef<HTMLDivElement>(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), { stiffness: 150, damping: 18 })

  const isVideo = Boolean(user.background && /\.(mp4|webm|mov)(\?|$)/i.test(user.background))

  useEffect(() => {
    const key = `sy-viewed-${user.username}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/profile/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username }) })
      .then((r) => r.json())
      .then((j) => j.views && setViews(j.views))
      .catch(() => {})
  }, [user.username])

  useEffect(() => {
    if (!user.song) return
    const a = new Audio(user.song.url)
    a.loop = true
    a.volume = 0.5
    audio.current = a
    const t = () => setProgress(a.currentTime)
    const m = () => setDuration(a.duration || 0)
    const p = () => setPlaying(true)
    const s = () => setPlaying(false)
    a.addEventListener('timeupdate', t)
    a.addEventListener('loadedmetadata', m)
    a.addEventListener('play', p)
    a.addEventListener('pause', s)
    return () => {
      a.pause()
      a.removeEventListener('timeupdate', t)
      a.removeEventListener('loadedmetadata', m)
      a.removeEventListener('play', p)
      a.removeEventListener('pause', s)
    }
  }, [user.song])

  function enter() {
    setEntered(true)
    window.dispatchEvent(new Event('sy:pause-music'))
    audio.current?.play().catch(() => {})
  }

  const joined = new Date(user.createdAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const badges = [
    { key: user.provider, label: PROVIDER_LABEL[user.provider], icon: user.provider === 'email' ? null : user.provider },
    ...(user.favorites.length >= 5 ? [{ key: 'collector', label: 'Koleksiyoncu', icon: null }] : []),
    ...(user.song ? [{ key: 'dj', label: 'Profil DJ', icon: null }] : []),
  ]

  return (
    <main data-theme={user.accent} className="dark relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-scrim px-4 py-16 text-foreground">
      <div className="absolute inset-0 -z-10">
        {user.background ? (
          isVideo ? (
            <video src={user.background} autoPlay muted loop playsInline className="size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.background || '/placeholder.svg'} alt="" className="size-full object-cover" />
          )
        ) : (
          <div className="size-full bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_35%,var(--scrim))_0%,var(--scrim)_65%)]" />
        )}
        <div className="absolute inset-0 bg-scrim" style={{ opacity: user.background ? user.backgroundDim / 100 : 0.2 }} />
        <div className="grain absolute inset-0" />
      </div>

      <AnimatePresence>
        {!entered && (
          <motion.button
            type="button"
            onClick={enter}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.7 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-scrim/60 backdrop-blur-2xl"
            aria-label="Profile gir"
          >
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.4, repeat: Infinity }} className="text-2xl font-semibold tracking-tight sm:text-3xl">
              tıkla ve <span className="font-serif font-normal italic text-primary">gir</span>
            </motion.span>
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">@{user.username}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        ref={card}
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={entered ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.15 }}
        onMouseMove={(e) => {
          if (!user.effects.tilt || !card.current) return
          const r = card.current.getBoundingClientRect()
          mx.set((e.clientX - r.left) / r.width - 0.5)
          my.set((e.clientY - r.top) / r.height - 0.5)
        }}
        onMouseLeave={() => {
          mx.set(0)
          my.set(0)
        }}
        style={user.effects.tilt ? { rotateX: rx, rotateY: ry, transformPerspective: 1000 } : undefined}
        className="relative w-full max-w-[460px]"
      >
        <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[2rem] border border-foreground/10 bg-foreground/[0.06] px-6 pb-6 pt-10 text-center shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className={cn('relative rounded-full p-[3px]', user.effects.glow && 'shadow-[0_0_60px_-5px_var(--primary)]')} style={{ background: 'conic-gradient(from 180deg, var(--primary), transparent 40%, var(--primary))' }}>
            <div className="rounded-full bg-scrim p-1">
              <Avatar user={user} className="size-28" />
            </div>
            <span className="absolute bottom-2 right-2 size-4 rounded-full border-[3px] border-scrim bg-primary" aria-label="Çevrimiçi" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <h1 className={cn('text-balance text-3xl font-bold tracking-tight sm:text-4xl', user.effects.glow && '[text-shadow:0_0_24px_color-mix(in_oklch,var(--primary)_70%,transparent)]')}>{user.displayName}</h1>
            <p className="font-mono text-sm text-foreground/55">@{user.username}</p>
          </div>
          <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Rozetler">
            {badges.map((b) => (
              <li key={b.key} title={b.label} className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[11px] text-foreground/80">
                {b.icon ? <BrandIcon name={b.icon} className="size-3.5 text-foreground" /> : <Heart className="size-3 text-primary" />}
                {b.label}
              </li>
            ))}
          </ul>
          {user.bio && (
            <p className="min-h-12 max-w-sm text-pretty leading-relaxed text-foreground/80">
              <Typewriter text={user.bio} enabled={entered && user.effects.typewriter} />
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-foreground/55">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {user.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" /> {joined}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" /> {views.toLocaleString('tr-TR')} görüntülenme
            </span>
          </div>

          {user.links.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-2">
              {user.links.map((l, i) => {
                const isHandle = l.type === 'discord' && !l.url.startsWith('http')
                const inner = l.type === 'website' ? <ExternalLink className="size-5" /> : <BrandIcon name={l.type} className="size-5 text-foreground" />
                return (
                  <motion.li key={i} initial={{ opacity: 0, y: 10 }} animate={entered ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 + i * 0.06 }}>
                    {isHandle ? (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(l.url)
                          toast.success('Discord kullanıcı adı kopyalandı')
                        }}
                        aria-label={`Discord: ${l.url}`}
                        className="grid size-12 place-items-center rounded-2xl border border-foreground/10 bg-foreground/5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_0_24px_-6px_var(--primary)]"
                      >
                        {inner}
                      </button>
                    ) : (
                      <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={l.type} className="grid size-12 place-items-center rounded-2xl border border-foreground/10 bg-foreground/5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_0_24px_-6px_var(--primary)]">
                        {inner}
                      </a>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          )}

          {user.song && (
            <div className="flex w-full items-center gap-3 rounded-2xl border border-foreground/10 bg-scrim/40 p-2.5 text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.song.cover || '/placeholder.svg'} alt="" className={cn('size-12 rounded-xl object-cover', playing && 'animate-[spin_12s_linear_infinite] rounded-full')} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.song.title}</p>
                <p className="truncate text-xs text-foreground/55">{user.song.artist}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/15">
                    <div className="h-full bg-primary transition-[width] duration-300" style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }} />
                  </div>
                  <span className="font-mono text-[10px] text-foreground/50">{fmtTime(progress)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!audio.current) return
                  audio.current.muted = !muted
                  setMuted(!muted)
                }}
                aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}
                className="grid size-9 place-items-center rounded-full text-foreground/70 transition hover:bg-foreground/10"
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => (playing ? audio.current?.pause() : audio.current?.play())}
                aria-label={playing ? 'Duraklat' : 'Oynat'}
                className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"
              >
                {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
              </button>
            </div>
          )}

          {favorites.length > 0 && (
            <div className="w-full">
              <p className="label-mono mb-2 text-left text-[9px] text-foreground/50">Favori animeler</p>
              <ul className="grid grid-cols-4 gap-2">
                {favorites.slice(0, 8).map((f) => (
                  <li key={f.id}>
                    <Link href={`/anime/${f.id}`} className="group block overflow-hidden rounded-xl ring-1 ring-foreground/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.cover || '/placeholder.svg'} alt={f.title} className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-110" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(location.href)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1600)
            }}
            className="flex h-10 items-center gap-2 rounded-full border border-foreground/10 bg-scrim/40 px-4 font-mono text-[11px] text-foreground/70 backdrop-blur transition hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            sytheris/u/{user.username}
          </button>
          {isOwner && (
            <Link href="/profil" className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
              <Pencil className="size-3.5" /> Düzenle
            </Link>
          )}
          <Link href="/" className="flex h-10 items-center rounded-full border border-foreground/10 bg-scrim/40 px-4 text-sm font-bold tracking-tight text-foreground/80 backdrop-blur transition hover:text-foreground">
            SYTHERIS
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
