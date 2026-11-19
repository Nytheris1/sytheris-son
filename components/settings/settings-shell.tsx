'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Accessibility, Bot, ChevronRight, Clapperboard, Crown, HardDrive, Palette, PlayCircle, Search, ShieldUser, UserRound, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SettingsTab = {
  id: string
  label: string
  hint: string
  icon: 'profile' | 'appearance' | 'access' | 'cosmetics' | 'playback' | 'ai' | 'account' | 'data' | 'content'
  /** Sidebar group heading this tab sits under. */
  group?: string
  /** Extra words the settings search should match (e.g. "şifre", "altyazı"). */
  keywords?: string
}

const ICONS: Record<SettingsTab['icon'], LucideIcon> = {
  profile: UserRound,
  appearance: Palette,
  access: Accessibility,
  cosmetics: Crown,
  playback: PlayCircle,
  ai: Bot,
  account: ShieldUser,
  data: HardDrive,
  content: Clapperboard,
}

const OUT = [0.16, 1, 0.3, 1] as const

const fold = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu, '')

export function SettingsShell({
  tabs,
  panels,
  initial,
  identity,
}: {
  tabs: SettingsTab[]
  panels: Record<string, React.ReactNode>
  initial: string
  identity?: React.ReactNode
}) {
  const [active, setActive] = useState(tabs.some((t) => t.id === initial) ? initial : tabs[0].id)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = tabs.find((t) => t.id === active) ?? tabs[0]

  const visible = useMemo(() => {
    const q = fold(query.trim())
    if (!q) return tabs
    return tabs.filter((t) => fold(`${t.label} ${t.hint} ${t.keywords ?? ''}`).includes(q))
  }, [query, tabs])

  const go = (id: string) => {
    setActive(id)
    const next = new URLSearchParams(params.toString())
    next.set('tab', id)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Ayarlar <ChevronRight className="size-3" aria-hidden="true" /> <span className="text-ink">{current.label}</span>
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
            Senin <span className="accent-serif">düzenin.</span>
          </h1>
        </div>
        {identity}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Ayar bölümleri" className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
          <label className="relative hidden lg:block">
            <span className="sr-only">Ayarlarda ara</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ayarlarda ara…"
              className="h-11 w-full rounded-2xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </label>
          <ul className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
            {visible.map((t, i) => {
              const Icon = ICONS[t.icon]
              const on = t.id === active
              const heading = t.group && t.group !== visible[i - 1]?.group ? t.group : null
              return (
                <li key={t.id} className="shrink-0 snap-start">
                  {heading && <p className={cn('label-mono hidden px-3 pb-2 text-[10px] text-muted-foreground lg:block', i > 0 && 'pt-5')}>{heading}</p>}
                  <button
                    type="button"
                    onClick={() => go(t.id)}
                    aria-current={on ? 'page' : undefined}
                    className={cn(
                      'relative flex w-full items-center gap-3 rounded-full border px-3 py-2 text-left transition-colors lg:rounded-2xl lg:border-transparent lg:py-2.5',
                      on ? 'border-primary/40 bg-primary/10 text-foreground lg:bg-transparent' : 'border-border text-muted-foreground hover:text-foreground lg:hover:bg-muted/60',
                    )}
                  >
                    {on && <motion.span layoutId="settings-active" className="absolute inset-0 hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_-18px_rgb(0_0_0/0.35)] lg:block" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                    <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-xl transition-colors', on ? 'bg-primary text-primary-foreground' : 'lg:bg-muted')}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="relative flex min-w-0 flex-col">
                      <span className="whitespace-nowrap text-sm font-medium">{t.label}</span>
                      <span className="hidden truncate text-xs text-muted-foreground lg:block">{t.hint}</span>
                    </span>
                  </button>
                </li>
              )
            })}
            {!visible.length && <li className="px-3 py-2 text-sm text-muted-foreground">Eşleşen ayar yok.</li>}
          </ul>
        </nav>

        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: OUT }} className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center gap-4 pb-1">
              {(() => {
                const Icon = ICONS[current.icon]
                return (
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-ink ring-1 ring-primary/25">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                )
              })()}
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-2xl font-semibold tracking-tight">{current.label}</h2>
                <p className="text-sm text-muted-foreground">{current.hint}</p>
              </div>
            </div>
            {panels[active]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
