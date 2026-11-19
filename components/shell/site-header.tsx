'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { LogIn, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HeaderUser } from '@/lib/viewer-types'
import type { ContentMode } from '@/lib/content-mode-shared'
import { CommandPalette } from './command-palette'
import { ProfilePanel } from './profile-panel'
import { MusicButton } from '@/components/music/music-button'

export const NAV: { href: string; label: string; plus?: boolean }[] = [
  { href: '/ara', label: 'Keşfet' },
  { href: '/manga', label: 'Manga' },
  { href: '/takvim', label: 'Takvim' },
  { href: '/atolye', label: 'Galeri', plus: true },
  { href: '/korku', label: 'Korku' },
]

export const FILM_NAV: { href: string; label: string; plus?: boolean }[] = [
  { href: '/filmler', label: 'Filmler' },
  { href: '/diziler', label: 'Diziler' },
  { href: '/rastgele', label: 'Rastgele' },
  { href: '/atolye', label: 'Galeri', plus: true },
  { href: '/korku', label: 'Korku' },
]

export function isActive(pathname: string, href: string, search?: URLSearchParams | null) {
  const [path, query] = href.split('?')
  if (query) return pathname === path && (search?.toString() ?? '') === query
  if (path === '/filmler') return pathname === '/filmler' || pathname.startsWith('/film/')
  if (path === '/diziler') return pathname === '/diziler' || pathname.startsWith('/dizi/')
  return path === '/' ? pathname === '/' : pathname.startsWith(path)
}

export function SiteHeader({ user, mode = 'anime' }: { user: HeaderUser | null; mode?: ContentMode }) {
  const items = mode === 'film' ? FILM_NAV : NAV
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const lastY = useRef(0)
  const holdTimer = useRef<number | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      setScrolled(y > 24)
      if (y < 420) {
        setHidden(false)
        lastY.current = y
      } else if (Math.abs(delta) > 8) {
        setHidden(delta > 0)
        lastY.current = y
      }
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, y / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target.closest('input, textarea, select, [contenteditable="true"]')
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const startHold = () => {
    holdTimer.current = window.setTimeout(() => router.push('/sy-core'), 2600)
  }
  const endHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          hidden && !searchOpen ? '-translate-y-[120%]' : 'translate-y-0',
        )}
      >
        <div
          className={cn(
            'mx-auto flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            scrolled
              ? 'mt-2 h-14 max-w-5xl rounded-full border border-border bg-popover/90 px-2 pl-5 backdrop-blur-xl backdrop-saturate-150 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)] sm:mt-3 [width:calc(100%-1.5rem)]'
              : 'h-16 w-full max-w-[1440px] border-b border-transparent bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-10',
          )}
        >
          <Link
            href="/"
            className="group flex shrink-0 select-none flex-col leading-none"
            aria-label="SYTHERIS ana sayfa"
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className="text-[19px] font-bold tracking-[-0.02em] transition-colors group-hover:text-ink">SYTHERIS</span>
          </Link>

          <nav className="mx-auto hidden items-center gap-0.5 md:flex" aria-label="Ana menü">
            {items.map((item) => {
              const active = isActive(pathname, item.href, searchParams)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('relative whitespace-nowrap rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors xl:px-4', active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  {item.label}
                  {item.plus ? (
                    <sup className={cn('ml-0.5 font-mono text-[10px] font-bold', active ? 'text-primary-foreground' : 'text-ink')} aria-label="Sytheris+">
                      +
                    </sup>
                  ) : null}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground lg:w-48 lg:px-4"
              aria-label="Ara"
            >
              <Search className="size-4" />
              <span className="hidden lg:inline">Ara…</span>
              <kbd className="ml-auto hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] lg:inline">Ctrl K</kbd>
            </button>
            <MusicButton />
            {user ? (
              <ProfilePanel user={user} />
            ) : (
              <Link
                href="/giris"
                className="flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-primary hover:text-primary-foreground"
              >
                <LogIn className="size-4" />
                <span className="hidden sm:inline">Giriş yap</span>
                <span className="sr-only sm:hidden">Giriş yap</span>
              </Link>
            )}
          </div>
        </div>
        <div
          className={cn('pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-primary transition-opacity', scrolled ? 'opacity-0' : 'opacity-100')}
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden="true"
        />
      </header>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
