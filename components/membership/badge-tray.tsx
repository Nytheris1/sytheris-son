'use client'

import { Popover } from '@/components/ui-kit/popover'
import { BADGES, RARITY, sortBadges, type BadgeId } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { BadgeIcon } from './badge-icon'

/**
 * A single tidy row of a user's rarest badges. Everything beyond `max` folds into a "+N" chip
 * that opens the full, scrollable collection — so twenty badges never push the profile apart.
 */
export function BadgeTray({ ids, max = 5, className, tone = 'dark' }: { ids: BadgeId[]; max?: number; className?: string; tone?: 'dark' | 'light' }) {
  const sorted = sortBadges(ids)
  if (!sorted.length) return null
  const shown = sorted.slice(0, max)
  const hidden = sorted.length - shown.length

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <ul className="flex items-center gap-1" aria-label={`Rozetler, toplam ${sorted.length}`}>
        {shown.map((b) => (
          <li key={b}>
            <BadgeIcon id={b} size="sm" />
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <Popover
          label="Tüm rozetler"
          align="end"
          className="w-[min(92vw,22rem)]"
          trigger={({ open, toggle, ref }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label={`${hidden} rozet daha göster`}
              className={cn(
                'grid h-[1.625rem] min-w-[1.625rem] place-items-center rounded-full px-2 font-mono text-[11px] font-semibold tabular-nums transition',
                tone === 'dark' ? 'bg-on-scrim/10 text-on-scrim/80 hover:bg-on-scrim/20' : 'bg-muted text-muted-foreground hover:text-foreground',
                open && 'ring-2 ring-primary',
              )}
            >
              +{hidden}
            </button>
          )}
        >
          {() => (
            <div className="flex flex-col gap-3 p-3">
              <p className="flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Rozet koleksiyonu <span className="tabular-nums">{sorted.length}</span>
              </p>
              <ul className="grid max-h-80 grid-cols-1 gap-1 overflow-y-auto pr-1">
                {sorted.map((b) => (
                  <li key={b} className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-muted/60">
                    <BadgeIcon id={b} size="sm" tip={false} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{BADGES[b].name}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{BADGES[b].description}</span>
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: `oklch(0.72 0.14 ${BADGES[b].hue})` }}>
                      {RARITY[BADGES[b].rarity].label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Popover>
      )}
    </div>
  )
}
