'use client'

import { useEffect, useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AnnouncementBar({ text, tone }: { text: string; tone: 'info' | 'warning' | 'success' }) {
  const [hidden, setHidden] = useState(true)
  useEffect(() => {
    setHidden(sessionStorage.getItem('sy-ann') === text)
  }, [text])
  if (!text || hidden) return null
  return (
    <div
      className={cn(
        'relative z-[51] flex items-center justify-center gap-3 px-10 py-2 text-center text-sm',
        tone === 'warning' ? 'bg-destructive text-on-scrim' : 'bg-primary text-primary-foreground',
      )}
      role="status"
    >
      <Megaphone className="size-4 shrink-0" />
      <span className="text-pretty">{text}</span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem('sy-ann', text)
          setHidden(true)
        }}
        aria-label="Duyuruyu kapat"
        className="absolute right-3 grid size-7 place-items-center rounded-full transition hover:bg-black/10"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
