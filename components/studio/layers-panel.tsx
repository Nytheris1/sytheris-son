'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Eraser, Eye, EyeOff, ImagePlus, Layers, Merge, Plus, Trash2 } from 'lucide-react'
import { BLEND_MODES, type BlendMode } from '@/lib/studio/engine'
import { cn } from '@/lib/utils'

export type LayerMeta = { id: string; name: string; visible: boolean; opacity: number; blend: BlendMode }

type Props = {
  layers: LayerMeta[]
  activeId: string
  thumbs: Record<string, string>
  onSelect: (id: string) => void
  onAdd: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMergeDown: () => void
  onMove: (dir: 1 | -1) => void
  onClear: () => void
  onImport: () => void
  onPatch: (id: string, patch: Partial<LayerMeta>) => void
  max: number
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function LayersPanel({ layers, activeId, thumbs, onSelect, onAdd, onDuplicate, onDelete, onMergeDown, onMove, onClear, onImport, onPatch, max }: Props) {
  const [renaming, setRenaming] = useState<string | null>(null)
  const active = layers.find((l) => l.id === activeId)
  const index = layers.findIndex((l) => l.id === activeId)
  const ordered = [...layers].reverse()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Layers className="size-3.5" aria-hidden="true" /> Katmanlar
          <span className="tabular-nums text-foreground/40">
            {layers.length}/{max}
          </span>
        </span>
        <div className="flex">
          <IconBtn label="Yeni katman (Ctrl+Shift+N)" onClick={onAdd} disabled={layers.length >= max}>
            <Plus className="size-4" />
          </IconBtn>
          <IconBtn label="Görsel içe aktar" onClick={onImport} disabled={layers.length >= max}>
            <ImagePlus className="size-4" />
          </IconBtn>
        </div>
      </div>

      {active && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-2.5">
          <div className="flex items-center gap-2">
            <label htmlFor="layer-blend" className="sr-only">
              Karışım modu
            </label>
            <select
              id="layer-blend"
              value={active.blend}
              onChange={(e) => onPatch(active.id, { blend: e.target.value as BlendMode })}
              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-card px-2 text-xs outline-none focus:border-primary"
            >
              {BLEND_MODES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted-foreground">%{Math.round(active.opacity * 100)}</span>
          </div>
          <label htmlFor="layer-opacity" className="sr-only">
            Katman opaklığı
          </label>
          <input
            id="layer-opacity"
            type="range"
            min={0}
            max={100}
            value={Math.round(active.opacity * 100)}
            onChange={(e) => onPatch(active.id, { opacity: Number(e.target.value) / 100 })}
            className="studio-range w-full"
          />
        </div>
      )}

      <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto pr-0.5" role="listbox" aria-label="Katman listesi">
        {ordered.map((l) => {
          const isActive = l.id === activeId
          return (
            <li
              key={l.id}
              role="option"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => onSelect(l.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(l.id)
                }
              }}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-xl border p-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-primary',
                isActive ? 'border-primary/60 bg-primary/10' : 'border-transparent hover:bg-muted',
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPatch(l.id, { visible: !l.visible })
                }}
                className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:text-foreground"
                aria-label={l.visible ? `${l.name} katmanını gizle` : `${l.name} katmanını göster`}
                aria-pressed={!l.visible}
              >
                {l.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
              <span className="studio-checker relative h-9 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                {thumbs[l.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbs[l.id] || '/placeholder.svg'} alt="" className="absolute inset-0 size-full object-contain" />
                )}
              </span>
              {renaming === l.id ? (
                <input
                  autoFocus
                  defaultValue={l.name}
                  aria-label="Katman adı"
                  maxLength={32}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    onPatch(l.id, { name: e.target.value.trim() || l.name })
                    setRenaming(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  className="h-7 min-w-0 flex-1 rounded-md border border-primary bg-background px-1.5 text-xs outline-none"
                />
              ) : (
                <span
                  className={cn('min-w-0 flex-1 truncate text-xs', !l.visible && 'text-muted-foreground line-through')}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setRenaming(l.id)
                  }}
                  title="Yeniden adlandırmak için çift tıkla"
                >
                  {l.name}
                </span>
              )}
              {l.blend !== 'source-over' && <span className="font-mono text-[9px] uppercase text-ink">{BLEND_MODES.find((b) => b.id === l.blend)?.label.slice(0, 4)}</span>}
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-1 border-t border-border pt-2">
        <IconBtn label="Yukarı taşı" onClick={() => onMove(1)} disabled={index >= layers.length - 1}>
          <ArrowUp className="size-4" />
        </IconBtn>
        <IconBtn label="Aşağı taşı" onClick={() => onMove(-1)} disabled={index <= 0}>
          <ArrowDown className="size-4" />
        </IconBtn>
        <IconBtn label="Çoğalt (Ctrl+J)" onClick={onDuplicate} disabled={layers.length >= max}>
          <Copy className="size-4" />
        </IconBtn>
        <IconBtn label="Aşağıyla birleştir (Ctrl+E)" onClick={onMergeDown} disabled={index <= 0}>
          <Merge className="size-4" />
        </IconBtn>
        <IconBtn label="Katmanı temizle (Delete)" onClick={onClear}>
          <Eraser className="size-4" />
        </IconBtn>
        <IconBtn label="Katmanı sil" onClick={onDelete} disabled={layers.length <= 1}>
          <Trash2 className="size-4" />
        </IconBtn>
      </div>
    </div>
  )
}
