'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { CalendarDays, Compass, Home, Shuffle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMusic } from '@/components/music/music-provider'
import { Equalizer } from '@/components/music/music-button'
import { isActive } from './site-header'

export function MobileNav({ username }: { username?: string | null }) {
  const pathname = usePathname()
  const music = useMusic()
  const items = [
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/ara', label: 'Keşfet', icon: Compass },
    { href: '/rastgele', label: 'Rastgele', icon: Shuffle },
    { href: '/takvim', label: 'Takvim', icon: CalendarDays },
    { href: username ? `/u/${username}` : '/giris', label: username ? 'Profil' : 'Giriş', icon: User },
  ]
  const showFloatingButton = !(music.current && !music.panelOpen)
  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-border shadow-2xl shadow-black/15 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Mobil menü">
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.label} className="flex-1">
              <Link href={item.href} aria-current={active ? 'page' : undefined} className="relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium">
                {active && <motion.span layoutId="mnav" className="absolute inset-x-2 inset-y-1 -z-10 rounded-2xl bg-accent" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <item.icon className={cn('size-5', active ? 'text-ink' : 'text-muted-foreground')} />
                <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
      {showFloatingButton && (
        <button
          type="button"
          onClick={() => music.setPanelOpen(true)}
          aria-label="Müzik panelini aç"
          className={cn(
            'absolute -top-14 right-0 grid size-12 place-items-center rounded-full border border-border shadow-lg transition',
            music.playing ? 'bg-primary text-primary-foreground' : 'glass text-foreground',
          )}
        >
          <Equalizer playing={music.playing} />
        </button>
      )}
    </nav>
  )
}