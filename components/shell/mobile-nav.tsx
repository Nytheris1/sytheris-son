'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { CalendarDays, Clapperboard, Compass, Dices, Home, LibraryBig, Search, Tv , Flame, Images, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContentMode } from '@/lib/content-mode-shared'
import { isActive } from './site-header'

const ITEMS = [
  { href: '/', label: 'Ana Sayfa', icon: Home },
  { href: '/ara', label: 'Keşfet', icon: Compass },
  { href: '/rastgele', label: 'Rastgele', icon: Dices, center: true },
  { href: '/takvim', label: 'Takvim', icon: CalendarDays },
  { href: '/kutuphane', label: 'Kütüphane', icon: LibraryBig },
]

const FILM_ITEMS = [
  { href: '/', label: 'Ana Sayfa', icon: Home },
  { href: '/filmler', label: 'Filmler', icon: Clapperboard },
  { href: '/rastgele', label: 'Rastgele', icon: Dices, center: true },
  { href: '/diziler', label: 'Diziler', icon: Tv },
  { href: '/sinema-ara', label: 'Ara', icon: Search },
]

const HENTAI_ITEMS = [
  { href: '/', label: 'Ana Sayfa', icon: Home },
  { href: '/hentai', label: 'Hentai', icon: Flame },
  { href: '/galeri', label: 'Rule34', icon: Images, center: true },
  { href: '/porno', label: 'Porno', icon: Video },
  { href: '/kutuphane', label: 'Kutuphane', icon: LibraryBig },
]

export function MobileNav({ mode = 'anime' }: { mode?: ContentMode }) {
  const pathname = usePathname()
  const items = mode === 'film' ? FILM_ITEMS : mode === 'hentai' ? HENTAI_ITEMS : ITEMS
  return (
    <nav
      className="glass fixed inset-x-3 bottom-3 z-50 rounded-[1.75rem] border border-border shadow-2xl shadow-black/20 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobil menü"
    >
      <ul className="flex items-end">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          if (item.center) {
            return (
              <li key={item.href} className="flex flex-1 justify-center">
                <Link href={item.href} aria-current={active ? 'page' : undefined} aria-label={item.label} className="relative -mt-6 mb-2 flex flex-col items-center gap-1">
                  <motion.span
                    whileTap={{ scale: 0.9, rotate: -12 }}
                    className={cn(
                      'grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_30px_-8px_var(--primary)] ring-4 ring-background transition',
                      active && 'rotate-6',
                    )}
                  >
                    <item.icon className="size-6" />
                  </motion.span>
                  <span className={cn('text-[10px] font-medium', active ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
                </Link>
              </li>
            )
          }
          return (
            <li key={item.href} className="flex-1">
              <Link href={item.href} aria-current={active ? 'page' : undefined} className="relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium">
                {active && <motion.span layoutId="mnav" className="absolute inset-x-1.5 inset-y-1 -z-10 rounded-2xl bg-accent" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <item.icon className={cn('size-5 transition', active ? 'text-ink' : 'text-muted-foreground')} />
                <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
