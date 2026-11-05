'use client'

import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { THEMES, type ThemeMode } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import { Popover } from '@/components/ui-kit/popover'

const MODES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Açık', icon: Sun },
  { id: 'dark', label: 'Koyu', icon: Moon },
  { id: 'system', label: 'Sistem', icon: Monitor },
]

export function ThemePanel({ onPick }: { onPick?: () => void }) {
  const { theme, mode, setTheme, setMode } = useTheme()
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => {
          const active = t.id === theme
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={(e) => {
                setTheme(t.id, { x: e.clientX, y: e.clientY })
                onPick?.()
              }}
              className={cn(
                'group relative flex items-center gap-2.5 overflow-hidden rounded-2xl border p-2.5 text-left transition',
                active ? 'border-primary bg-accent' : 'border-border hover:border-foreground/20 hover:bg-muted',
              )}
            >
              <span className="relative grid size-7 shrink-0 place-items-center rounded-full ring-2 ring-background" style={{ background: t.swatch }}>
                {active && <Check className="size-3.5 text-on-scrim mix-blend-difference" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{t.name}</span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{t.hex}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1" role="radiogroup" aria-label="Görünüm">
        {MODES.map((m) => {
          const Icon = m.icon
          const active = m.id === mode
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={(e) => setMode(m.id, { x: e.clientX, y: e.clientY })}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition',
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ThemePicker() {
  const { theme } = useTheme()
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]
  return (
    <Popover
      label="Tema seç"
      className="w-[min(92vw,340px)] p-3"
      trigger={({ open, toggle, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Tema seç"
          className="flex h-10 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm transition hover:border-primary/50"
        >
          <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-[0.2em] xl:inline">{current.name}</span>
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-1 pt-1">
            <p className="text-sm font-semibold">
              Tema <span className="accent-serif text-base">seç</span>
            </p>
            <p className="label-mono text-[9px] text-muted-foreground">6 renk · 3 mod</p>
          </div>
          <ThemePanel onPick={close} />
        </div>
      )}
    </Popover>
  )
}