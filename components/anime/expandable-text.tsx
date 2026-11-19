'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ExpandableText({ text, lines = 5, className }: { text: string; lines?: number; className?: string }) {
  const [open, setOpen] = useState(false)
  if (!text) return <p className="text-muted-foreground">Açıklama bulunmuyor.</p>
  const long = text.length > 420
  return (
    <div className={className}>
      <div className={cn('whitespace-pre-line text-pretty leading-relaxed text-foreground/80', !open && long && 'line-clamp-[var(--l)]')} style={{ ['--l' as string]: lines }}>
        {text}
      </div>
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-3 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-ink hover:underline">
          {open ? 'Daha az göster' : 'Devamını oku'}
        </button>
      )}
    </div>
  )
}
