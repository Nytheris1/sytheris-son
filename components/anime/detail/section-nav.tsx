'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function SectionNav({ sections, title }: { sections: { id: string; label: string; count?: number }[]; title: string }) {
  const [active, setActive] = useState(sections[0]?.id)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    const onScroll = () => setStuck(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [sections])

  return (
    <div className="sticky top-[4.5rem] z-30 -mt-6 px-4 sm:px-6 lg:px-10">
      <nav
        aria-label="Sayfa bölümleri"
        className={cn(
          'scrollbar-none mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto rounded-full border p-1.5 transition-all duration-500',
          stuck ? 'border-border bg-popover/90 shadow-xl backdrop-blur-xl' : 'border-transparent bg-transparent',
        )}
      >
        <span className={cn('hidden shrink-0 truncate pl-3 pr-2 text-sm font-semibold transition-all duration-500 md:block', stuck ? 'max-w-56 opacity-100' : 'max-w-0 overflow-hidden pl-0 pr-0 opacity-0')}>
          {title}
        </span>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? 'location' : undefined}
            className={cn('relative isolate shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors', active === s.id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
          >
            {active === s.id && <motion.span layoutId="detail-tab" className="absolute inset-0 -z-10 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            {s.label}
            {typeof s.count === 'number' && s.count > 0 && <span className="ml-1.5 font-mono text-[10px] opacity-70">{s.count}</span>}
          </a>
        ))}
      </nav>
    </div>
  )
}
