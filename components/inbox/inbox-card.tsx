'use client'

import { useId } from 'react'
import { ExternalLink, Film, ImageIcon, Maximize2, Trash2 } from 'lucide-react'
import type { InboxItem } from '@/lib/inbox'

export function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function InboxMedia({ item, className, controls = false }: { item: InboxItem; className?: string; controls?: boolean }) {
  const src = `/api/kutu/${item.name}`
  if (item.kind === 'video') {
    return <video src={src} className={className} muted loop playsInline preload="metadata" controls={controls} autoPlay={controls} aria-label={item.original} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src || '/placeholder.svg'} alt={item.original} loading="lazy" className={className} />
}

export function InboxCard({ item, categories, onMove, onRemove, onOpen }: { item: InboxItem; categories: string[]; onMove: (category: string) => void; onRemove: () => void; onOpen: () => void }) {
  const selectId = useId()
  return (
    <li className="group mb-4 flex break-inside-avoid flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full overflow-hidden bg-muted text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onPointerEnter={(e) => e.currentTarget.querySelector('video')?.play().catch(() => {})}
        onPointerLeave={(e) => e.currentTarget.querySelector('video')?.pause()}
        aria-label={`${item.original} — büyüt`}
      >
        <InboxMedia item={item} className="block h-auto w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        <span className="absolute left-2 top-2 flex gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-scrim/75 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-on-scrim backdrop-blur">
            {item.kind === 'video' ? <Film className="size-3" aria-hidden="true" /> : <ImageIcon className="size-3" aria-hidden="true" />}
            {item.kind === 'video' ? 'Video' : 'Foto'}
          </span>
          {item.source && <span className="rounded-full bg-destructive px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-on-scrim">Pin</span>}
        </span>
        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-scrim/75 text-on-scrim opacity-0 backdrop-blur transition group-hover:opacity-100" aria-hidden="true">
          <Maximize2 className="size-3.5" />
        </span>
      </button>
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium" title={item.original}>
            {item.original}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {item.source && (
              <a href={item.source} target="_blank" rel="noopener noreferrer" aria-label="Pini Pinterest'te aç" className="text-muted-foreground transition hover:text-foreground">
                <ExternalLink className="size-4" />
              </a>
            )}
            <button type="button" onClick={onRemove} aria-label={`${item.original} öğesini sil`} className="text-muted-foreground transition hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
        {item.note && <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.note}</p>}
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={selectId} className="sr-only">
            Kategori
          </label>
          <select
            id={selectId}
            value={item.category}
            onChange={(e) => onMove(e.target.value)}
            className="h-8 min-w-0 max-w-[60%] truncate rounded-full border border-border bg-background px-2.5 text-xs outline-none transition focus:border-primary"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {formatSize(item.size)} · {new Date(item.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </li>
  )
}
