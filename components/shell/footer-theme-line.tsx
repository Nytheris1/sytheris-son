'use client'

import { THEMES } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'

export function FooterThemeLine() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 font-mono uppercase tracking-[0.2em]">
        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
        Tüm sistemler çalışıyor
      </span>
      <span className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5" role="group" aria-label="Hızlı tema">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={(e) => setTheme(t.id, { x: e.clientX, y: e.clientY })}
            aria-label={t.name}
            aria-pressed={t.id === theme}
            className={cn('size-3.5 rounded-full ring-offset-2 ring-offset-card transition hover:scale-125', t.id === theme && 'ring-2 ring-foreground')}
            style={{ background: t.swatch }}
          />
        ))}
      </div>
    </div>
  )
}
