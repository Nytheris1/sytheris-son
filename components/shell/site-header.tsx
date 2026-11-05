'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { themeName } from '@/lib/themes'
import { useTheme } from '@/components/providers/theme-provider'
import { ScrambleText } from './scramble-text'
import { ThemePicker } from './theme-picker'
import { UserMenu, type HeaderUser } from './user-menu'
import { CommandPalette } from './command-palette'
import { MusicButton } from '@/components/music/music-button'

export const NAV = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/ara', label: 'Keşfet' },
  { href: '/takvim', label: 'Takvim' },
  { href: '/rastgele', label: 'Rastgele' },
  { href: '/karsilastir', label: 'Karşılaştır' },
]

export function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target.closest('input, textarea, [contenteditable="true"]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300',
          scrolled ? 'glass border-border shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]' : 'border-transparent bg-background',
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="group flex shrink-0 flex-col leading-none" aria-label="SYTHERIS ana sayfa">
            <span className="text-[19px] font-bold tracking-[-0.02em] transition-colors group-hover:text-ink">SYTHERIS</span>
            <span className="mt-1.5 flex items-center gap-2">
              <span className="h-px w-5 bg-primary transition-all duration-500 group-hover:w-8" />
              <ScrambleText text={themeName(theme)} className="font-mono text-[9px] font-semibold uppercase tracking-[0.3em] text-ink" />
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Ana menü">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('relative rounded-full px-4 py-2 text-[15px] transition-colors', active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-muted"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground md:w-56 md:px-4"
              aria-label="Anime ara"
            >
              <Search className="size-4" />
              <span className="hidden md:inline">Anime ara…</span>
              <kbd className="ml-auto hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] md:inline">Ctrl K</kbd>
            </button>
            <div className="hidden md:block">
              <MusicButton />
            </div>
            <ThemePicker />
            <UserMenu user={user} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px origin-left bg-primary" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      </header>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
