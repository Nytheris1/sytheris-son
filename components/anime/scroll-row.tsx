'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScrollRow({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <div className="group/row relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          'scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10',
          className,
        )}
      >
        {children}
      </div>
      {(['start', 'end'] as const).map((side) => (
        <button
          key={side}
          type="button"
          onClick={() => scroll(side === 'start' ? -1 : 1)}
          aria-label={side === 'start' ? 'Geri kaydır' : 'İleri kaydır'}
          className={cn(
            'absolute top-[38%] z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-border bg-popover/90 shadow-xl backdrop-blur transition md:grid',
            side === 'start' ? '-left-2 lg:left-2' : '-right-2 lg:right-2',
            edges[side] ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover/row:opacity-100 hover:scale-105 focus-visible:opacity-100',
          )}
        >
          {side === 'start' ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
        </button>
      ))}
    </div>
  )
}
