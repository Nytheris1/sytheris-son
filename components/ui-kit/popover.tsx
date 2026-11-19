'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type Props = {
  trigger: (p: { open: boolean; toggle: () => void; ref: React.RefObject<HTMLButtonElement | null> }) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'start' | 'end'
  className?: string
  label: string
}

type Pos = { top: number; left?: number; right?: number; maxHeight: number; flip: boolean }

/**
 * Popover rendered in a portal with fixed positioning so it is never clipped by
 * `overflow-hidden` ancestors (cinematic hero sections, cards). Flips upward when there is no room below.
 */
export function Popover({ trigger, children, align = 'end', className, label }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<Pos | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const place = useCallback(() => {
    const el = wrap.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight
    const below = vh - r.bottom - 12
    const above = r.top - 12
    const panelH = panel.current?.offsetHeight ?? 360
    const flip = below < Math.min(panelH, 320) && above > below
    const maxHeight = Math.max(200, (flip ? above : below) - 8)
    const top = flip ? Math.max(8, r.top - 12 - Math.min(panelH, maxHeight)) : r.bottom + 12
    setPos(align === 'end' ? { top, right: Math.max(8, window.innerWidth - r.right), maxHeight, flip } : { top, left: Math.max(8, r.left), maxHeight, flip })
  }, [align])

  useLayoutEffect(() => {
    if (!open) return
    place()
    const id = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!wrap.current?.contains(t) && !panel.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={wrap} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v), ref: btn })}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={panel}
                role="dialog"
                aria-label={label}
                initial={{ opacity: 0, y: pos?.flip ? 6 : -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos?.flip ? 4 : -4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left, right: pos?.right, maxHeight: pos?.maxHeight }}
                className={cn(
                  'z-[120] overflow-y-auto rounded-3xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl shadow-black/20',
                  pos?.flip ? 'origin-bottom' : 'origin-top',
                  className,
                )}
              >
                {children(close)}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
