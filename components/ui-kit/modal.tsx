'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  hideTitle?: boolean
  children: React.ReactNode
  className?: string
  side?: 'center' | 'right' | 'top'
  showClose?: boolean
}

export function Modal({ open, onClose, title, hideTitle, children, className, side = 'center', showClose = true }: Props) {
  const [mounted, setMounted] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, button, [href]')
      el?.focus()
    }, 40)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  if (!mounted) return null

  const variants =
    side === 'right'
      ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
      : side === 'top'
        ? { initial: { opacity: 0, y: -24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -16, scale: 0.98 } }
        : { initial: { opacity: 0, y: 24, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 0.97 } }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            className="absolute inset-0 bg-scrim/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex',
              side === 'right' ? 'justify-end' : side === 'top' ? 'items-start justify-center px-4 pt-[10vh]' : 'items-end justify-center sm:items-center sm:p-6',
            )}
          >
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={id}
              {...variants}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className={cn(
                'pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-border bg-popover text-popover-foreground shadow-2xl',
                side === 'right' ? 'h-dvh max-h-dvh max-w-md rounded-l-3xl' : 'rounded-t-3xl sm:max-w-lg sm:rounded-3xl',
                className,
              )}
            >
              <h2 id={id} className={cn(hideTitle && 'sr-only', !hideTitle && 'px-6 pt-6 text-xl font-semibold tracking-tight')}>
                {title}
              </h2>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-muted/80 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Kapat"
                >
                  <X className="size-4" />
                </button>
              )}
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
