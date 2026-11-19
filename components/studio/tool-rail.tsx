'use client'

import { Brush, Circle, Eraser, Hand, Highlighter, Minus, PaintBucket, PenTool, Pencil, Pipette, SprayCan, Square, type LucideIcon } from 'lucide-react'
import type { ToolId } from '@/lib/studio/engine'
import { cn } from '@/lib/utils'

export const TOOLS: { id: ToolId; label: string; key: string; icon: LucideIcon; group: number }[] = [
  { id: 'brush', label: 'Fırça', key: 'B', icon: Brush, group: 0 },
  { id: 'pencil', label: 'Kalem', key: 'P', icon: Pencil, group: 0 },
  { id: 'ink', label: 'Mürekkep', key: 'K', icon: PenTool, group: 0 },
  { id: 'airbrush', label: 'Hava fırçası', key: 'A', icon: SprayCan, group: 0 },
  { id: 'marker', label: 'Keçeli kalem', key: 'M', icon: Highlighter, group: 0 },
  { id: 'eraser', label: 'Silgi', key: 'E', icon: Eraser, group: 1 },
  { id: 'fill', label: 'Boya kovası', key: 'G', icon: PaintBucket, group: 1 },
  { id: 'picker', label: 'Damlalık', key: 'I', icon: Pipette, group: 1 },
  { id: 'line', label: 'Çizgi', key: 'L', icon: Minus, group: 2 },
  { id: 'rect', label: 'Dikdörtgen', key: 'R', icon: Square, group: 2 },
  { id: 'ellipse', label: 'Elips', key: 'O', icon: Circle, group: 2 },
  { id: 'pan', label: 'El (Boşluk)', key: 'H', icon: Hand, group: 3 },
]

export function ToolRail({ tool, onTool, className }: { tool: ToolId; onTool: (t: ToolId) => void; className?: string }) {
  return (
    <div role="toolbar" aria-label="Araçlar" aria-orientation="vertical" className={cn('flex gap-1', className)}>
      {TOOLS.map((t, i) => {
        const active = t.id === tool
        const gap = i > 0 && TOOLS[i - 1].group !== t.group
        return (
          <div key={t.id} className={cn('contents')}>
            {gap && <span aria-hidden="true" className="mx-auto my-1 h-px w-6 shrink-0 bg-border max-lg:mx-1 max-lg:my-auto max-lg:h-6 max-lg:w-px" />}
            <button
              type="button"
              onClick={() => onTool(t.id)}
              aria-pressed={active}
              title={`${t.label} (${t.key})`}
              className={cn(
                'group relative grid size-10 shrink-0 place-items-center rounded-xl transition',
                active ? 'bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_var(--primary)]' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <t.icon className="size-[18px]" aria-hidden="true" />
              <span className="sr-only">
                {t.label}, kısayol {t.key}
              </span>
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-popover px-2.5 py-1.5 text-xs text-popover-foreground opacity-0 shadow-lg ring-1 ring-border transition group-hover:opacity-100 lg:block" aria-hidden="true">
                {t.label} <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">{t.key}</kbd>
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
